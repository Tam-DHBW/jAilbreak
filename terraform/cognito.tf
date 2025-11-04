resource "aws_cognito_user_pool" "moderators" {
  name = "jb_moderators"

  alias_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
}

resource "aws_cognito_user_group" "level_manager" {
  user_pool_id = aws_cognito_user_pool.moderators.id
  name         = "LevelManager"
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "jb_frontend_client"
  user_pool_id = aws_cognito_user_pool.moderators.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 7
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  callback_urls                        = ["https://${aws_cloudfront_distribution.public.domain_name}/admin"]
  logout_urls                          = ["https://${aws_cloudfront_distribution.public.domain_name}"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid"]
  supported_identity_providers         = ["COGNITO"]
}

resource "aws_cognito_user_pool_client" "testclient" {
  name         = "jb_test_client"
  user_pool_id = aws_cognito_user_pool.moderators.id

  generate_secret = false

  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH"]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 7
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "moderators" {
  domain       = "jailbreak-moderator-auth"
  user_pool_id = aws_cognito_user_pool.moderators.id
}
