# Everything in this file is only created when var.domain_name is set.

resource "aws_route53_zone" "site" {
  count = local.use_domain && var.create_hosted_zone ? 1 : 0
  name  = var.domain_name
}

data "aws_route53_zone" "site" {
  count        = local.use_domain && !var.create_hosted_zone ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

locals {
  # Exactly one of the two lists has an element when a domain is set; none otherwise.
  zone_id = one(concat(aws_route53_zone.site[*].zone_id, data.aws_route53_zone.site[*].zone_id))
}

resource "aws_acm_certificate" "site" {
  count                     = local.use_domain ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for o in flatten(aws_acm_certificate.site[*].domain_validation_options) : o.domain_name => {
      name   = o.resource_record_name
      type   = o.resource_record_type
      record = o.resource_record_value
    }
  }

  zone_id         = local.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count                   = local.use_domain ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_route53_record" "alias" {
  for_each = local.use_domain ? {
    for pair in setproduct(local.aliases, ["A", "AAAA"]) : "${pair[0]}-${pair[1]}" => {
      name = pair[0]
      type = pair[1]
    }
  } : {}

  zone_id = local.zone_id
  name    = each.value.name
  type    = each.value.type

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
