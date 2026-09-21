# Design

## Context

See `proposal.md` — Why. The constraint that shapes everything below: the
`Dockerfile` and `docker-compose.yml` were written deliberately, with comments
explaining the Node 26 corepack removal, the distroless busybox shell and the
self-probing healthcheck. `frontend/` is an untouched `create-tanstack-app`
scaffold and `backend/main.go` is a hello-world. Where the two disagree, the
build files are the considered artifact and the scaffold is the accident.

`old/` is read-only reference material and is not part of any build.

## Goals / Non-Goals

**Goals:**

- `docker build` succeeds end to end, from a clean clone, with no manual steps.
- CI fails on anything that would break that build, and on lint, type and test
  regressions in either half of the repo.
- The environment a deployer has to supply is written down in one place.

**Non-Goals:**

- Any runtime behaviour. No HTTP server, no routes, no database.
- A healthy container. The image's `HEALTHCHECK` calls `server healthcheck`,
  which `backend-foundation` adds; until then a started container reports
  unhealthy, and that is expected rather than a defect of this change.
- Editing `Dockerfile` or `docker-compose.yml`. They define the target; the
  repository is brought up to them.
- Filling in the OpenAPI document. `api-contract-v1` owns that.

## Decisions

### Vite emits `out/`, rather than the Dockerfile reading `dist/`

The mismatch can be fixed from either end: set `build.outDir` in
`vite.config.ts`, or point the `Dockerfile`'s `COPY` at Vite's default `dist/`.

Changing Vite is the better of the two because the `Dockerfile` is the authored
file and `vite.config.ts` is generated scaffolding nobody has edited. `out` is
also the name already used downstream — the backend stage clears and recreates
`static/out`, and the binary will embed that directory — so one name carries
through the whole build chain.

The cost is a config line that departs from a tool default, which is why it
gets a comment pointing at the `Dockerfile`. Rejected alternative: change the
`Dockerfile` to `dist/`, which is a smaller diff but edits the file this change
is meant to satisfy.

### Pin pnpm with a `packageManager` field

The `Dockerfile` runs `corepack enable && pnpm install --frozen-lockfile`
without a `packageManager` field in `package.json`, so corepack resolves
whatever pnpm version it defaults to. CI would resolve independently. Two
different pnpm majors reading one lockfile is a failure that appears as a
mysterious install error months later, on whichever machine updated first.

Adding `"packageManager": "pnpm@<version>"` makes Docker and CI resolve the
same version from the same source of truth. The committed lockfile declares
`lockfileVersion: '9.0'`, which spans more than one pnpm major, so the version
to pin is whichever one installs that lockfile with `--frozen-lockfile` without
rewriting it — established during implementation rather than guessed here.

### CI is one workflow with three parallel jobs

`backend` (build, vet, test), `frontend` (install, check, build) and `image`
(`docker build`). Parallel rather than sequential so a failure names itself
without reading logs, and so the slow image build does not delay the fast
feedback.

The image job rebuilds both halves inside Docker, duplicating work the other
two jobs do. That is accepted: it is the only job that proves the artifact we
actually ship builds, and the other two fail faster and more legibly when
something ordinary is wrong.

Go's version comes from `go-version-file: backend/go.mod` rather than a literal,
so CI cannot drift from the module. Note that `go.mod` requires Go 1.26.5 while
the `Dockerfile` builds on `golang:1.27-alpine`; that skew is intentional to
leave alone here — CI checks the module's floor, the image builds on a newer
toolchain, and nothing about this change needs them equal.

### The OpenAPI file is valid and empty, not a stub with an example path

`paths: {}` is valid OpenAPI 3.1. A placeholder endpoint would be embedded into
the binary and would have to be found and removed later; an empty document
cannot mislead anyone and satisfies the `COPY`.

No spec linter is added yet. `api-contract-v1` adds one along with the content
worth linting.

### `.env.example` documents variables that are not read yet

It covers what `docker-compose.yml` sets today plus the `OIDC_*` variables
`auth-oidc-magic-link` will need, the latter commented out and marked as not yet
implemented. Writing them down now costs a few lines and prevents the classic
deploy-day discovery that the compose file and the application disagree about
what configuration exists.

All values are obvious placeholders. Nothing resembling a real secret is
committed.

## Risks / Trade-offs

- **An unpinned pnpm silently changes the lockfile format** → pin via
  `packageManager`, and have CI use `--frozen-lockfile` so a drifted lockfile
  fails rather than being rewritten.
- **Node 26 no longer bundles corepack**, so `corepack enable` alone fails →
  CI installs corepack from npm first, exactly as the `Dockerfile` already does.
  Both places carry the same comment so the next person does not "simplify" one
  of them.
- **The image job is slow and uncached**, so every push pays a full Docker
  build → accepted for now at this repo size; if it becomes the bottleneck, add
  a registry or GitHub Actions cache in a later change rather than dropping the
  job.
- **A green CI here still leaves an unhealthy container**, which reads as a
  half-finished change → stated in the proposal, in `backend/README.md`, and in
  this design, so it is a known gap rather than a surprise.
- **`.env.example` drifts from what the app reads**, since nothing enforces the
  relationship → `backend-foundation` introduces config parsing and should add
  a check at that point; until then the file is documentation and is marked as
  such.

## Migration Plan

Additive. Nothing deploys, no data moves, no consumer depends on any of it.
Rollback is reverting the change; the repository returns to a state where the
image cannot be built, which is where it started.

## Open Questions

- Whether CI should also stand the compose stack up and smoke-test it. That
  only becomes meaningful once there is an endpoint to probe, so it is
  `backend-foundation`'s call and does not change anything here.
