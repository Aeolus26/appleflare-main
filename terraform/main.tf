# ==============================================================================
# EXACT FILEPATH: terraform/main.tf
# (Place this inside the 'terraform' folder. This defines your existing resources)
# ==============================================================================

resource "cloudflare_workers_kv_namespace" "config_kv" {
  account_id = var.cloudflare_account_id
  title      = "CONFIG" # The name it has in your dashboard
}

resource "cloudflare_d1_database" "appleflare_db" {
  account_id = var.cloudflare_account_id
  name       = "appleflare_db" # The exact name in your dashboard
}

# Let's add outputs so Terraform tells us the IDs whenever it runs!
output "kv_id" {
  value = cloudflare_workers_kv_namespace.config_kv.id
}

output "d1_id" {
  value = cloudflare_d1_database.appleflare_db.id
}