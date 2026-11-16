variable "project" {
  description = "Short name used to prefix resources."
  type        = string
  default     = "francescotranzillo-dev"
}

variable "aws_region" {
  description = "Region for the S3 bucket and IAM resources."
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Custom domain (e.g. francescotranzillo.dev). Leave empty to serve the site on the CloudFront *.cloudfront.net URL."
  type        = string
  default     = ""
}

variable "create_hosted_zone" {
  description = "Create the Route 53 hosted zone for domain_name. Set to false if the zone already exists (e.g. created when registering the domain in Route 53)."
  type        = bool
  default     = false
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name."
  type        = string
  default     = "fratranzi230594/francescotranzillo.dev"
}

variable "github_branch" {
  description = "Branch allowed to deploy."
  type        = string
  default     = "main"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set to false if the AWS account already has one for token.actions.githubusercontent.com."
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = North America + Europe (cheapest)."
  type        = string
  default     = "PriceClass_100"
}
