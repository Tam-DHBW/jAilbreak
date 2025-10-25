use std::fmt::Debug;

use axum::{Json, http::StatusCode, response::IntoResponse};
use jb_common::tracing;
use serde::Serialize;

pub type ApiResult<T> = Result<T, Box<dyn ApiError>>;

pub trait ApiError: Debug {
    fn error_type(&self) -> &'static str;
    fn error_message(&self) -> String;
    fn status_code(&self) -> StatusCode;
}

impl IntoResponse for Box<dyn ApiError> {
    fn into_response(self) -> axum::response::Response {
        if self.status_code().is_server_error() {
            tracing::error!(
                "[{}] {} | {:?}",
                self.error_type(),
                self.error_message(),
                self
            );
        }

        #[derive(Serialize)]
        pub struct ApiErrorResponse {
            r#type: &'static str,
            message: String,
        }

        (
            self.status_code(),
            Json(ApiErrorResponse {
                r#type: self.error_type(),
                message: self.error_message(),
            }),
        )
            .into_response()
    }
}
