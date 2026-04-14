# ==============================================================================
# EXACT FILEPATH: terraform/variables.tf
# (Place this inside the 'terraform' folder next to providers.tf)
# ==============================================================================

variable "cloudflare_api_token" {
  description = "The API Token to modify Cloudflare resources"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Your Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "The Zone ID for the domain"
  type        = string
}
