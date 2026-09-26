# backend

The Go half of the my-car rewrite. It owns the REST API described by
[`openapi/openapi.yaml`](../openapi/openapi.yaml) and, in production, serves the
frontend's static build from the binary itself — there is no Node process at
runtime.

## Authentication

Authentication is passwordless and entirely backend-owned:

- **OIDC** is optional and uses issuer discovery and the authorization-code flow
  with state, nonce, and PKCE. Configure `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`,
  and `OIDC_CLIENT_SECRET` together to enable it; register
  `${AUTH_BASE_URL}/api/v1/auth/oidc/callback` at the provider.
- **Magic links** are sent with `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_TLS`, and optional `SMTP_USER`/`SMTP_PASSWORD`. `SMTP_TLS` accepts
  `none`, `starttls`, or `tls`.

Both methods normalize a provider-verified email and resolve it to the same
account. Passwords, bearer JWTs, refresh tokens, and browser-localStorage
credentials are deliberately unsupported.

Successful login sets the opaque `my_car_session` cookie. It is `Secure`,
`HttpOnly`, `SameSite=Lax`, and backed by a revocable server-side session. This
means browser login testing requires HTTPS (browsers treat `localhost`
specially in some contexts, but deployments must terminate TLS).

## Running it

```bash
cd backend
go run .
```

The database it will talk to comes from compose:

```bash
docker compose up -d db      # Postgres on localhost:5432
```

Add `--profile dev` for pgadmin (`localhost:8081`) and Mailpit
(`localhost:8025`) alongside it. Mailpit accepts the `.env.example` SMTP
settings and displays delivered magic links in its web UI.

## Configuration

Every variable the service reads is listed in [`.env.example`](.env.example)
with a placeholder value, and the names match what `docker-compose.yml` sets.
All listed variables are required except SMTP username/password and the OIDC
group. Leaving all three OIDC values empty runs in magic-link-only mode. If any
OIDC value is provided, all three are required; the service performs discovery
during startup and fails fast if the provider is unavailable.

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
