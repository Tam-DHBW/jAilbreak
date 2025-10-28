mod level;
mod prompt;

api_routes! {
    ["ping"] {
        GET --> async || { "Pong" };
        POST |-> async |user: crate::auth::AuthorizedUser| { format!("Pong Authorized, hello {}", user.sub()) };
    }
    ["levels", (level_id), "chat", (session_id)] {
        POST |-> level::chat::chat_session;
    }
    ["admin", "prompt", "components"] {
        GET |-> prompt::admin_get_components;
        POST |-> prompt::admin_add_component;
    }
    ["admin", "prompt", "components", (component_id)] {
        PUT |-> prompt::admin_modify_component;
        DELETE |-> prompt::admin_delete_component;
    }
    ["admin", "prompt", "components", (component_id), "position"] {
        PUT |-> prompt::admin_move_component;
    }
}
