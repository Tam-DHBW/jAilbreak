use std::hash::{DefaultHasher, Hash, Hasher};

use aws_sdk_dynamodb::{operation::update_item::UpdateItemError, types::AttributeValue};
use axum::{
    BoxError, Json, debug_handler,
    extract::{FromRequest, Path},
};
use itertools::Itertools;
use serde::Deserialize;
use serde_dynamo::{to_attribute_value, to_item};

use crate::{
    ExtractState,
    auth::AuthorizedLevelManager,
    db,
    response::{ApiResult, MapBoxError},
};

use super::*;

pub use db::Level as AdminLevel;

#[derive(Serialize, Debug)]
pub struct AdminGetLevelsResponse {
    pub levels: Vec<AdminLevel>,
}

error_response!(AdminGetLevelsError {
    /// Faield to fetch levels
    QueryLevels(BoxError)
});

#[debug_handler(state=crate::State)]
pub async fn admin_get_levels(
    _: AuthorizedLevelManager,
    state: ExtractState,
) -> ApiResult<Json<AdminGetLevelsResponse>> {
    let levels: Vec<db::Level> = state
        .dynamo
        .scan()
        .table_name(db::Level::TABLE)
        .send()
        .await
        .box_error()
        .and_then(|output| from_items(output.items.unwrap_or_default()).box_error())
        .map_err(GetLevelsError::QueryLevels)?;

    Ok(Json(AdminGetLevelsResponse { levels }))
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct CreateLevelRequest {
    name: String,
}

#[derive(Serialize, Debug)]
pub struct CreateLevelResponse {
    level: AdminLevel,
}

error_response!(CreateLevelError {
    /// Failed to create level
    LevelCreation(BoxError)
});

pub async fn admin_create_level(
    _: AuthorizedLevelManager,
    state: ExtractState,
    request: CreateLevelRequest,
) -> ApiResult<Json<CreateLevelResponse>> {
    let level_id = db::LevelID(db::Counter::increment(&state.dynamo, db::Counter::LEVEL_ID).await?);

    let password = {
        let mut hasher = DefaultHasher::default();
        std::time::Instant::now().hash(&mut hasher);
        format!("{:x}", hasher.finish())
    };

    let level = db::Level {
        level_id,
        name: request.name,
        password,
        difficulty: db::LevelDifficulty::Low,
        prompt_components: Vec::new(),
        is_root: false,
        next: Vec::new(),
    };

    state
        .dynamo
        .put_item()
        .table_name(db::Level::TABLE)
        .set_item(Some(
            to_item(&level)
                .box_error()
                .map_err(CreateLevelError::LevelCreation)?,
        ))
        .send()
        .await
        .box_error()
        .map_err(CreateLevelError::LevelCreation)?;

    Ok(Json(CreateLevelResponse { level }))
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct ModifyLevelRequest {
    name: Option<String>,
    password: Option<String>,
    difficulty: Option<db::LevelDifficulty>,
    prompt_components: Option<Vec<crate::routes::prompt::ComponentID>>,
    is_root: Option<bool>,
    next: Option<Vec<LevelID>>,
}

error_response!(ModifyLevelError {
    /// Level does not exist
    DoesNotExist[NOT_FOUND],
    /// Failed to modify level
    LevelModification(BoxError)
});

pub async fn admin_modify_level(
    _: AuthorizedLevelManager,
    state: ExtractState,
    Path(level_id): Path<LevelID>,
    request: ModifyLevelRequest,
) -> ApiResult<()> {
    let mut actions: Vec<(&str, (&str, AttributeValue))> = Vec::new();

    if let Some(name) = request.name {
        actions.push(("name", (db::Level::NAME, AttributeValue::S(name))));
    }

    if let Some(password) = request.password {
        actions.push((
            "password",
            (db::Level::PASSWORD, AttributeValue::S(password)),
        ));
    }

    if let Some(difficulty) = request.difficulty {
        actions.push((
            "difficulty",
            (
                db::Level::DIFFICULTY,
                to_attribute_value(difficulty).expect("Cant convert attribute value to string"),
            ),
        ));
    }

    if let Some(prompt_components) = request.prompt_components {
        actions.push((
            "prompt_components",
            (
                db::Level::PROMPT_COMPONENTS,
                to_attribute_value(
                    prompt_components
                        .into_iter()
                        .map(|component| component.0)
                        .collect_vec(),
                )
                .box_error()
                .map_err(ModifyLevelError::LevelModification)?,
            ),
        ));
    }

    if let Some(is_root) = request.is_root {
        actions.push(("is_root", (db::Level::IS_ROOT, AttributeValue::Bool(is_root))));
    }

    if let Some(next) = request.next {
        actions.push((
            "next",
            (
                db::Level::NEXT,
                to_attribute_value(next.into_iter().map(|level| level.0).collect_vec())
                    .box_error()
                    .map_err(ModifyLevelError::LevelModification)?,
            ),
        ));
    }

    let mut update = state
        .dynamo
        .update_item()
        .table_name(db::Level::TABLE)
        .key(
            db::Level::PARTITION,
            AttributeValue::N(level_id.0.to_string()),
        )
        .condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", db::Level::PARTITION)
        .expression_attribute_values(":pk", AttributeValue::N(level_id.0.to_string()))
        .update_expression(
            actions
                .iter()
                .map(|(placeholder, _)| format!("SET #{placeholder} = :{placeholder}"))
                .join(" "),
        );

    for (placeholder, (key, value)) in actions {
        update = update
            .expression_attribute_names(["#", placeholder].concat(), key.to_owned())
            .expression_attribute_values([":", placeholder].concat(), value);
    }

    update
        .send()
        .await
        .map_err(|err| match err.into_service_error() {
            UpdateItemError::ConditionalCheckFailedException(_) => ModifyLevelError::DoesNotExist,
            err => ModifyLevelError::LevelModification(Box::new(err)),
        })?;

    Ok(())
}

error_response!(DeleteLevelError {
    /// Faield to delete level
    LevelDeletion(BoxError)
});

pub async fn admin_delete_level(
    _: AuthorizedLevelManager,
    state: ExtractState,
    Path(level_id): Path<LevelID>,
) -> ApiResult<()> {
    state
        .dynamo
        .delete_item()
        .table_name(db::Level::TABLE)
        .key(
            db::Level::PARTITION,
            AttributeValue::N(level_id.0.to_string()),
        )
        .send()
        .await
        .box_error()
        .map_err(DeleteLevelError::LevelDeletion)?;

    Ok(())
}
