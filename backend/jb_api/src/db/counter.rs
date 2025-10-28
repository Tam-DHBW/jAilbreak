use aws_sdk_dynamodb::types::{AttributeValue, ReturnValue};
use axum::BoxError;
use serde::{Deserialize, Serialize};
use serde_dynamo::from_item;

use crate::response::{ApiResult, MapBoxError};

#[derive(Serialize, Deserialize, Debug)]
pub struct Counter {
    pub name: String,
    pub count: u64,
}

impl Counter {
    pub const TABLE: &'static str = "jb_counters";
    pub const PARTITION: &'static str = "name";

    pub const LEVEL_ID: &'static str = "level_id";
    pub const PROMPT_COMPONENT_ID: &'static str = "prompt_component_id";
}

error_response!(CounterError {
    /// Failed to increment counter
    CounterIncrementFailed {
        counter: &'static str,
        err: BoxError
    }
});

impl Counter {
    pub async fn increment(
        client: &aws_sdk_dynamodb::Client,
        counter: &'static str,
    ) -> ApiResult<u64> {
        let new_value: Counter = client
            .update_item()
            .table_name(Self::TABLE)
            .key(Self::PARTITION, AttributeValue::S(counter.into()))
            .update_expression("ADD #field :amount")
            .expression_attribute_names("#field", "count")
            .expression_attribute_values(":amount", AttributeValue::N("1".into()))
            .return_values(ReturnValue::AllNew)
            .send()
            .await
            .box_error()
            .and_then(|output| {
                from_item(output.attributes.expect("No attributes returned")).box_error()
            })
            .map_err(|err| CounterError::CounterIncrementFailed { counter, err })?;

        Ok(new_value.count)
    }
}
