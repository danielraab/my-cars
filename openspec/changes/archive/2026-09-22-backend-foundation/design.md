# Design

## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `backend/main.go` is a hello-world today; nothing to preserve.
- The `Dockerfile` is the considered artifact (see `bootstrap-build`'s
  design): it already `go:embed`s `static/out/` and `openapi.yaml` into the
  binary and calls `["/app/server", "healthcheck"]` as the container
  `HEALTHCHECK`, with no shell and no `curl` in the final distroless image.
  Both existed before this change and are not renegotiable here.
- `backend/.env.example` already names every variable the app will read
  through `auth-oidc-magic-link` (`PORT`, `DATABASE_URL`, `SMTP_*`,
  `AUTH_BASE_URL`, plus commented-out `OIDC_*`). `bootstrap-build` flagged
  config-vs-`.env.example` drift as a risk for this change to close.
- CI's `backend` job (`go build/vet/test`) currently has no database. This
  change is the first to need one.
- `go.mod` requires Go 1.26.5; the `Dockerfile` builds on `golang:1.27-alpine`.
  That skew is intentional (per `bootstrap-build`) and untouched here.

## Goals / Non-Goals

**Goals:**

- A single binary, two modes: run the server (default), or self-probe and
  exit (`healthcheck`).
- Config, DB connection, and migrations are structured so `api-contract-v1`
  and `auth-oidc-magic-link` add to them rather than restructure them.
- No dependency that can't run `CGO_ENABLED=0` in the distroless final
  image.

**Non-Goals:**

- Any domain schema (users, cars, refuels, ...). This change's migration
  directory exists and runs; it creates nothing beyond the migration
  tool's own version-tracking table.
- Auth of any kind. `/api/healthz` and `/api/openapi.yaml` are
  unauthenticated by design — they're infrastructure, not user data.
- Filling in `openapi.yaml`'s content. `api-contract-v1` owns that; this
  change only serves whatever bytes are embedded.
- A migration CLI subcommand (`server migrate`). Migrations run
  automatically at startup; see Decisions.

## Decisions

**stdlib `net/http` `ServeMux`, no router dependency.** Go 1.22 added
method-aware patterns (`"GET /api/healthz"`) to the stdlib mux, which
covers everything this change and the near-term roadmap need: fixed
paths, one prefix-based catch-all for static/SPA fallback. A router
library (chi, gorilla/mux) would earn its keep once routes need
middleware chains or path-parameter extraction at scale — `api-contract-v1`
can add one then if it turns out to be warranted. Adding it speculatively
now is exactly the premature dependency this project's conventions warn
against.

**pgx v5 as the only Postgres driver, via `pgxpool` for the app and
`pgx/v5/stdlib` only where a `database/sql.DB` is required.** `pgx` is the
actively maintained, CGO-free Postgres driver for Go; `lib/pq` (the
alternative) is in maintenance mode. Using pgx everywhere avoids carrying
two driver families for one database.

**`golang-migrate/migrate/v4` with the `iofs` source (embedded SQL files)
and its `pgx/v5` database driver.** It's the most widely used Go migration
library, tracks applied versions in its own table, and supports up/down
migrations as plain `.sql` files embedded via `go:embed` — no migration
binary or extra runtime dependency needed inside the distroless image.
Rejected: `pressly/goose`, which does the same job with a similar API;
`golang-migrate` was chosen over it only for its wider adoption and more
detailed `iofs` documentation, not a functional gap in goose. Rejected:
hand-rolled version tracking — reinvents up/down tracking and ordering for
no benefit at this scale.

**Migrations run automatically at process startup, before the server
accepts connections, and a failure exits the process non-zero.**
`docker-compose.yml` already gates the `app` service on the `db` service's
own healthcheck (`depends_on: condition: service_healthy`), so the
database is expected to be reachable by the time this process starts; a
migration failure at that point is a real problem, not a transient race,
and should stop the container rather than serve traffic against a
half-migrated schema. Rejected: a separate `server migrate` subcommand run
as a manual or CI/CD step — there's no deploy pipeline yet to call it, and
introducing one is a later change's decision, not this one's.

**`/api/healthz` checks live DB reachability on every call, not a
cached/startup-only flag.** The Docker `HEALTHCHECK` polls every 30s; a
direct `SELECT 1`-equivalent ping is cheap at that rate and reflects the
database going away *after* startup (e.g. a DB restart), which a
startup-only flag would miss.

**Config is one `Config` struct covering every variable
`.env.example` currently documents, parsed and validated at startup, with
a test asserting the struct's field set matches `.env.example`'s
variable names.** This directly closes the drift risk `bootstrap-build`
flagged. `SMTP_*` and `AUTH_BASE_URL` are parsed even though nothing reads
their values yet (`auth-oidc-magic-link` will) — parsing them now means
the drift test covers them from day one instead of two changes from now.
`OIDC_*` stays out of `Config` entirely, matching `.env.example`'s comment
that they're not implemented yet; adding them is `auth-oidc-magic-link`'s
job.

**CI's `backend` job gains a `postgres:17` service container, matching
`docker-compose.yml`'s `db` service (same image, same credentials).**
Migration and connection-pool tests need a real database; a service
container is the standard GitHub Actions pattern and keeps the job
self-contained (no dependency on a separate compose invocation).

**Subcommand dispatch is a plain `os.Args[1] == "healthcheck"` check, not
a CLI framework.** Two modes total; a framework (cobra, kong) is
unjustified weight for a binary with one flag-free subcommand.

## Risks / Trade-offs

- **Migrations-on-startup means a bad migration blocks every future
  deploy until it's fixed or manually resolved.** → Accepted at this
  project's current scale (single instance, no rolling deploys yet); the
  alternative (a separate migrate step) needs a deploy pipeline this
  project doesn't have yet, and revisiting this decision is cheap once one
  exists.
- **Parsing `SMTP_*`/`AUTH_BASE_URL` now, before anything reads them, is
  dead config until `auth-oidc-magic-link` lands.** → The alternative (add
  them piecemeal later) is exactly the drift pattern this change exists to
  close; a few unused struct fields is a small cost against that.
- **A `postgres:17` service container slows every CI run on `backend`,**
  even changes that don't touch the database. → Accepted: the alternative
  (skip DB-dependent tests in CI) would let a broken migration merge
  silently, which is worse than a slower job.
- **stdlib `ServeMux`'s pattern matching is less expressive than a router
  library** (no regex, limited wildcard capture). → Acceptable for the
  three routes this change adds; revisit if `api-contract-v1`'s route set
  makes that limitation concrete rather than hypothetical.

## Migration Plan

Additive only: no existing deployed behavior changes. A container built
before this change simply reports unhealthy forever (the known,
already-documented gap); after this change it reports healthy once the
database is reachable. Rollback is reverting the change — the database's
migration-tracking table is the only artifact left behind, and it's
harmless with no application reading from a schema it created (there is
none yet).
