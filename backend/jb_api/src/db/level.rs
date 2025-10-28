use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct LevelID(pub u64);

#[derive(Serialize, Deserialize, Debug)]
pub struct LevelPrompt {

}

#[derive(Serialize, Deserialize, Debug)]
pub struct Level {
    pub level_id: LevelID,
    pub name: String,
    pub next: Vec<LevelID>
}

impl Level {
    pub const TABLE: &'static str = "jb_levels";
    pub const PARTITION: &'static str = "level_id";
}
