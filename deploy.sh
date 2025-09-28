#!/bin/bash

# Set AWS profile
export AWS_PROFILE=AdministratorAccess-439196890137

# Get infrastructure values from Terraform
cd terraform
BUCKET_NAME=$(terraform output -raw bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
cd ..

# Build React app
echo "Building React app..."
npm run build

# Upload files to S3
echo "Uploading files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
echo "Website URL: $(cd terraform && terraform output -raw website_url)"