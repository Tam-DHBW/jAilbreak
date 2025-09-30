resource "aws_cognito_user_pool" "players" {
  name = "jb_players"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "name"
    required            = true
    mutable             = true
  }
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "jb_frontend_client"
  user_pool_id = aws_cognito_user_pool.players.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

resource "aws_cognito_identity_pool" "players" {
  identity_pool_name               = "jb_identity_pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.frontend.id
    provider_name           = aws_cognito_user_pool.players.endpoint
    server_side_token_check = false
  }
}

data "aws_iam_policy_document" "assume_authenticated" {
  statement {
    effect = "Allow"
    principals {
      identifiers = ["cognito-identity.amazonaws.com"]
      type        = "Federated"
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.players.id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "authenticated" {
  name = "jb_cognito_authenticated"

  assume_role_policy = data.aws_iam_policy_document.assume_authenticated.json
}


resource "aws_cognito_identity_pool_roles_attachment" "players" {
  identity_pool_id = aws_cognito_identity_pool.players.id

  roles = {
    "authenticated" = aws_iam_role.authenticated.arn
  }
}
