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
          type = "apiKey",
          name = "Authorization",
          in   = "header",
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

resource "aws_api_gateway_resource" "notfound" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = "{notfound+}"
}

resource "aws_api_gateway_method" "notfound" {
  http_method   = "ANY"
  authorization = "NONE"
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.notfound.id
}

resource "aws_api_gateway_integration" "notfound" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.notfound.id
  http_method = aws_api_gateway_method.notfound.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 404 })
  }
}

resource "aws_api_gateway_method_response" "notfound" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.notfound.id
  http_method = aws_api_gateway_method.notfound.http_method
  status_code = 404
  depends_on  = [aws_api_gateway_integration.notfound]
}

resource "aws_api_gateway_integration_response" "notfound" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  resource_id = aws_api_gateway_resource.notfound.id
  http_method = aws_api_gateway_method.notfound.http_method
  status_code = 404
  response_templates = {
    "application/json" = jsonencode({ message = "Resource not found" })
  }
  depends_on = [aws_api_gateway_method_response.notfound]
}

resource "aws_api_gateway_deployment" "rest_api" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeployment = jsonencode([
      aws_api_gateway_rest_api.rest_api.body,
      aws_api_gateway_integration.notfound,
      aws_api_gateway_method_response.notfound,
      aws_api_gateway_integration_response.notfound,
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
