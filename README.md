# francescotranzillo.dev

Personal site of Francesco Tranzillo: cloud consultant (AWS, DevOps) in Berlin, and film photographer on the side.

One cloud of ~16,000 WebGL particles changes shape as you scroll: my name, a cloud architecture with requests
flowing through it, my 35mm film scans from Morocco, a crochet circle and a globe with the places I've lived and
travelled.

## Stack

| Layer   | Choice                                                                 |
| ------- | ---------------------------------------------------------------------- |
| Site    | [Astro](https://astro.build) (static), [Three.js](https://threejs.org) |
| Content | EN / IT / DE pages, blog in Markdown (content collections)             |
| Hosting | S3 (private) + CloudFront with Origin Access Control                   |
| DNS/TLS | Route 53 + ACM (optional, enabled once the domain is registered)       |
| IaC     | Terraform, remote state on S3 with native locking                      |
| CI/CD   | GitHub Actions, AWS access via OIDC (no stored keys)                   |

```
GitHub (push to main) ──OIDC──▶ IAM role ──▶ S3 sync + CloudFront invalidation
Browser ──▶ CloudFront (rewrite function, security headers) ──OAC──▶ S3 (private)
```

## Run locally

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview
```

Requires Node 22 (see `.nvmrc`).

## Project layout

```
src/
  components/ParticleHome.astro   home page scenes + canvas
  scripts/particles.js            the particle engine (Three.js)
  i18n/ui.ts                      EN / IT / DE strings
  pages/                          /, /it/, /de/, /blog/, 404
  content/blog/                   blog posts (Markdown)
public/particles/                 240x160 film scans sampled by the particles
infra/                            Terraform
.github/workflows/                CI (build, fmt, validate) and deploy
```

## Deploy (first time)

1. **State bucket** (once, by hand):

   ```bash
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   aws s3api create-bucket --bucket francescotranzillo-dev-tfstate-$ACCOUNT_ID \
     --region eu-central-1 --create-bucket-configuration LocationConstraint=eu-central-1
   aws s3api put-bucket-versioning --bucket francescotranzillo-dev-tfstate-$ACCOUNT_ID \
     --versioning-configuration Status=Enabled
   ```

2. **Infrastructure**:

   ```bash
   cd infra
   cp backend.hcl.example backend.hcl            # fill in the bucket name
   cp terraform.tfvars.example terraform.tfvars  # domain_name = "" for now
   terraform init -backend-config=backend.hcl
   terraform apply
   ```

3. **GitHub repository variables** (Settings → Secrets and variables → Actions → Variables), from `terraform output`:

   | Variable                     | Value                        |
   | ---------------------------- | ---------------------------- |
   | `AWS_ROLE_ARN`               | `github_deploy_role_arn`     |
   | `S3_BUCKET`                  | `bucket_name`                |
   | `CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id` |
   | `SITE_URL`                   | `site_url`                   |
   | `AWS_REGION`                 | `eu-central-1` (optional)    |

4. Push to `main` (or run the **Deploy site** workflow by hand). The site is live on the `*.cloudfront.net` URL.

## Adding the custom domain

1. Register `francescotranzillo.dev` in Route 53 (this also creates the hosted zone).
2. In `infra/terraform.tfvars` set `domain_name = "francescotranzillo.dev"` and run `terraform apply`.
   This issues the certificate in us-east-1, validates it via DNS and points the apex and `www` at CloudFront.
3. Update the `SITE_URL` variable to `https://francescotranzillo.dev`.

If the domain is registered elsewhere, set `create_hosted_zone = true` and copy the `name_servers` output to the
registrar.

## Writing a post

Add a Markdown file to `src/content/blog/` with `title`, `description` and `date` in the front matter.
`draft: true` posts show only in `npm run dev`.
