use axum::{
    BoxError,
    extract::FromRequestParts,
    response::{IntoResponse, Response},
};
use lambda_http::RequestExt;

use crate::response::{BoxApiError, MapBoxError};

struct Sub(String);

pub struct AuthorizedUser<E = ()> {
    sub: Sub,
    _extra: E,
}

impl<E> AuthorizedUser<E> {
    pub fn sub(&self) -> &str {
        &self.sub.0
    }
}

error_response!(AuthorizationError {
    /// The request was not authorized
    NotAuthorized[UNAUTHORIZED],
    /// User is not an administrator
    NotAnAdmin[FORBIDDEN],
    /// Unable to verify whether user is admin
    AdminAssertion(BoxError)
});

impl<E, S> FromRequestParts<S> for AuthorizedUser<E>
where
    S: Send + Sync,
    for<'a> E: FromRequestParts<(&'a Sub, &'a S)>,
{
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let sub: Sub = 'sub: {
            #[cfg(feature = "local-testing")]
            {
                use axum::http::HeaderValue;
                if let Some(Ok(sub)) = parts
                    .headers
                    .get("JAILBREAK_USER_SUB")
                    .map(HeaderValue::to_str)
                {
                    break 'sub Sub(sub.to_owned());
                }
            }

            break 'sub parts
                .request_context_ref()
                .and_then(|context| context.authorizer())
                .and_then(|authorizer| authorizer.fields.get("sub"))
                .and_then(|sub| sub.as_str())
                .map(|sub| Sub(sub.to_owned()))
                .ok_or(BoxApiError::from(AuthorizationError::NotAuthorized).into_response())?;
        };

        let extra = E::from_request_parts(parts, &(&sub, &state))
            .await
            .map_err(|err| err.into_response())?;

        Ok(AuthorizedUser { sub, _extra: extra })
    }
}

pub type AuthorizedAdmin = AuthorizedUser<AssertAdmin>;

pub struct AssertAdmin;

impl FromRequestParts<(&Sub, &crate::State)> for AssertAdmin {
    type Rejection = BoxApiError;

    async fn from_request_parts(
        _parts: &mut axum::http::request::Parts,
        (sub, state): &(&Sub, &crate::State),
    ) -> Result<Self, Self::Rejection> {
        let user_pool = std::env::var("COGNITO_USER_POOL")
            .box_error()
            .map_err(AuthorizationError::AdminAssertion)?;

        let groups = state
            .cognito
            .admin_list_groups_for_user()
            .user_pool_id(user_pool)
            .username(&sub.0)
            .send()
            .await
            .box_error()
            .map_err(AuthorizationError::AdminAssertion)?;

        if groups
            .groups()
            .iter()
            .any(|group| group.group_name() == Some("Administrator"))
        {
            Ok(AssertAdmin)
        } else {
            Err(AuthorizationError::NotAnAdmin.into())
        }
    }
}
