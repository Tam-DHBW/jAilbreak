use std::vec;

use alcoholic_jwt::{JWKS, ValidJWT, Validation};
use anyhow::Context;
use aws_lambda_events::{
    apigw::{
        ApiGatewayCustomAuthorizerPolicy, ApiGatewayCustomAuthorizerRequest,
        ApiGatewayCustomAuthorizerResponse,
    },
    iam::{IamPolicyEffect, IamPolicyStatement},
};
use lambda_runtime::LambdaEvent;
use serde_json::json;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    jb_common::init_tracing_subscriber();

    let issuer = std::env::var("TOKEN_ISSUER").context("No token issuer provided")?;

    let jwks = &minreq::get(format!("{issuer}/.well-known/jwks.json"))
        .send()
        .expect("Failed fetching jwks.json")
        .json()
        .expect("Unable to deserialize jwks.json");

    lambda_runtime::run(lambda_runtime::service_fn(async |event| {
        Ok::<_, lambda_runtime::Error>(
            authorizer(event, &issuer, jwks)
                .await
                .unwrap_or_else(unauthorized_response),
        )
    }))
    .await
    .unwrap();

    Ok(())
}

async fn authorizer(
    event: LambdaEvent<ApiGatewayCustomAuthorizerRequest>,
    issuer: &String,
    jwks: &JWKS,
) -> Result<ApiGatewayCustomAuthorizerResponse, anyhow::Error> {
    let token = event
        .payload
        .authorization_token
        .expect("Missing authorization token");
    let method_arn = event.payload.method_arn.expect("Missing method ARN");

    let kid = alcoholic_jwt::token_kid(&token)
        .context("Invalid token header")?
        .context("Missing token kid field")?;

    let jwk = jwks.find(&kid).context("Unknown token kid")?;
    let ValidJWT { claims, .. } = alcoholic_jwt::validate(
        &token,
        jwk,
        vec![
            Validation::Issuer(issuer.clone()),
            Validation::SubjectPresent,
            Validation::NotExpired,
        ],
    )?;

    let sub = claims
        .get("sub")
        .expect("Sub claim missing")
        .as_str()
        .unwrap();

    Ok(create_response(
        Some(sub.to_owned()),
        Some(method_arn),
        json!({ "sub": sub }),
    ))
}

fn unauthorized_response(cause: anyhow::Error) -> ApiGatewayCustomAuthorizerResponse {
    create_response(None, None, json!({ "message": cause.to_string() }))
}

fn create_response(
    principal_id: Option<String>,
    allowed_resource: Option<String>,
    context: serde_json::Value,
) -> ApiGatewayCustomAuthorizerResponse {
    ApiGatewayCustomAuthorizerResponse {
        principal_id: principal_id,
        policy_document: ApiGatewayCustomAuthorizerPolicy {
            version: Some("2012-10-17".to_owned()),
            statement: vec![IamPolicyStatement {
                effect: IamPolicyEffect::Allow,
                resource: allowed_resource.into_iter().collect(),
                action: vec!["execute-api:Invoke".to_owned()],
                condition: None,
            }],
        },
        context,
        usage_identifier_key: None,
    }
}
