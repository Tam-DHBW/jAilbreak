use axum::{Router, routing::MethodRouter};
use preinterpret::preinterpret;
use serde_json::json;

macro_rules! api_routes {
    ( $( [ $( $route_stop:tt ),* ] {
        $( $method:ident $auth:tt-> $handler:expr; )*
    } )* ) => { preinterpret! {
        pub fn generate_terraform() {
            let api_spec = json!({ $(
                [!set! #route = api_routes!(@route $( $route_stop ),*)]
                #route: { $(
                    [!set! #require_auth = api_routes!(@auth $auth)]
                    [!lower! $method]: {
                        "require_auth": #require_auth
                    }
                ),* }
            ),* });

            dbg!(&api_spec);
            println!("{}", json!({
                "encoded": json!(api_spec).to_string(),
            }));
        }

        pub fn create_router() -> Router {
            Router::new()
                $(
                    [!set! #route = api_routes!(@route $( $route_stop ),*)]
                    .route(#route, {
                        MethodRouter::new()
                            $(
                                .[!ident! [!lower! $method]]($handler)
                            )*
                    })
                )*
        }
    } };
    (@route $( $route_stop:tt ),*) => { concat!("/", $( api_routes!(@route_stop $route_stop), "/" ),*) };
    (@route_stop $fixed:literal) => { $fixed };
    (@route_stop ($param_name:ident: $param_type:ty)) => { concat!("{", stringify!($param_name), "}") };
    (@auth -) => { false };
    (@auth |) => { true };
}

api_routes! {
    ["abc", "def"] {
        GET --> async || { "Hello" };
        POST |-> async || { "World" };
    }
    ["user", (id: u8), "profile"] {
        GET --> async |axum::extract::Path(id): axum::extract::Path<u8>| { format!("Hello user with id {id}") };
    }
}
