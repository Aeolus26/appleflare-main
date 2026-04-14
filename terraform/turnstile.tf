## ==============================================================================
## EXACT FILEPATH: terraform/turnstile.tf
## ==============================================================================

resource "cloudflare_turnstile_widget" "main_widget" {
  account_id     = var.cloudflare_account_id
  name           = "Appleflare Main Widget"
  domains        = ["appleflare.win"]
  
  # 'managed' mode shows a checkbox ONLY if the visitor looks suspicious.
  # Otherwise, it runs completely invisibly.
  mode           = "managed" 
  region         = "world"
}

## ------------------------------------------------------------------------------
## OUTPUTS: These tell Terraform to hand us the keys after it builds the widget
## ------------------------------------------------------------------------------

output "turnstile_site_key" {
  description = "The public Sitekey to put in your HTML/React frontend"
  value       = cloudflare_turnstile_widget.main_widget.id
}

output "turnstile_secret_key" {
  description = "The private Secret key to put in your backend Worker"
  value       = cloudflare_turnstile_widget.main_widget.secret
  sensitive   = true # This hides it from the terminal so nobody behind you sees it!
}