#!/bin/bash

echo "Installing required tools..."

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Terraform
if ! command -v terraform &> /dev/null; then
    echo "Installing Terraform..."
    brew tap hashicorp/tap
    brew install hashicorp/tap/terraform
fi

# Install AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    brew install awscli
fi

# Install Node.js and npm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node
fi

echo "All tools installed!"
echo "Next steps:"
echo "1. Configure AWS: aws configure"
echo "2. Install npm packages: npm install"
echo "3. Run setup: ./setup.sh"