use jb_common::tracing::info;

#[tokio::main]
async fn main() {
    jb_common::init_tracing_subscriber();

    info!("Starting API lambda...");

    jb_api::run().await;
}
