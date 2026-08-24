# Deployment

This repo (`hr-portal-frontend`) is one half of a two-repo deployment —
`hr-portal-api` is the sibling backend repo, expected checked out next to
this one on disk (`../backend`) for local dev, and deployed as its own
separate ECS service in AWS.

## ⚠️ No authentication yet — read this before touching `ALLOWED_CIDR`

**The backend API has no authentication or authorization of any kind.**
This frontend is a thin client over it — it adds no access control of its
own. The entire safety of the deployment rests on ONE control: the ALB's
security group only allows inbound traffic from `var.allowed_cidr`
(Terraform, see `infra/variables.tf`) — your office/VPN IP range.

- `allowed_cidr` has **no default** and Terraform hard-fails if it's ever
  set to `0.0.0.0/0` — this must never be opened to the whole internet by
  accident.
- **Do not** widen `allowed_cidr` or put this behind anything other than
  the office/VPN CIDR **until real authentication is added to the
  backend API.** A prettier UI doesn't change what's actually protecting
  the underlying HR data — that's still just the CIDR restriction.
- Full detail on what's provisioned and why lives in the backend repo's
  `DEPLOYMENT.md` and this repo's synced `infra/` copy (see
  `infra/README.md` — **that copy is a read-only mirror; the backend
  repo's `infra/` is the one that ever gets `terraform apply`'d**).

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

Runs on every push to `main`, plus manual `workflow_dispatch`. Builds the
Docker image with `VITE_API_BASE_URL=/api` baked in at build time (a
relative path — works unchanged behind the ALB, which routes `/api/*` to
the backend at the same host), tags it with the git SHA (and `latest`),
pushes to the `hr-portal-frontend` ECR repo, then updates the
`hr-portal-frontend` ECS service and waits for the deployment to
stabilize.

Authenticates via **GitHub OIDC**, not stored access keys — assumes the
`github_deploy_frontend` IAM role (`infra/iam_github_oidc.tf`), trusted
only for this exact repo. That role can push to the
`hr-portal-frontend` ECR repo and update the `hr-portal-frontend` ECS
service — nothing else, and nothing belonging to the backend.

## One-time AWS setup

The actual `terraform apply` happens from the **backend repo**
(`hr-portal-api/infra/` is canonical — see that repo's `DEPLOYMENT.md`
for the full first-time setup). What's specific to this repo:

1. After the backend repo's `terraform apply` succeeds, set in this
   repo's GitHub settings (Settings → Secrets and variables → Actions →
   Variables): `AWS_DEPLOY_ROLE_ARN` = Terraform's
   `github_deploy_role_arn_frontend` output, `AWS_REGION`,
   `ECS_CLUSTER_NAME` = Terraform's `ecs_cluster_name` output.

2. Same chicken-and-egg first deploy note as the backend: the initial
   ECS task definition Terraform registers won't have a real image to
   run until this repo's CD workflow is manually triggered
   (`workflow_dispatch`) at least once.

3. HTTPS/custom domain: not set up yet, same as the backend — see that
   repo's `DEPLOYMENT.md` for the TODO.
