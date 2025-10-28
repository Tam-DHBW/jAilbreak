use serde::{Serialize};

pub mod chat;

pub use crate::db::LevelID;

#[derive(Serialize, Debug)]
pub struct Level {
    id: LevelID,
    name: String,
    next: Vec<LevelID>
}
