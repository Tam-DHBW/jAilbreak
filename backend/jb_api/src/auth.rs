use axum::{
    BoxError,
    extract::FromRequestParts,
    response::{IntoResponse, Response},
};
use lambda_http::RequestExt;

use crate::response::{ApiResult, BoxApiError, MapBoxError};

struct Username(String);

pub struct AuthorizedModerator<E = ()> {
    username: Username,
    _extra: E,
}

impl<E> AuthorizedModerator<E> {
    pub fn username(&self) -> &str {
        &self.username.0
    }
}

error_response!(AuthorizationError {
    /// The request was not authorized
    NotAuthorized[UNAUTHORIZED],
    /// User is not a level manager
    NotALevelManager[FORBIDDEN],
    /// Unable to retreive user groups
    RetrieveGroups(BoxError)
});

impl<E, S> FromRequestParts<S> for AuthorizedModerator<E>
where
    S: Send + Sync,
    for<'a> E: FromRequestParts<(&'a Username, &'a S)>,
{
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let sub: Username = 'username: {
            #[cfg(feature = "local-testing")]
            {
                use axum::http::HeaderValue;
                if let Some(Ok(username)) = parts
                    .headers
                    .get("JAILBREAK_MODERATOR_NAME")
                    .map(HeaderValue::to_str)
                {
                    break 'username Username(username.to_owned());
                }
            }

            break 'username parts
                .request_context_ref()
                .and_then(|context| context.authorizer())
                .and_then(|authorizer| authorizer.fields.get("username"))
                .and_then(|sub| sub.as_str())
                .map(|sub| Username(sub.to_owned()))
                .ok_or(BoxApiError::from(AuthorizationError::NotAuthorized).into_response())?;
        };

        let extra = E::from_request_parts(parts, &(&sub, &state))
            .await
            .map_err(|err| err.into_response())?;

        Ok(AuthorizedModerator { username: sub, _extra: extra })
    }
}

pub type AuthorizedLevelManager = AuthorizedModerator<AssertLevelManager>;

pub struct AssertLevelManager;

impl FromRequestParts<(&Username, &crate::State)> for AssertLevelManager {
    type Rejection = BoxApiError;

    async fn from_request_parts(
        _parts: &mut axum::http::request::Parts,
        (sub, state): &(&Username, &crate::State),
    ) -> Result<Self, Self::Rejection> {
        if is_in_group(&state.cognito, sub, "LevelManager")
            .await
            .map_err(BoxApiError::from)?
        {
            Ok(AssertLevelManager)
        } else {
            Err(AuthorizationError::NotALevelManager.into())
        }
    }
}

async fn is_in_group(
    cognito: &aws_sdk_cognitoidentityprovider::Client,
    sub: &Username,
    group_name: &str,
) -> ApiResult<bool> {
    let user_pool = std::env::var("COGNITO_USER_POOL")
        .box_error()
        .map_err(AuthorizationError::RetrieveGroups)?;

    let groups = cognito
        .admin_list_groups_for_user()
        .user_pool_id(user_pool)
        .username(&sub.0)
        .send()
        .await
        .box_error()
        .map_err(AuthorizationError::RetrieveGroups)?;

    Ok(groups
        .groups()
        .iter()
        .any(|group| group.group_name() == Some(group_name)))
}
