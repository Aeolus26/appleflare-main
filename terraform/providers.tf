# ==============================================================================
# EXACT FILEPATH: terraform/providers.tf
# ==============================================================================

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket                      = "appleflare-tf-state"
    key                         = "terraform.tfstate"
    region                      = "auto" # 'auto' is the modern standard for R2
    
    # These flags tell Terraform to completely ignore Amazon AWS rules
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true  # <-- This fixes your AWS STS error!
    skip_s3_checksum            = true  # <-- R2 doesn't use AWS checksums
    use_path_style              = true

    # The modern way to define the R2 endpoint
    endpoints = {
      s3 = "https://6aab1687848291f5e740dea486ec36bb.r2.cloudflarestorage.com"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}