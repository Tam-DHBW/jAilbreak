use std::sync::Arc;

use aws_config::SdkConfig;
use lambda_http::tower::Layer;
use tower_http::normalize_path::NormalizePathLayer;

#[macro_use]
mod macros;
mod auth;
mod db;
mod response;
mod routes;

pub use routes::generate_terraform;

pub type ExtractState = axum::extract::State<State>;
pub type State = Arc<InnerState>;
pub struct InnerState {
    #[allow(dead_code)]
    sdk_config: SdkConfig,
    bedrockagent: aws_sdk_bedrockagentruntime::Client,
    dynamo: aws_sdk_dynamodb::Client,
    cognito: aws_sdk_cognitoidentityprovider::Client,
}

pub async fn run() {
    let http_client = {
        use aws_smithy_http_client::{
            Builder,
            tls::{Provider, rustls_provider::CryptoMode},
        };
        Builder::new()
            .tls_provider(Provider::rustls(CryptoMode::Ring))
            .build_https()
    };

    let sdk_config = aws_config::from_env().http_client(http_client).load().await;
    
    #[cfg(feature = "local-testing")]
    {
        use aws_sdk_dynamodb::config::ProvideCredentials;
        if let Err(_) = sdk_config
            .credentials_provider()
            .unwrap()
            .provide_credentials()
            .await
        {
            jb_common::tracing::error!(
                "Credentials loaded from environment are not valid. Shutting down"
            );
            return;
        }
    }

    let bedrockagent = aws_sdk_bedrockagentruntime::Client::new(&sdk_config);
    let dynamo = aws_sdk_dynamodb::Client::new(&sdk_config);
    let cognito = aws_sdk_cognitoidentityprovider::Client::new(&sdk_config);

    let inner_state = InnerState {
        sdk_config,
        bedrockagent,
        dynamo,
        cognito,
    };

    let router = routes::create_router()
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .with_state(Arc::new(inner_state));

    let router = NormalizePathLayer::append_trailing_slash().layer(router);

    lambda_http::run(router).await.unwrap();
}
