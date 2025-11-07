macro_rules! api_routes {
    ( $( [ $( $route_stop:tt ),* ] {
        $( $method:ident $auth:tt-> $handler:expr; )*
    } )* ) => { preinterpret::preinterpret! {
        pub fn generate_terraform() {
            use serde_json::json;

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

        pub fn create_router() -> axum::Router<crate::State> {
            axum::Router::new()
                $(
                    [!set! #route = api_routes!(@route $( $route_stop ),*)]
                    .route(#route, axum::routing::$( [!ident! [!lower! $method]]($handler) ).*)
                )*
        }
    } };
    (@route $( $route_stop:tt ),*) => { concat!("/", $( api_routes!(@route_stop $route_stop), "/" ),*) };
    (@route_stop $fixed:literal) => { $fixed };
    (@route_stop ($param_name:ident)) => { concat!("{", stringify!($param_name), "}") };
    (@auth -) => { false };
    (@auth |) => { true };
}

macro_rules! error_response {
    ($enum_name:ident {
        $(
            $( #[doc = $message:expr] )?
            $variant:ident
            $( [ $status:ident ] )?
            $( ( $( $tup_type:ty $( as $tup_field:ident )? ),* ) )?
            $( { $( $str_field:ident: $str_type:ty ),* } )?
        ),*
        $(,)*
    }) => { preinterpret::preinterpret! {
        #[allow(dead_code, unused_attributes)]
        #[derive(Debug)]
        pub enum $enum_name {
            $( $variant $( ( $( $tup_type ),* ) )? $( { $( $str_field: $str_type ),* } )? ),*
        }

        impl $crate::response::ApiError for $enum_name {
            fn error_type(&self) -> &'static str {
                match self {
                    $(
                        $enum_name::$variant
                        $(( $( [!ignore! $tup_type] _ ),* ))?
                        $({ .. } $( [!ignore! $str_field] )* )?
                        => [!string! $variant]
                    ),*
                }
            }
            fn error_message(&self) -> String {
                #[allow(unused_variables)]
                match self {
                    $(
                        $enum_name::$variant
                        $( ( $(
                            [!set! #field_name = _]
                            $( [!set! #field_name = $tup_field] )?
                            #field_name
                        ),* ) )?
                        $( { $( $str_field ),* } )?
                        => {
                            [!set! #message = [!string! $variant]]
                            $( [!set! #message = ::std::format!($message).trim()] )?
                            #message.to_owned()
                        }
                    ),*
                }
            }
            fn status_code(&self) -> ::axum::http::StatusCode { 
                match self {
                    $(
                        $enum_name::$variant
                        $(( $( [!ignore! $tup_type] _ ),* ))?
                        $({ .. } $( [!ignore! $str_field] )* )?
                        => {
                            [!set! #status_code = INTERNAL_SERVER_ERROR]
                            $( [!set! #status_code = $status] )?
                            ::axum::http::StatusCode::#status_code
                        }
                    ),*
                }
            }
        }

        impl From<$enum_name> for Box<dyn $crate::response::ApiError> {
            fn from(value: $enum_name) -> Self {
                Box::new(value)
            }
        }
    } };
}
