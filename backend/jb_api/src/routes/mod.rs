mod levels;
mod prompt;

api_routes! {
    ["ping"] {
        GET --> async || { "Pong" };
        POST |-> async |user: crate::auth::AuthorizedUser| { format!("Pong Authorized, hello {}", user.sub()) };
    }
    ["levels"] {
        GET |-> levels::get_levels;
    }
    ["levels", (level_id), "chat", (session_id)] {
        POST |-> levels::chat::chat_session;
    }
    ["admin", "levels"] {
        GET |-> levels::admin::admin_get_levels;
        POST |-> levels::admin::admin_create_level;
    }
    ["admin", "levels", (level_id)] {
        PATCH |-> levels::admin::admin_modify_level;
        DELETE |-> levels::admin::admin_delete_level;
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
