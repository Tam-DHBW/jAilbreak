use std::env;
use tracing_subscriber::filter::LevelFilter;

pub use tracing;

pub fn init_tracing_subscriber() {
    let log_format = env::var("AWS_LAMBDA_LOG_FORMAT").unwrap_or_default();
    let log_level: LevelFilter = env::var("AWS_LAMBDA_LOG_LEVEL")
        .unwrap_or("INFO".to_owned())
        .parse()
        .unwrap();

    let subscriber = tracing_subscriber::fmt()
        .with_ansi(false)
        .with_target(false)
        .without_time()
        .with_max_level(log_level);

    if log_format.eq_ignore_ascii_case("json") {
        subscriber.json().init()
    } else {
        subscriber.init()
    }
}
