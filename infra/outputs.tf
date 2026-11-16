output "site_url" {
  description = "Public URL of the site."
  value       = local.use_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "bucket_name" {
  description = "S3 bucket with the built site (GitHub variable S3_BUCKET)."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "GitHub variable CLOUDFRONT_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.site.id
}

output "github_deploy_role_arn" {
  description = "GitHub variable AWS_ROLE_ARN."
  value       = aws_iam_role.github_deploy.arn
}

output "name_servers" {
  description = "Name servers to set at your registrar (only when Terraform created the hosted zone)."
  value       = flatten(aws_route53_zone.site[*].name_servers)
}
