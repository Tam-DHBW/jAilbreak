use std::collections::HashMap;

use aws_sdk_dynamodb::types::AttributeValue;
use axum::BoxError;
use serde::{Deserialize, Serialize};

use crate::{db, response::MapBoxError};

#[derive(Serialize, Deserialize, Debug)]
pub struct TemplateID(pub String);

impl Default for TemplateID {
    fn default() -> Self {
        Self("default-tempalte".to_owned())
    }
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct ComponentID(pub u64);

#[derive(Serialize, Deserialize, Debug)]
pub struct PromptComponent {
    pub component_id: ComponentID,
    pub template_id: TemplateID,
    pub ordering: String,
    pub text: String,
}

impl PromptComponent {
    pub const TABLE: &'static str = "jb_prompt_templates";
    pub const PARTITION: &'static str = "component_id";
    pub const SECONDARY_TEMPLATE_INDEX: &'static str = "template-index";
    pub const SECONDARY_TEMPLATE_ID: &'static str = "template_id";
    pub const SECONDARY_TEMPLATE_ORDERING: &'static str = "ordering";

    pub async fn create_sort_key(
        client: &aws_sdk_dynamodb::Client,
        predecessor: Option<ComponentID>,
    ) -> Result<Option<String>, BoxError> {
        fn into_ordering(item: &HashMap<String, AttributeValue>) -> Result<String, BoxError> {
            item[db::PromptComponent::SECONDARY_TEMPLATE_ORDERING]
                .as_s()
                .cloned()
                .map_err(|err| {
                    BoxError::from(format!(
                        "Prompt template ordering was not a string but {err:?}"
                    ))
                })
        }

        let components = client
            .query()
            .table_name(db::PromptComponent::TABLE)
            .index_name(db::PromptComponent::SECONDARY_TEMPLATE_INDEX)
            .key_condition_expression("#pk = :pk")
            .expression_attribute_names("#pk", db::PromptComponent::SECONDARY_TEMPLATE_ID)
            .expression_attribute_values(":pk", AttributeValue::S(db::TemplateID::default().0))
            .projection_expression(
                [
                    db::PromptComponent::PARTITION,
                    ",",
                    db::PromptComponent::SECONDARY_TEMPLATE_ORDERING,
                ]
                .concat(),
            )
            .send()
            .await
            .box_error()?
            .items
            .unwrap_or_default();

        let (mut pred_ordering, mut succ_ordering) = (None, None);

        if let Some(predecessor) = predecessor {
            let mut components = components.iter();

            let Some(predecessor) = components.find(|component| {
                component.get(db::PromptComponent::PARTITION)
                    == Some(&AttributeValue::N(predecessor.0.to_string()))
            }) else {
                return Ok(None);
            };

            pred_ordering = Some(into_ordering(predecessor)?);
            succ_ordering = components.next().map(into_ordering).transpose()?;
        } else if let Some(first) = components.first() {
            succ_ordering = Some(into_ordering(first)?)
        }

        Ok(Some(db::PromptComponent::create_sort_key_between(
            pred_ordering.as_deref(),
            succ_ordering.as_deref(),
        )))
    }

    /// Given two lexicographically sorted keys produced by this function,
    /// return a new key, whose sorting order is guaranteed to be between the provided keys
    fn create_sort_key_between(predecessor: Option<&str>, successor: Option<&str>) -> String {
        let predecessor = predecessor.unwrap_or("");

        let mut between = [predecessor, "1"].concat();

        if let Some(successor) = successor {
            while *between >= *successor {
                assert!(between.len() < 100000, "Prompt component sort key overflow");
                between.insert(between.len() - 1, '0');
            }
        }

        between
    }
}
