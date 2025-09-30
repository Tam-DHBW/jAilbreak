locals {
  backend_dir    = "${path.module}/../backend"
  api_lambda_zip = "${local.backend_dir}/target/lambda/api/bootstrap.zip"
}

resource "aws_s3_object" "api_lambda_code" {
  bucket      = aws_s3_bucket.lambda_code.bucket
  key         = "api.zip"
  source      = local.api_lambda_zip
  source_hash = filesha256(local.api_lambda_zip)
}

resource "aws_iam_role" "api_lambda_role" {
  name               = "jb_api_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

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

data "aws_iam_policy_document" "api_lambda_policy" {
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

resource "aws_iam_role_policy" "api_lambda_policy" {
  role   = aws_iam_role.api_lambda_role.id
  policy = data.aws_iam_policy_document.api_lambda_policy.json
}

resource "aws_lambda_function" "api" {
  role             = aws_iam_role.api_lambda_role.arn
  function_name    = "jb_api"
  s3_bucket        = aws_s3_bucket.lambda_code.bucket
  s3_key           = aws_s3_object.api_lambda_code.key
  source_code_hash = filesha256(local.api_lambda_zip)
  runtime          = "provided.al2023"
  handler          = "provided"
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
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowRestApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*"
}
