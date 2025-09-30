resource "aws_s3_bucket" "lambda_code" {
  bucket = "jb-lambda-code-archives"
}

resource "random_string" "frontend_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
  keepers = {
    region = var.aws_region
  }
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "jb_spa_${random_string.frontend_bucket_suffix.result}"
}

resource "aws_s3_bucket_website_configuration" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

data "aws_iam_policy_document" "frontend_bucket" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend_bucket.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.public.arn]
    }
  }

}

resource "aws_s3_bucket_policy" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.public.arn
          }
        }
      }
    ]
  })
}
