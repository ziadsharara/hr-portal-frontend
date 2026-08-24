# hr-portal-frontend

Vue 3 SPA for the HR CV Portal — the dashboard, employee/experience forms,
and CV export UI over the backend API. This is one half of a two-repo
system; the Spring Boot API it talks to lives in the sibling repo
[`hr-portal-api`](https://github.com/ziadsharara/hr-portal-api), normally
checked out next to this repo as `../backend`.

## ⚠️ No authentication

**The backend API this app talks to has no authentication or
authorization of any kind.** This frontend adds no access control of its
own — it's a thin client. See the backend repo's `DEPLOYMENT.md` for what
that means for deployment.

## Tech stack

- Vue 3.5 (`<script setup>` SFCs), Vue Router 4.6, Pinia 4.0
- Axios 1.19 for HTTP
- Vite 8.2 (build tool/dev server)
- Tailwind CSS 3.4 (+ PostCSS/Autoprefixer)
- Build: npm (`package.json`)

## Running locally

### Standalone (`npm run dev`)

```bash
cp .env.example .env   # set VITE_API_BASE_URL, e.g. http://localhost:8080/api
npm install
npm run dev
```

Requires the backend running separately (standalone or Docker) and
reachable at whatever `VITE_API_BASE_URL` points to. The app fails fast
at startup if `VITE_API_BASE_URL` isn't set (see `src/services/http.js`).

### Docker Compose (full stack — MySQL + backend + frontend)

Requires the sibling `hr-portal-api` repo checked out at `../backend`.

```bash
cp .env.compose.example .env.compose   # fill in local values — never commit this file
docker compose --env-file .env.compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080/api

This is a separate config path from the plain `npm run dev` workflow
above — both read `VITE_API_BASE_URL`, just from different files
(`.env.compose`/`.env.compose.example` vs `.env`/`.env.example`) so they
don't collide. Under Compose, nginx serves the built app and proxies
`/api/*` to the backend container (see `nginx.conf.template`).

## What's implemented

Routes (`src/router/index.js`):
- `/employees` — paged employee dashboard with filters
  (`EmployeesDashboardView.vue`, `EmployeeFiltersBar.vue`, `EmployeeTable.vue`)
- `/employees/new`, `/employees/:companyCode/edit` — create/edit employee
  form (`EmployeeFormView.vue`)
- `/employees/:companyCode` — employee profile, including experience list
  and CV export (`EmployeeProfileView.vue`, `ExperienceTable.vue`,
  `ExperienceFormModal.vue`)

Feature-wise, against the corresponding backend endpoints
(`src/services/employees.js`, `experiences.js`, `cv.js`, `uploads.js`):
- Employee CRUD, including status updates
- Experience CRUD, scoped to an employee
- Excel upload UI for both employee import and experience upload, with
  results panels (`ExcelUploadModal.vue`, `EmployeeImportResultsPanel.vue`,
  `ExcelUploadResultsPanel.vue`)
- CV export: single-employee download and a bulk async export flow with
  job status polling (`BulkExportModal.vue`)

## What's NOT implemented

- **Authentication/authorization** — none, on either this app or the
  backend it calls (see warning above)
- No automated lint/test scripts wired up yet — CI's lint/test steps are
  currently no-ops (`--if-present`); only `npm run build` is enforced

## API contract

This app talks to the backend's `/api` base path (`VITE_API_BASE_URL`).
There's no generated API contract doc; see the sibling `hr-portal-api`
repo's controllers or its `README.md` for the current endpoint list.

## Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `npm run dev` (`.env`) | e.g. `http://localhost:8080/api`; build-time (inlined into the bundle) |
| `VITE_API_BASE_URL` | Docker build arg (`.env.compose`) | defaults to `/api` (relative — same image works behind local nginx proxy or the AWS ALB) |

For the full local Docker Compose stack (`MYSQL_ROOT_PASSWORD`,
`MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_PORT`,
`BACKEND_PORT`, `FRONTEND_PORT`), see
[`.env.compose.example`](.env.compose.example).

## Deployment

Full CI/CD and AWS (ECS/Terraform) story lives in
[`DEPLOYMENT.md`](DEPLOYMENT.md) — start there. The one-time
`terraform apply` is done from the backend repo; this repo's
`DEPLOYMENT.md` covers what's specific to the frontend's own CD pipeline.
