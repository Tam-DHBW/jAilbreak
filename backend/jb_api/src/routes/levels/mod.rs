use axum::{BoxError, Json};
use serde::Serialize;
use serde_dynamo::from_items;

pub mod admin;
pub mod chat;
pub mod validate;

use crate::{
    ExtractState, db,
    response::{ApiResult, MapBoxError},
};


pub use crate::db::{LevelID, LevelDifficulty};

#[derive(Serialize, Debug)]
pub struct Level {
    id: LevelID,
    name: String,
    difficulty: LevelDifficulty,
    next: Vec<LevelID>,
}

#[derive(Serialize, Debug)]
pub struct GetLevelsResponse {
    pub levels: Vec<Level>,
}

error_response!(GetLevelsError {
    /// Faield to fetch levels
    QueryLevels(BoxError)
});

pub async fn get_levels(state: ExtractState) -> ApiResult<Json<GetLevelsResponse>> {
    let levels: Vec<db::Level> = state
        .dynamo
        .scan()
        .table_name(db::Level::TABLE)
        .send()
        .await
        .box_error()
        .and_then(|output| from_items(output.items.unwrap_or_default()).box_error())
        .map_err(GetLevelsError::QueryLevels)?;

    let levels = levels
        .into_iter()
        .map(|level| Level {
            id: level.level_id,
            name: level.name,
            difficulty: level.difficulty,
            next: level.next,
        })
        .collect();

    Ok(Json(GetLevelsResponse { levels }))
}
