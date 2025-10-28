data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_logging" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role" "api_lambda_role" {
  name               = "jb_api_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "invoke_bedrock" {
  statement {
    effect = "Allow"
    actions = [
      "bedrock:InvokeInlineAgent",
      "bedrock:GetSession",
      "bedrock:CreateSession",
      "bedrock:InvokeModel",
      "bedrock:GetFoundationModel",
      "bedrock:ListFoundationModels"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "readwrite_dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:UpdateTimeToLive",
      "dynamodb:ConditionCheckItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
      "dynamodb:GetRecords"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "api_lambda_permissions" {
  for_each = toset([
    data.aws_iam_policy_document.lambda_logging.json,
    data.aws_iam_policy_document.invoke_bedrock.json,
    data.aws_iam_policy_document.readwrite_dynamodb.json,
  ])
  role   = aws_iam_role.api_lambda_role.id
  policy = each.key
}

resource "aws_lambda_function" "api" {
  role          = aws_iam_role.api_lambda_role.arn
  function_name = "jb_api"
  runtime       = "provided.al2023"
  handler       = "provided"
  environment {
    variables = {
      AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH = "true"
    }
  }
  logging_config {
    log_group             = aws_cloudwatch_log_group.api_logs.name
    log_format            = "JSON"
    application_log_level = "TRACE"
    system_log_level      = "DEBUG"
  }
  filename = "./dummy.zip"
  lifecycle { ignore_changes = [filename] }
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  for_each = toset([
    aws_lambda_function.api.function_name,
    aws_lambda_function.authorizer.function_name
  ])

  statement_id  = "AllowRestApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.key
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*"
}


resource "aws_iam_role" "authorizer_lambda_role" {
  name               = "jb_authorizer_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "authorizer_lambda_logging" {
  role   = aws_iam_role.authorizer_lambda_role.id
  policy = data.aws_iam_policy_document.lambda_logging.json
}

resource "aws_lambda_function" "authorizer" {
  role          = aws_iam_role.authorizer_lambda_role.arn
  function_name = "jb_authorizer"
  runtime       = "provided.al2023"
  handler       = "provided"
  filename      = "./dummy.zip"
  environment {
    variables = {
      TOKEN_ISSUER = "https://cognito-idp.${aws_cognito_user_pool.players.region}.amazonaws.com/${aws_cognito_user_pool.players.id}"
    }
  }
  logging_config {
    log_group             = aws_cloudwatch_log_group.authorizer_logs.name
    log_format            = "JSON"
    application_log_level = "TRACE"
    system_log_level      = "DEBUG"
  }
  lifecycle { ignore_changes = [filename] }
}
