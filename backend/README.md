# backend

The Go half of the my-car rewrite. It owns the REST API described by
[`openapi/openapi.yaml`](../openapi/openapi.yaml) and, in production, serves the
frontend's static build from the binary itself — there is no Node process at
runtime.

## State

Early scaffolding. `main.go` prints and exits; there is no HTTP server, no
database access and no authentication yet. The `backend-foundation` change adds
the server, configuration and migrations, and `auth-oidc-magic-link` adds login.

**A container built today reports unhealthy, and that is expected.** The image's
`HEALTHCHECK` runs `server healthcheck`, which probes `/api/healthz`; neither
the subcommand nor the endpoint exists until `backend-foundation` lands. The
image builds and the binary runs — it just has nothing to report healthy about.

## Running it

```bash
cd backend
go run .
```

The database it will talk to comes from compose:

```bash
docker compose up -d db      # Postgres on localhost:5432
```

Add `--profile dev` for pgadmin (`localhost:8081`) and mailpit
(`localhost:8025`) alongside it.

## Configuration

Every variable the service reads is listed in [`.env.example`](.env.example)
with a placeholder value, and the names match what `docker-compose.yml` sets.
The `OIDC_*` entries are commented out until `auth-oidc-magic-link` implements
them.

Nothing in that file is a real credential, and nothing that is one belongs
there.

## Serving the frontend

The Dockerfile builds `frontend/` with Vite, copies the result into
`static/out/` and compiles it into the binary, so `static/out/` is generated
and git-ignored. Building the backend on its own does not produce it.

## Conventions

Non-trivial changes go through the OpenSpec `explore → propose → apply`
workflow described in the root [`AGENTS.md`](../AGENTS.md). The OpenAPI document
is the source of truth for request and response shapes: change it in the same
change that changes an endpoint.
