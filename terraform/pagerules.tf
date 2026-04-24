resource "cloudflare_ruleset" "blazehack_ssl_override" {
  zone_id     = var.cloudflare_zone_id
  name        = "Blazehack SSL Override"
  description = "Force Flexible SSL for the Blazehack subdomain"
  
  kind        = "zone"
  phase       = "http_config_settings" #This is the specific phase for Configuration Rules

  rules {
    description = "Full SSL"
    action      = "set_config"
    enabled     = true
    
    # We use the modern ruleset expression language here instead of the old wildcard (*)
    expression  = "(http.host eq \"blazehack.work.appleflare.win\")"
    
    action_parameters {
      ssl = "full"
    }
  }
}