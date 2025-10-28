use aws_sdk_dynamodb::{operation::update_item::UpdateItemError, types::AttributeValue};
use axum::{
    BoxError, Json,
    extract::{FromRequest, Path},
};
use serde::{Deserialize, Serialize};
use serde_dynamo::to_item;

use crate::{
    ExtractState, db,
    response::{ApiResult, MapBoxError},
};

#[derive(Serialize, Debug)]
pub struct AddComponentResponse {
    component_id: db::ComponentID,
}

error_response!(AddComponentError {
    /// Unable to create prompt component
    ComponentCreation(BoxError)
});

pub async fn admin_add_component(state: ExtractState) -> ApiResult<Json<AddComponentResponse>> {
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

error_response!(DeleteComponentError {
    /// Component does not exist
    DoesNotExist[NOT_FOUND],
    /// Unable to delete prompt component
    ComponentDeletion(BoxError)
});

pub async fn admin_delete_component(
    state: ExtractState,
    Path(component_id): Path<db::ComponentID>,
) -> ApiResult<()> {
    match state
        .dynamo
        .delete_item()
        .table_name(db::PromptComponent::TABLE)
        .key(
            db::PromptComponent::PARTITION,
            AttributeValue::N(component_id.0.to_string()),
        )
        .send()
        .await
        .map_err(|e| e.into_service_error())
    {
        Ok(_) => Ok(()),
        Err(
            aws_sdk_dynamodb::operation::delete_item::DeleteItemError::ResourceNotFoundException(_),
        ) => Err(DeleteComponentError::DoesNotExist),
        Err(err) => Err(DeleteComponentError::ComponentDeletion(Box::new(err))),
    }?;

    Ok(())
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct MoveComponentRequest {
    predecessor: Option<db::ComponentID>,
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
    state: ExtractState,
    Path(component_id): Path<db::ComponentID>,
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
