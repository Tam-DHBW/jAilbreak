use lambda_http::{tower::Layer, tracing::info};
use tower_http::normalize_path::NormalizePathLayer;

#[tokio::main]
async fn main() {
    lambda_http::tracing::init_default_subscriber();

    info!("Starting API lambda...");

    let router = backend::create_router().layer(tower_http::trace::TraceLayer::new_for_http());
    let router = NormalizePathLayer::append_trailing_slash().layer(router);
    lambda_http::run(router).await.unwrap();
}
