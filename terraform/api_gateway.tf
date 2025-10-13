data "external" "api_spec" {
  program     = ["cargo", "run", "--bin", "generate_tf"]
  working_dir = "${path.module}/../backend"
}

locals {
  api_spec = jsondecode(data.external.api_spec.result.encoded)
  extra_paths = {
    "/{notfound+}" = {
      x-amazon-apigateway-any-method = {
        responses = {
          404 = {}
        }
        x-amazon-apigateway-integration = {
          type = "mock"
          requestTemplates = {
            "application/json" = jsonencode({ statusCode = 404 })
          }
          responses = {
            default = {
              statusCode = 404
              responseTemplates = {
                "application/json" = jsonencode({ message = "Resource not found" })
              }
            }
          }
        }
      }
    }
  }
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
          x-amazon-apigateway-authtype = "custom",
          x-amazon-apigateway-authorizer = {
            type          = "token",
            authorizerUri = aws_lambda_function.authorizer.invoke_arn
          }
        }
      }
    }
    x-amazon-apigateway-gateway-responses = {
      ACCESS_DENIED = {
        responseTemplates = {
          "application/json" = jsonencode({ message = "$context.authorizer.message" })
        }
      }
    }
    paths = merge({
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
    }, local.extra_paths)
  })
}

resource "aws_api_gateway_deployment" "rest_api" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeployment = jsonencode([
      aws_api_gateway_rest_api.rest_api.body
    ])
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
