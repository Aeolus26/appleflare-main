resource "cloudflare_record" "terraform_managed_resource_90e15dfb72e02646119971bfa3c5b006_0" {
  content = "100::"
  name    = "guides"
  proxied = true
  ttl     = 1
  type    = "AAAA"
  zone_id = "9870ce9a09354061353dd4d7a6dbe1b8"
}

resource "cloudflare_record" "terraform_managed_resource_28d19940d2406fe7a5b60ab7707d7023_1" {
  content = "100::"
  name    = "www"
  proxied = true
  ttl     = 1
  type    = "AAAA"
  zone_id = "9870ce9a09354061353dd4d7a6dbe1b8"
}

## Blazehack Server GCP
resource "cloudflare_record" "blazehack_subdomain" {
  zone_id = var.cloudflare_zone_id
  name    = "blazehack"
  content = "34.124.214.53" # The IP address of your new server
  type    = "A"
  proxied = true        # Turns on the orange cloud!
}