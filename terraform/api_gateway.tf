data "external" "api_spec" {
  program     = ["cargo", "run", "--bin", "generate_tf"]
  working_dir = "${path.module}/../backend"
}

locals {
  api_spec = jsondecode(data.external.api_spec.result.encoded)
}

resource "aws_api_gateway_rest_api" "rest_api" {
  name = "jb_api"
  endpoint_configuration {
    ip_address_type = "dualstack"
    types           = ["REGIONAL"]
  }
  body = jsonencode({
    openapi = "3.0.0",
    components = {
      securitySchemes = {
        cognito-authorizer = {
          type                         = "apiKey",
          name                         = "Authorization",
          in                           = "header",
          x-amazon-apigateway-authtype = "cognito_user_pools",
          x-amazon-apigateway-authorizer = {
            type         = "cognito_user_pools",
            providerARNs = [aws_cognito_user_pool.players.arn]
          }
        }
      }
    }
    paths = {
      for route, methods in local.api_spec : route => {
        for method, properties in methods : method => merge(
          properties.require_auth ? { security = [{ cognito-authorizer = [] }] } : {},
          {
            x-amazon-apigateway-integration = {
              type                 = "AWS_PROXY",
              httpMethod           = "POST",
              uri                  = aws_lambda_function.api.invoke_arn,
              payloadFormatVersion = "1.0"
            },
          }
        )
      }
    }
  })
}


resource "aws_api_gateway_deployment" "rest_api" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.rest_api.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.rest_api.id
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  stage_name    = "prod"
}
