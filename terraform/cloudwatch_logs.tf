resource "aws_cloudwatch_log_group" "api_logs" {
  name = "jb_lambda_api"
}

resource "aws_cloudwatch_log_group" "authorizer_logs" {
  name = "jb_lambda_authorizer"
}
