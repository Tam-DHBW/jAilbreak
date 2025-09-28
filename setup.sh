#!/bin/bash

echo "Setting up infrastructure..."

# Set AWS profile
export AWS_PROFILE=AdministratorAccess-439196890137

# Initialize and apply Terraform
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

echo "Infrastructure created!"
echo "Bucket: $(terraform output -raw bucket_name)"
echo "Distribution ID: $(terraform output -raw cloudfront_distribution_id)"
echo "Website URL: $(terraform output -raw website_url)"

cd ..
chmod +x deploy.sh

echo "Run './deploy.sh' to deploy your React app!"