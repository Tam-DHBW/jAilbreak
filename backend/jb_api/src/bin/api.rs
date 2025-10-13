use jb_common::tracing::info;
use lambda_http::{tower::Layer};
use tower_http::normalize_path::NormalizePathLayer;

#[tokio::main]
async fn main() {
    jb_common::init_tracing_subscriber();

    info!("Starting API lambda...");

    let router = jb_api::create_router().layer(tower_http::trace::TraceLayer::new_for_http());
    let router = NormalizePathLayer::append_trailing_slash().layer(router);
    lambda_http::run(router).await.unwrap();
}
