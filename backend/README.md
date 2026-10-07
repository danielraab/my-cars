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

- **Passkeys** (WebAuthn discoverable credentials) are always enabled and need
  no extra configuration. A signed-in user adds them from the profile screen;
  adding one requires a login within the last 5 minutes, deleting one is always
  allowed and also ends every session that was established with it.

OIDC and magic links normalize a provider-verified email and resolve it to the
same account. A passkey never resolves through email: it belongs to the account
that registered it and never creates an account. Passwords, bearer JWTs,
refresh tokens, and browser-localStorage credentials are deliberately
unsupported.

The passkey relying party is derived from `AUTH_BASE_URL`: its host (without
port) is the relying-party ID and its origin is the only accepted origin. This
has two consequences:

- Passkeys only work when the app is opened through that exact origin. They do
  not work through the Vite dev server (`localhost:3000`) while `AUTH_BASE_URL`
  points at the backend.
- Changing the deployment's domain invalidates every registered passkey,
  because passkeys are bound to the relying-party ID. Users can still sign in
  with a magic link and register new passkeys.

Successful login sets the opaque `my_car_session` cookie. It is `Secure`,
`HttpOnly`, `SameSite=Lax`, and backed by a revocable server-side session. This
means browser login testing requires HTTPS (browsers treat `localhost`
specially in some contexts, but deployments must terminate TLS).

## Running it

```bash
cd backend
go run .
```

To replace **all application data** in the configured database with sample
data, run from `backend/`:

```bash
DATABASE_URL='postgres://...' go run . seed alice@example.com bob@example.com
```

At least one email address is required. Addresses are normalized and deduplicated;
each account gets 4 cars, 500 refuels, 75 repairs, and 90 tickets spread over
the past five years. The command applies pending migrations and needs only
`DATABASE_URL` (no SMTP, OIDC, or server settings). It deletes existing accounts,
expenses, sessions, and pending login state in one transaction. Do not run it
against a database whose data you want to keep.

The database it will talk to comes from compose:

```bash
docker compose up -d db      # Postgres on localhost:5432
```

Add `--profile dev` for pgadmin (`localhost:8081`) and Mailpit
(`localhost:8025`) alongside it. Mailpit accepts the `.env.example` SMTP
settings and displays delivered magic links in its web UI.

## Importing the legacy data

`import-legacy` copies the legacy MariaDB data, exported with `mysqldump`, into
a **fresh** database. It runs once: it refuses to write if accounts, cars or
expenses already exist, and it writes everything in one transaction. Run a dry
run first. It needs no database and prints only the problems it finds, one per
line, or `no problems found`:

```bash
go run . import-legacy ../dump.sql --dry-run
DATABASE_URL='postgres://...' go run . import-legacy ../dump.sql
```

A real run applies pending migrations, validates the whole dump, writes nothing
if there is any problem, and prints the imported row counts. The mapping
rules (category labels, purchase price `0` → empty, dropped credentials, and
so on) are specified in `openspec/specs/platform/legacy-data-import`.

In production, mount the dump into the app container and run the same binary:

```bash
docker compose --profile prod run --rm -v "$PWD/dump.sql:/dump.sql:ro" \
  app import-legacy /dump.sql --dry-run
```

Nobody should log in between deploying to the empty database and running the
import: a login creates an account, and the database then no longer counts as
fresh. Afterwards, legacy users sign in by magic link or OIDC with their legacy
email address. Delete the dump once it has been imported, because it contains
personal data.


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
