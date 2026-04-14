resource "cloudflare_ruleset" "terraform_managed_resource_2c46173279964d9b8b9e3ec19d61c8fd_0" {
  kind    = "zone"
  name    = "default"
  phase   = "http_ratelimit"
  zone_id = "9870ce9a09354061353dd4d7a6dbe1b8"
  rules {
    action      = "block"
    description = "Attack score rate limit"
    enabled     = true
    expression  = "(cf.waf.score ge 20 and cf.waf.score lt 70)"
    ratelimit {
      characteristics     = ["cf.unique_visitor_id", "cf.colo.id"]
      mitigation_timeout  = 86400
      period              = 60
      requests_per_period = 50
    }
  }
}

resource "cloudflare_ruleset" "terraform_managed_resource_3c3fd6ba21c048b3a3f15094737f654e_1" {
  kind    = "zone"
  name    = "default"
  phase   = "http_request_firewall_custom"
  zone_id = "9870ce9a09354061353dd4d7a6dbe1b8"
  rules {
    action      = "block"
    description = "Score Defense"
    enabled     = true
    expression  = "(cf.waf.score lt 20)"
  }
  rules {
    action      = "block"
    description = "Block Bot "
    enabled     = true
    expression  = "(cf.bot_management.score lt 1)"
  }
  rules {
    action      = "managed_challenge"
    description = "Challenge bot score <30"
    enabled     = true
    expression  = "(cf.bot_management.score gt 1 and cf.bot_management.score lt 30)"
  }
  rules {
    action      = "block"
    description = "Geo Protetion"
    enabled     = false
    expression  = "(not ip.src.country in {\"AU\" \"IO\" \"MY\"})"
  }
}

resource "cloudflare_ruleset" "terraform_managed_resource_07e29d4aa07c4c3192ccd54a8a942e20_2" {
  kind    = "zone"
  name    = "default"
  phase   = "http_request_firewall_managed"
  zone_id = "9870ce9a09354061353dd4d7a6dbe1b8"
  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee"
    }
    enabled    = true
    expression = "true"
  }
  rules {
    action = "execute"
    action_parameters {
      id = "4814384a9e5d4991b9815dcfc25d2f1f"
      overrides {
        categories {
          category = "paranoia-level-2"
          enabled  = false
        }
        categories {
          category = "paranoia-level-3"
          enabled  = false
        }
        categories {
          category = "paranoia-level-4"
          enabled  = false
        }
      }
    }
    enabled    = true
    expression = "true"
  }
}

