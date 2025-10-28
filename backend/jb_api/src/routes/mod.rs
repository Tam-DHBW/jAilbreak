mod level;
mod prompt;

api_routes! {
    ["ping"] {
        GET --> async || { "Pong" };
        POST |-> async |user: crate::auth::AuthorizedUser| { format!("Pong Authorized, hello {}", user.sub()) };
    }
    ["level", (level_id: String), "chat", (session_id: String)] {
        POST |-> level::chat::chat_session;
    }
    ["admin", "prompt", "components"] {
        GET |-> prompt::admin_get_components;
        POST |-> prompt::admin_add_component;
    }
    ["admin", "prompt", "components", (component_id: db::ComponentID)] {
        PUT |-> prompt::admin_modify_component;
        DELETE |-> prompt::admin_delete_component;
    }
    ["admin", "prompt", "components", (component_id: db::ComponentID), "position"] {
        PUT |-> prompt::admin_move_component;
    }
}

// TODO path component macro
