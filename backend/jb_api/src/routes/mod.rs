use lambda_http::RequestExt;

api_routes! {
    ["abc", "def"] {
        GET --> async || { "Hello" };
        POST |-> async || { "World" };
    }
    ["user", (id: u8), "profile"] {
        GET --> async |axum::extract::Path(id): axum::extract::Path<u8>| { format!("Hello user with id {id}") };
    }
    ["me"] {
        GET |-> async |req: axum::extract::Request| { format!("Hello {sub}", sub = req.request_context().authorizer().unwrap().fields["sub"].as_str().unwrap()) };
    }
}
