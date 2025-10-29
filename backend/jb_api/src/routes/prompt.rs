use aws_sdk_dynamodb::{operation::update_item::UpdateItemError, types::AttributeValue};
use axum::{
    BoxError, Json,
    extract::{FromRequest, Path},
};
use serde::{Deserialize, Serialize};
use serde_dynamo::{from_items, to_item};

use crate::{
    auth::AuthorizedAdmin, db, response::{ApiResult, MapBoxError}, ExtractState
};

pub use db::ComponentID;

#[derive(Serialize, Debug)]
pub struct Component {
    id: ComponentID,
    text: String,
}

#[derive(Serialize, Debug)]
pub struct GetComponentsResponse {
    /// Ordered list of components
    components: Vec<Component>,
}

error_response!(GetComponentsError {
    /// Failed to fetch prompt components
    QueryComponents(BoxError)
});

pub async fn admin_get_components(
    _: AuthorizedAdmin,
    state: ExtractState,
) -> ApiResult<Json<GetComponentsResponse>> {
    let components: Vec<db::PromptComponent> = state
        .dynamo
        .query()
        .table_name(db::PromptComponent::TABLE)
        .index_name(db::PromptComponent::SECONDARY_TEMPLATE_INDEX)
        .key_condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", db::PromptComponent::SECONDARY_TEMPLATE_ID)
        .expression_attribute_values(":pk", AttributeValue::S(db::TemplateID::default().0))
        .send()
        .await
        .box_error()
        .and_then(|output| from_items(output.items.unwrap_or_default()).box_error())
        .map_err(GetComponentsError::QueryComponents)?;

    let components = components
        .into_iter()
        .map(|component| Component {
            id: component.component_id,
            text: component.text,
        })
        .collect();

    Ok(Json(GetComponentsResponse { components }))
}

#[derive(Serialize, Debug)]
pub struct AddComponentResponse {
    component_id: ComponentID,
}

error_response!(AddComponentError {
    /// Unable to create prompt component
    ComponentCreation(BoxError)
});

pub async fn admin_add_component(
    _: AuthorizedAdmin,
    state: ExtractState,
) -> ApiResult<Json<AddComponentResponse>> {
    let component_id = db::ComponentID(
        db::Counter::increment(&state.dynamo, db::Counter::PROMPT_COMPONENT_ID).await?,
    );
    let sdsdsdsd = db::PromptComponent::create_sort_key(&state.dynamo, None)
        .await
        .map_err(AddComponentError::ComponentCreation)?
        .unwrap();

    let component = db::PromptComponent {
        component_id: component_id,
        template_id: db::TemplateID::default(),
        ordering: sdsdsdsd,
        text: String::default(),
    };

    state
        .dynamo
        .put_item()
        .table_name(db::PromptComponent::TABLE)
        .set_item(Some(
            to_item(component)
                .box_error()
                .map_err(AddComponentError::ComponentCreation)?,
        ))
        .send()
        .await
        .box_error()
        .map_err(AddComponentError::ComponentCreation)?;

    Ok(Json(AddComponentResponse { component_id }))
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct ModifyComponentRequest {
    new_text: String,
}

error_response!(ModifyComponentError {
    /// Component does not exist
    DoesNotExist[NOT_FOUND],
    /// Failed to update component
    UpdateComponent(BoxError)
});

pub async fn admin_modify_component(
    _: AuthorizedAdmin,
    state: ExtractState,
    Path(component_id): Path<ComponentID>,
    request: ModifyComponentRequest,
) -> ApiResult<()> {
    match state
        .dynamo
        .update_item()
        .table_name(db::PromptComponent::TABLE)
        .key(
            db::PromptComponent::PARTITION,
            AttributeValue::N(component_id.0.to_string()),
        )
        .update_expression("SET #text = :text")
        .expression_attribute_names("#text", db::PromptComponent::TEXT)
        .expression_attribute_values(":text", AttributeValue::S(request.new_text))
        .condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", db::PromptComponent::PARTITION)
        .expression_attribute_values(":pk", AttributeValue::N(component_id.0.to_string()))
        .send()
        .await
        .map_err(|err| err.into_service_error())
    {
        Err(UpdateItemError::ConditionalCheckFailedException(_)) => {
            Err(ModifyComponentError::DoesNotExist)
        }
        output => output
            .box_error()
            .map_err(ModifyComponentError::UpdateComponent),
    }?;

    Ok(())
}

error_response!(DeleteComponentError {
    /// Unable to delete prompt component
    ComponentDeletion(BoxError)
});

pub async fn admin_delete_component(
    _: AuthorizedAdmin,
    state: ExtractState,
    Path(component_id): Path<ComponentID>,
) -> ApiResult<()> {
    state
        .dynamo
        .delete_item()
        .table_name(db::PromptComponent::TABLE)
        .key(
            db::PromptComponent::PARTITION,
            AttributeValue::N(component_id.0.to_string()),
        )
        .send()
        .await
        .box_error()
        .map_err(DeleteComponentError::ComponentDeletion)?;

    Ok(())
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct MoveComponentRequest {
    predecessor: Option<ComponentID>,
}

error_response!(MoveComponentError {
    // Prompt component does not exist
    DoesNotExist[NOT_FOUND],
    /// Predecessor does not exist
    PredecessorDoesNotExist[NOT_FOUND],
    /// Failed to fetch adjacent prompt component
    QueryAdjacent(BoxError),
    /// Failed to update component position
    UpdatePosition(BoxError)
});

pub async fn admin_move_component(
    _: AuthorizedAdmin,
    state: ExtractState,
    Path(component_id): Path<ComponentID>,
    request: MoveComponentRequest,
) -> ApiResult<()> {
    let ordering = db::PromptComponent::create_sort_key(&state.dynamo, request.predecessor)
        .await
        .map_err(MoveComponentError::QueryAdjacent)?
        .ok_or(MoveComponentError::PredecessorDoesNotExist)?;

    state
        .dynamo
        .update_item()
        .table_name(db::PromptComponent::TABLE)
        .key(
            db::PromptComponent::PARTITION,
            AttributeValue::N(component_id.0.to_string()),
        )
        .update_expression("SET #sort = :sort")
        .expression_attribute_names("#sort", db::PromptComponent::SECONDARY_TEMPLATE_ORDERING)
        .expression_attribute_values(":sort", AttributeValue::S(ordering))
        .condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", db::PromptComponent::PARTITION)
        .expression_attribute_values(":pk", AttributeValue::N(component_id.0.to_string()))
        .send()
        .await
        .map_err(|err| match err.into_service_error() {
            UpdateItemError::ConditionalCheckFailedException(_) => MoveComponentError::DoesNotExist,
            err => MoveComponentError::UpdatePosition(Box::new(err)),
        })?;

    Ok(())
}
