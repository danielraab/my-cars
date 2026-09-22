# Tasks

## 1. Configuration

- [x] 1.1 Add a `Config` struct and loader that parses `PORT`,
      `DATABASE_URL`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_TLS` and
      `AUTH_BASE_URL` from the environment, failing with a clear error if a
      required variable is missing or malformed; verify with a unit test
      covering the all-present case and one missing-variable case per
      variable.
- [x] 1.2 Add a test asserting the `Config` struct's field set matches the
      uncommented variable names in `backend/.env.example` exactly, so the
      two can't drift; verify the test fails if either is edited without
      the other (check by temporarily adding a var to one side, confirming
      the test fails, then reverting).

## 2. Database connection and migrations

- [x] 2.1 Add a `pgxpool`-based connection pool built from
      `Config.DatabaseURL`; verify with a test (against the CI/local
      Postgres) that the pool can ping the database.
- [x] 2.2 Add an embedded (`go:embed`) migrations directory wired to
      `golang-migrate` (`iofs` source, `pgx/v5` database driver), with one
      no-op initial migration (up/down pair) so the embed pattern has a
      file to match; verify `migrate.Up()` succeeds against a fresh
      database and creates the library's own version-tracking table.
- [x] 2.3 Run migrations automatically at process startup, before the HTTP
      listener starts, exiting the process with a non-zero status and a
      logged error on migration failure; verify with a test that starts
      the app against a fresh database and confirms the version table
      reflects the latest migration afterward.

## 3. HTTP server and routes

- [x] 3.1 Implement `GET /api/healthz` per `specs/platform/healthcheck`:
      `200` when the DB pool ping succeeds, `503` when it fails, `405` for
      any other method; verify each of the spec's three scenarios with a
      handler test.
- [x] 3.2 Wire the stdlib `ServeMux` so every path under `/api/` is
      reserved for API routes and an unmatched `/api/` path returns `404`
      rather than falling through to the static/SPA handler; verify with a
      test requesting an unregistered `/api/` path.
- [x] 3.3 Embed `openapi.yaml` and serve it at `GET /api/openapi.yaml`;
      verify with a test comparing the response body byte-for-byte to the
      embedded file.
- [x] 3.4 Embed `static/out/` and serve it for `GET` requests outside
      `/api/`: the matching file when one exists, `index.html` otherwise;
      verify with a test for a known static asset path and a test for an
      arbitrary unmatched path, per `specs/platform/http-server`'s two
      serving scenarios.

## 4. CLI healthcheck subcommand

- [x] 4.1 Add subcommand dispatch in `main()`: `healthcheck` as the first
      argument runs the probe mode instead of the server; verify by
      confirming both code paths are reachable via a test on the dispatch
      logic.
- [x] 4.2 Implement the healthcheck probe: `GET
      http://localhost:{PORT}/api/healthz`, exit `0` on a `200` response,
      exit `1` on any other response or connection failure; verify with
      tests covering a `200` target, a `503` target, and an unreachable
      target.

## 5. CI and operational wiring

- [x] 5.1 Add a `postgres:17` service to `.github/workflows/ci.yml`'s
      `backend` job, matching `docker-compose.yml`'s `db` service
      credentials, and set `DATABASE_URL` for the job's steps; verify the
      workflow file is valid YAML and the credentials match
      `docker-compose.yml`.
- [ ] 5.2 Run `docker compose up --build` locally and confirm the `app`
      container's `HEALTHCHECK` reports `healthy` (`docker inspect
      --format='{{json .State.Health}}' <container>`) within its configured
      retries; record the result. **Blocked**: this sandbox's network policy
      denies Docker Hub image pulls outright (`docker build .` fails
      resolving even the base `docker/dockerfile:1` syntax image with a 403
      from the registry CDN, confirmed via the proxy's own status endpoint
      as a policy denial, not a transient failure). Verified everything
      short of the container instead: the compiled binary run directly
      against a local Postgres serves `/api/healthz` as `200`/`503`
      correctly and `server healthcheck` exits `0`/`1` to match (see 4.2's
      manual run). Needs a `docker compose up --build` in an environment
      with registry access to close out.

## 6. Verify the change

- [x] 6.1 Run `go build ./...`, `go vet ./...` and `go test ./...` in
      `backend/` (against a local Postgres via `docker compose up -d db`)
      and confirm all pass. Ran against a locally-installed Postgres 16
      instead of `docker compose up -d db` (Docker Hub pulls are blocked in
      this sandbox — see 5.2); same `DATABASE_URL` shape, same result: all
      packages build, vet clean, and every test passes (DB-dependent tests
      skip cleanly when `DATABASE_URL` is unset, confirmed separately).
- [x] 6.2 Run `openspec validate backend-foundation` and confirm it passes,
      including both new capabilities.
- [x] 6.3 Confirm `git status` shows no changes under `frontend/`,
      `openapi/openapi.yaml` or `old/`.
