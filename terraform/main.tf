terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    region       = "eu-central-1"
    bucket       = "jailbreak-terraform-state"
    key          = "default.tfstate"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      TerraformManaged = true
    }
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
