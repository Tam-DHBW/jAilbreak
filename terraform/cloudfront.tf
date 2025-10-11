locals {
  origin_api_id      = "rest_api"
  origin_frontend_id = "frontend"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "jb_oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "spa-redirect-index" {
  name    = "spa-redirect-index"
  code    = file("./cf_functions/spa-redirect-index.js")
  runtime = "cloudfront-js-2.0"
}

resource "aws_cloudfront_function" "api-strip-prefix" {
  name    = "api-strip-prefix"
  code    = file("./cf_functions/api-strip-prefix.js")
  runtime = "cloudfront-js-2.0"
}

resource "aws_cloudfront_distribution" "public" {
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = local.origin_frontend_id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  origin {
    domain_name = "${aws_api_gateway_rest_api.rest_api.id}.execute-api.${aws_api_gateway_rest_api.rest_api.region}.amazonaws.com"
    origin_id   = local.origin_api_id
    origin_path = "/${aws_api_gateway_stage.prod.stage_name}"
    custom_origin_config {
      https_port             = 443
      http_port              = 80
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    target_origin_id       = local.origin_frontend_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa-redirect-index.arn
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    target_origin_id       = local.origin_frontend_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = local.origin_api_id
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.api-strip-prefix.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  wait_for_deployment = false
}
