mod level;
mod prompt;

api_routes! {
    ["ping"] {
        GET --> async || { "Pong" };
        POST |-> async || { "Pong Authorized" };
    }
    ["level", (level_id: String), "chat", (session_id: String)] {
        POST |-> level::chat::chat_session;
    }
    ["admin", "prompt", "component"] {
        POST |-> prompt::admin_add_component;
    }
    ["admin", "prompt", "component", (component_id: db::ComponentID)] {
        DELETE |-> prompt::admin_delete_component;
    }
    ["admin", "prompt", "component", (component_id: db::ComponentID), "position"] {
        PUT |-> prompt::admin_move_component;
    }
}

    // TODO path component macro
