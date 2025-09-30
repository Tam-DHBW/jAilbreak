output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.spa_bucket.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.spa_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.spa_distribution.domain_name
}

output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.spa_distribution.domain_name}"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.players.id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = aws_cognito_user_pool_client.players_client.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.players.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.player_progress.name
}