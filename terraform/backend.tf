data "external" "api_spec" {
  program = ["cargo", "run", "--bin", "generate_tf"]
  working_dir = "${path.module}/../backend"
}

locals {
  api_spec = jsondecode(data.external.api_spec.result.encoded)
}

resource "aws_api_gateway_rest_api" "rest_api" {
  name = "jb_api"
  endpoint_configuration {
    ip_address_type = "dualstack"
    types = ["PRIVATE"]
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
            providerARNs = [aws_cognito_user_pool.users.arn]
          }
        }
      }
    }
    paths = {
      for route, methods in local.api_spec : route => {
        for method, properties in methods : method => merge(
          properties.require_auth ? { security = [{ cognito-authorizer = [] }] } : {},
          {
            "x-amazon-apigateway-integration" : {
              "type" : "http",
              "responses" : {
                "default" : {
                  "statusCode" : "200"
                }
              },
              "httpMethod" : "GET",
              "uri" : "http://api.example.com"
            }
          }
        )
      }
    }
  })
}
