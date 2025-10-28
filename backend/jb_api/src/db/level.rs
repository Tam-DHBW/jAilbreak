use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct LevelID(pub u64);

#[derive(Serialize, Deserialize, Debug)]
pub struct Level {
    pub level_id: LevelID,
    pub name: String,
    pub prompt_components: Vec<super::PromptComponent>,
    pub next: Vec<LevelID>
}

impl Level {
    pub const TABLE: &'static str = "jb_levels";
    pub const PARTITION: &'static str = "level_id";

    pub const NAME: &'static str = "name";
    pub const PROMPT_COMPONENTS: &'static str = "prompt_components";
    pub const NEXT: &'static str = "next";
}
