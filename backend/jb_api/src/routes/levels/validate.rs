use axum::{
    Json,
    extract::{FromRequest, Path},
};
use serde::Deserialize;
use serde_dynamo::from_item;

use super::*;

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct ValidatePasswordRequest {
    password: String,
}

#[derive(Serialize, Debug)]
pub struct ValidatePasswordResponse {
    is_correct: bool,
}

error_response!(ValidatePasswordError {
    /// Level does not exist
    DoesNotExist[NOT_FOUND],
    /// Unable to fetch level data
    QueryLevel(BoxError)
});

pub async fn validate_password(
    state: ExtractState,
    Path(level_id): Path<LevelID>,
    request: ValidatePasswordRequest,
) -> ApiResult<Json<ValidatePasswordResponse>> {
    let level = state
        .dynamo
        .get_item()
        .table_name(db::Level::TABLE)
        .key(
            db::Level::PARTITION,
            aws_sdk_dynamodb::types::AttributeValue::N(level_id.0.to_string()),
        )
        .send()
        .await
        .box_error()
        .map_err(ValidatePasswordError::QueryLevel)?
        .item
        .ok_or(ValidatePasswordError::DoesNotExist)?;

    let level: db::Level = from_item(level)
        .box_error()
        .map_err(ValidatePasswordError::QueryLevel)?;

    let is_correct = level.password.trim() == request.password.trim();

    Ok(Json(ValidatePasswordResponse { is_correct }))
}
