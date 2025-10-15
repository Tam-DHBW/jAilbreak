mod level;

api_routes! {
    ["ping"] {
        GET --> async || { "Pong" };
        POST |-> async || { "Pong Authorized" };
    }
    ["level", (level_id: String), "chat", (session_id: String)] {
        POST |-> level::chat::chat_session;
    }
}
