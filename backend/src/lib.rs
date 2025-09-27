use serde_json::json;
use preinterpret::preinterpret;

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
    } };
    (@route $( $route_stop:tt ),*) => { ::std::concat!("/", $( api_routes!(@route_stop $route_stop), "/" ),*) };
    (@route_stop $fixed:literal) => { $fixed };
    (@route_stop ($param_name:ident: $param_type:ty)) => { ::std::concat!("{", ::std::stringify!($param_name), "}") };
    (@auth -) => { false };
    (@auth |) => { true };
}

api_routes! {
    ["abc", "def"] {
        GET --> handler_a;
        POST |-> handler_b;
    }
    ["user", (id: u8), "profile"] {
        GET --> handler_c;
    }
}
