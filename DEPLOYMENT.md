# Deployment

This repo (`hr-portal-frontend`) is one half of a two-repo deployment —
`hr-portal-api` is the sibling backend repo, expected checked out next to
this one on disk (`../backend`) for local dev. This repo builds to static
files and deploys to S3; the backend deploys as containers on a single
EC2 instance — see that repo's `DEPLOYMENT.md` for the full picture.

## ⚠️ No authentication yet

**The backend API has no authentication or authorization of any kind.**
This frontend is a thin client over it — it adds no access control of its
own. The entire safety of the deployment rests on the EC2 security
group and S3 bucket policy, both governed by `api_allowed_cidrs`
(Terraform, in the backend repo's `infra/`) — see that repo's
`DEPLOYMENT.md` for the full explanation, including why `api_allowed_cidrs`
is validated to reject `0.0.0.0/0`. **Do not** ask for that restriction
to be widened "just for a demo" until real authentication exists in the
API.

## Local development (docker-compose)

Brings up MySQL + backend + frontend together. Requires both repos
checked out as siblings (`../backend` relative to this file).

```bash
cp .env.compose.example .env.compose   # fill in local values — never commit this file
docker compose --env-file .env.compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080/api

This container-based `docker-compose.yml` is separate from the plain
`npm run dev` workflow (`.env` / `.env.example`, Vite dev server against
a MySQL you run yourself) — use whichever fits what you're doing; both
read `VITE_API_BASE_URL`, just from different files
(`.env.compose`/`.env.compose.example` vs `.env`/`.env.example`) so they
don't collide.

An identical `docker-compose.yml` / `.env.compose.example` pair lives in
`../backend`. If you change one, change the other the same way.

## CI (`.github/workflows/ci.yml`)

Runs on every push and PR: `npm ci`, lint, test, `npm run build`. Lint
and test currently run as no-ops (`--if-present`) since this project
doesn't have those scripts wired up yet — add `lint`/`test` scripts to
`package.json` and CI starts enforcing them with no workflow change
needed. `npm run build` alone still catches build-breaking errors before
merge.

## CD (`.github/workflows/cd.yml`)

Runs on every push to `main`, plus manual `workflow_dispatch`. It:

1. `npm ci` + `npm run build`, with `VITE_API_BASE_URL` (a repo Actions
   variable) as a real build-time env var — Vite inlines it into the
   compiled bundle, so it has to be set before `vite build` runs, not
   after. It's an **absolute, cross-origin URL** (the backend EC2
   instance's Elastic IP), not a relative `/api` path — frontend (S3)
   and backend (EC2) are different origins in this deployment, which is
   why every backend controller carries `@CrossOrigin("*")`.
2. Syncs `dist/` to the `S3_BUCKET` repo variable, in two passes:
   hashed JS/CSS get a long, immutable cache (safe — a new deploy gets
   new filenames), `index.html` gets `no-cache` explicitly, since a
   stale cached `index.html` is what would make a deploy silently not
   show up for a returning visitor.

Authenticates via **GitHub OIDC**, not stored access keys — assumes the
`hr-portal-github-deploy-frontend` IAM role (`infra/iam_github_oidc.tf`
in the backend repo), trusted only for this exact repo. That role can
only write to this one S3 bucket — nothing else, and nothing belonging
to the backend (in particular, no ECR/ECS/EC2 permissions at all; if you
see an `ecr:GetAuthorizationToken` or similar AccessDenied here, the
workflow has drifted back toward the old container-based deploy this
repo no longer uses).

## One-time AWS setup

The actual `terraform apply` happens from the **backend repo**
(`hr-portal-api/infra/` is canonical — see that repo's `DEPLOYMENT.md`
for the full first-time setup). What's specific to this repo: after that
apply succeeds, set in this repo's GitHub settings (Settings → Secrets
and variables → Actions → Variables): `AWS_DEPLOY_ROLE_ARN` (Terraform's
`github_deploy_role_arn_frontend` output), `AWS_REGION`, `S3_BUCKET`
(Terraform's `frontend_bucket_name` output), and `VITE_API_BASE_URL`
(Terraform's `api_base_url` output — re-run this workflow after any
change to the backend's Elastic IP or port, since the value is baked
into the bundle at build time).

HTTPS/custom domain: not set up yet — S3 website endpoints cannot serve
HTTPS at all, so this needs a CDN (CloudFront or Cloudflare) in front of
both surfaces before that's possible. See the backend repo's
`DEPLOYMENT.md` for the same TODO.
