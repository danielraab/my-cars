# Proposal

## Why

The repository's `Dockerfile`, `docker-compose.yml` and docs describe a finished
system, but the image cannot be built. `Dockerfile` copies
`openapi/openapi.yaml`, which does not exist, and copies the frontend bundle
from `frontend/out/`, while `vite.config.ts` sets no `build.outDir` and so
writes `frontend/dist/`. There is no CI at all, although `docker-compose.yml`
states that CI runs the same shape as the compose stack.

Every later change in the rewrite — the API contract, the schema, auth, each
feature slice — depends on a build that runs and a gate that proves it still
runs. Until then there is nothing to add code to and nothing to catch a
regression.

## What Changes

- Set `build.outDir` to `out` in `frontend/vite.config.ts` and ignore
  `frontend/out/`, so the directory the `Dockerfile` copies is the directory
  Vite writes.
- Add `openapi/openapi.yaml` as a valid but empty OpenAPI 3.1 document (`info`
  plus an empty `paths`), so the `COPY` in the backend build stage resolves.
  `api-contract-v1` fills it in; this change only stops the build from failing.
- Add `.github/workflows/ci.yml` running, on push and pull request: `go build`,
  `go vet` and `go test ./...`; `pnpm install --frozen-lockfile`, `pnpm check`
  and `pnpm build`; and a `docker build` of the real image.
- Add `backend/.env.example` documenting every variable the app reads,
  including the `OIDC_*` variables `auth-oidc-magic-link` will need. Values are
  placeholders; no secret is committed.
- Add `static/out/` to `backend/.gitignore`, and write `backend/README.md`,
  which is currently empty.
- Correct `README.md`: drop reminders from the product description, since
  reminders are out of scope for the rewrite, and drop any wording implying a
  password login, since auth is magic link and OIDC only.

No runtime behaviour changes. `backend/main.go` still prints and exits; the
container's `HEALTHCHECK` calls `server healthcheck`, which does not exist yet,
so a started container reports unhealthy until `backend-foundation` adds
`/api/healthz` and that subcommand. Acceptance for this change is therefore
that `docker build` succeeds end to end and CI is green — not that the stack
comes up healthy.

## Capabilities

### New Capabilities

None. This change adds no behaviour: it is build configuration, CI and docs.
`.openspec.yaml` sets `skip_specs: true` accordingly.

### Modified Capabilities

None. No spec exists yet, and no requirement changes here.

## Impact

- **Files**: `frontend/vite.config.ts`, `frontend/.gitignore`,
  `openapi/openapi.yaml` (new), `.github/workflows/ci.yml` (new),
  `backend/.env.example` (new), `backend/.gitignore`, `backend/README.md`,
  `README.md`.
- **Not touched**: `backend/main.go`, `frontend/src/`, `Dockerfile`,
  `docker-compose.yml`. The build files are treated as the specification of the
  target layout; this change makes the repository match them rather than
  editing them to match the repository.
- **`old/`**: untouched and read-only, as `AGENTS.md` requires.
- **Process**: CI becomes a required gate for every later change, so the cost of
  a broken build is paid once, here.
- **Follow-on**: `api-contract-v1` replaces the placeholder spec;
  `backend-foundation` makes the container actually report healthy;
  `data-import` later adds a `tools/db-migration/` job to this same workflow.
