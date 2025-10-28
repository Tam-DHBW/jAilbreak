use axum::{
    extract::{FromRequestParts, OptionalFromRequestParts},
    http::StatusCode,
};
use lambda_http::RequestExt;

use crate::response::BoxApiError;

pub struct AuthorizedUser {
    sub: String,
}

impl AuthorizedUser {
    pub fn sub(&self) -> &str {
        &self.sub
    }
}

error_response!(AuthorizationError {
    /// The request was not authorized
    NotAuthorized[UNAUTHORIZED]
});

impl<S: Sync + Send> FromRequestParts<S> for AuthorizedUser {
    type Rejection = BoxApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        <AuthorizedUser as OptionalFromRequestParts<S>>::from_request_parts(parts, state)
            .await
            .ok()
            .flatten()
            .ok_or(AuthorizationError::NotAuthorized.into())
    }
}

impl<S: Sync + Send> OptionalFromRequestParts<S> for AuthorizedUser {
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _: &S,
    ) -> Result<Option<Self>, Self::Rejection> {
        Ok(parts
            .request_context_ref()
            .and_then(|context| context.authorizer())
            .and_then(|authorizer| authorizer.fields.get("sub"))
            .and_then(|sub| sub.as_str())
            .map(|sub| AuthorizedUser {
                sub: sub.to_owned(),
            }))
    }
}
