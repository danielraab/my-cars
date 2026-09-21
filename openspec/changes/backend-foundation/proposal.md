# Proposal

## Why

`backend/main.go` is still a hello-world: no HTTP server, no database access,
no migrations. Every later backend slice — `api-contract-v1`,
`auth-oidc-magic-link`, each feature vertical — needs a running server,
a database connection with schema versioning, and a place to serve the
embedded frontend build and OpenAPI document, or it re-derives that
plumbing itself and drifts. The `Dockerfile`'s `HEALTHCHECK` already calls
`server healthcheck`, which does not exist, so every container built today
reports unhealthy; `bootstrap-build` named this change as the one that
fixes it.

## What Changes

- Add an HTTP server (Go 1.22+ stdlib `net/http` `ServeMux`, no router
  dependency) that binds `PORT` and, in production, is the only running
  process.
- Add `GET /api/healthz`: returns `200` when the database is reachable,
  `503` otherwise. Add a `server healthcheck` CLI subcommand — the binary's
  only other mode — that probes its own `/api/healthz` over HTTP and exits
  `0`/`1` accordingly, since the distroless final image has no `curl`.
- Add config loading for every variable `backend/.env.example` currently
  documents as read (`PORT`, `DATABASE_URL`, `SMTP_FROM`, `SMTP_HOST`,
  `SMTP_PORT`, `SMTP_TLS`, `AUTH_BASE_URL`) into one `Config` struct, with a
  test that keeps the struct and `.env.example` from drifting apart. The
  `OIDC_*` variables stay commented out and unparsed — `auth-oidc-magic-link`
  owns them.
- Add a Postgres connection pool and a migrations mechanism that runs
  automatically at startup, before the server accepts requests, and fails
  the process loudly on error. The first migration creates nothing beyond
  the mechanism's own bookkeeping table — no domain tables yet; those
  belong to `db-schema-v1` and `auth-oidc-magic-link`.
- Serve the embedded frontend build (`static/out/`, already `go:embed`-able
  per the `Dockerfile`) for any `GET` request outside `/api/`, falling back
  to `index.html` for paths that don't match a static file (SPA routing).
- Serve the embedded `openapi.yaml` at `GET /api/openapi.yaml` — still the
  empty placeholder `api-contract-v1` will fill in; this change only wires
  up serving it.
- Add a Postgres service to the `backend` CI job (matching
  `docker-compose.yml`'s `db` service) so migration and connectivity tests
  run against a real database.

No auth, no domain routes (cars, refuels, repairs, tickets, stats), no
OpenAPI content. Frontend is untouched.

## Capabilities

### New Capabilities

- `platform/healthcheck`: the `GET /api/healthz` contract (status codes and
  what they mean) and the `server healthcheck` CLI behavior that depends on
  it. Both the container `HEALTHCHECK` and any future orchestration read
  this contract.
- `platform/http-server`: the backend's request-routing shape — everything
  under `/api/` is the API namespace (starting with `/api/healthz` and
  `/api/openapi.yaml`), everything else serves the embedded frontend build
  with SPA fallback to `index.html`.

### Modified Capabilities

None. No spec exists yet for anything this change touches.

## Impact

- **Files**: `backend/main.go`, new `backend/` packages for config, HTTP
  server, health, migrations and DB connection; `backend/db/migrations/`
  (new); `.github/workflows/ci.yml` (add a Postgres service to the
  `backend` job).
- **Code**: `backend/` only. `frontend/`, `openapi/openapi.yaml` and `old/`
  are untouched.
- **Downstream**: `api-contract-v1` builds its endpoints on this server and
  fills in the OpenAPI document this change only serves.
  `auth-oidc-magic-link` adds the `OIDC_*` config fields, the domain
  migrations for users/sessions, and the login routes on top of this
  foundation. `db-schema-v1` adds the migrations mechanism's first real
  schema.
- **Operational**: containers built after this change report healthy
  (`HEALTHCHECK` succeeds) once the database is reachable; CI's `backend`
  job gains a Postgres service and takes longer to run migration tests.
