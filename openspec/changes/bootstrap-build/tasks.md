# Tasks

> Verification note: the image build (3.2, 8.1) and the CI run (6.1–6.4, 8.2)
> cannot be checked from the development sandbox — Docker Hub blob downloads
> are blocked by its network policy, and a workflow only runs once pushed.
> Every `COPY` source in the `Dockerfile` was verified to exist instead, and
> the commands each CI job runs were executed locally and pass. Those boxes
> stay unticked until the first CI run confirms them.

## 1. Frontend build output

- [x] 1.1 Set `build: { outDir: 'out' }` in `frontend/vite.config.ts`, with a comment naming the `Dockerfile` as the reason, and verify `pnpm build` writes `frontend/out/index.html` and leaves no `frontend/dist/`
- [x] 1.2 Add `out` to `frontend/.gitignore` and verify `git status --short` is clean after a build

## 2. Pin the package manager

- [x] 2.1 Determine which pnpm version installs the committed `pnpm-lock.yaml` with `--frozen-lockfile` without rewriting it, by running the install and verifying `git diff --exit-code frontend/pnpm-lock.yaml` passes — pnpm 12.5.1
- [x] 2.2 Add that version as `"packageManager": "pnpm@12.5.1"` in `frontend/package.json` and verify `corepack pnpm --version` reports it

Deviations recorded during implementation:

- [x] 2.3 pnpm 12 records its own binaries in the lockfile once `packageManager` is set (+158 lines). Verify this is stable rather than churn: two consecutive `--frozen-lockfile` installs leave the lockfile byte-identical
- [x] 2.4 Remove the dead `pnpm.onlyBuiltDependencies` block from `frontend/package.json` — pnpm 12 warns it is ignored, and `pnpm-workspace.yaml`'s `allowBuilds` already carries the same allow-list — and verify a clean install runs esbuild and lightningcss builds without the warning

## 3. API contract placeholder

- [x] 3.1 Create `openapi/openapi.yaml` as an OpenAPI 3.1 document with `info` (title, version) and `paths: {}`, plus a comment saying `api-contract-v1` fills it in, and verify it parses as YAML
- [ ] 3.2 Verify the backend stage's `COPY openapi/openapi.yaml` now resolves by building that stage alone with `docker build --target backend .`

## 4. Backend housekeeping

- [x] 4.1 Add `static/out/` to `backend/.gitignore` and verify a build that populates it leaves `git status --short` clean
- [x] 4.2 Write `backend/README.md` covering how to run the backend, the variables it will read, and the fact that the container reports unhealthy until `backend-foundation` adds `/api/healthz` and the `server healthcheck` subcommand
- [x] 4.3 Also ignore `/my-car`, the binary `go build ./...` leaves in `backend/`, and verify it no longer shows in `git status --short` after a build

## 5. Environment documentation

- [x] 5.1 Create `backend/.env.example` with every variable `docker-compose.yml` sets (`PORT`, `DATABASE_URL`, `SMTP_*`, `AUTH_BASE_URL`) using placeholder values, and verify each name matches the compose file exactly
- [x] 5.2 Append the `OIDC_*` variables `auth-oidc-magic-link` will need, commented out and marked not yet implemented, and verify no value in the file resembles a real credential

## 6. Continuous integration

- [ ] 6.1 Add `.github/workflows/ci.yml` triggered on push and pull request, with a `backend` job running `go build ./...`, `go vet ./...` and `go test ./...` using `go-version-file: backend/go.mod`, and verify it passes on this branch
- [ ] 6.2 Add the `frontend` job: install corepack from npm before `corepack enable` (Node 26 no longer bundles it, same as the `Dockerfile`), then `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm typecheck` and `pnpm build`, and verify it passes
- [ ] 6.3 Add the `image` job running `docker build .` with no push, and verify it produces an image
- [ ] 6.4 Verify the three jobs run in parallel and that each one's failure is attributable from the job name alone, by reading the workflow run summary

## 7. Documentation corrections

- [x] 7.1 Remove reminders from the product description in `README.md` and verify no occurrence of "reminder" remains outside `old/`
- [x] 7.2 Remove wording implying a password login from `README.md`, leaving magic link and OIDC as the only methods described, and verify against the Scope decisions in the migration plan — no change needed, the README already described magic link and OIDC only

## 8. Make the existing lint gate pass

Unplanned, and required before task 6.2 could be honest: `pnpm check` failed
with nine errors on the untouched scaffold, whose `biome.json` asks for tabs
and double quotes while every file it checks is written with two spaces and
single quotes.

- [x] 8.1 Point `biome.json`'s formatter at the style the code is actually written in (`indentStyle: space`, `indentWidth: 2`, `quoteStyle: single`, `semicolons: asNeeded`) rather than reformatting six files on day one, and verify `.vscode/settings.json` returns to its committed content untouched
- [x] 8.2 Align `biome.json`'s `$schema` with the pinned `@biomejs/biome` 2.4.5 and verify the version-mismatch diagnostic is gone
- [x] 8.3 Replace the non-null assertion in `src/main.tsx` with an explicit check that throws a named error, and verify `lint/style/noNonNullAssertion` no longer fires
- [x] 8.4 Apply Biome's safe fixes (import ordering in three files) and verify `pnpm check` exits 0 and `git diff` shows no semantic change
- [x] 8.5 Add a `typecheck` script (`tsc --noEmit`) so CI can enforce the design's type-regression goal, and verify it exits 0

## 9. Acceptance

- [ ] 9.1 From a clean clone of the branch, verify `docker build .` succeeds end to end with no manual steps
- [x] 9.2 Verify every `COPY` source in the `Dockerfile` that reads from the build context exists, as the locally checkable part of 9.1
- [ ] 9.3 Verify CI is green on the pull request, with all three jobs reporting success
- [x] 9.4 Verify `old/` is untouched: `git diff --stat` against the branch point shows no path under `old/`
