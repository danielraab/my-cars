# Tasks

## 1. Frontend build output

- [ ] 1.1 Set `build: { outDir: 'out' }` in `frontend/vite.config.ts`, with a comment naming the `Dockerfile` as the reason, and verify `pnpm build` writes `frontend/out/index.html` and leaves no `frontend/dist/`
- [ ] 1.2 Add `out` to `frontend/.gitignore` and verify `git status --short` is clean after a build

## 2. Pin the package manager

- [ ] 2.1 Determine which pnpm version installs the committed `pnpm-lock.yaml` with `--frozen-lockfile` without rewriting it, by running the install and verifying `git diff --exit-code frontend/pnpm-lock.yaml` passes
- [ ] 2.2 Add that version as `"packageManager": "pnpm@<version>"` in `frontend/package.json` and verify `corepack enable && pnpm --version` in a clean container reports it

## 3. API contract placeholder

- [ ] 3.1 Create `openapi/openapi.yaml` as an OpenAPI 3.1 document with `info` (title, version) and `paths: {}`, plus a comment saying `api-contract-v1` fills it in, and verify it parses as YAML
- [ ] 3.2 Verify the backend stage's `COPY openapi/openapi.yaml` now resolves by building that stage alone with `docker build --target backend .`

## 4. Backend housekeeping

- [ ] 4.1 Add `static/out/` to `backend/.gitignore` and verify a build that populates it leaves `git status --short` clean
- [ ] 4.2 Write `backend/README.md` covering how to run the backend, the variables it will read, and the fact that the container reports unhealthy until `backend-foundation` adds `/api/healthz` and the `server healthcheck` subcommand

## 5. Environment documentation

- [ ] 5.1 Create `backend/.env.example` with every variable `docker-compose.yml` sets (`PORT`, `DATABASE_URL`, `SMTP_*`, `AUTH_BASE_URL`) using placeholder values, and verify each name matches the compose file exactly
- [ ] 5.2 Append the `OIDC_*` variables `auth-oidc-magic-link` will need, commented out and marked not yet implemented, and verify no value in the file resembles a real credential

## 6. Continuous integration

- [ ] 6.1 Add `.github/workflows/ci.yml` triggered on push and pull request, with a `backend` job running `go build ./...`, `go vet ./...` and `go test ./...` using `go-version-file: backend/go.mod`, and verify it passes on this branch
- [ ] 6.2 Add the `frontend` job: install corepack from npm before `corepack enable` (Node 26 no longer bundles it, same as the `Dockerfile`), then `pnpm install --frozen-lockfile`, `pnpm check` and `pnpm build`, and verify it passes
- [ ] 6.3 Add the `image` job running `docker build .` with no push, and verify it produces an image
- [ ] 6.4 Verify the three jobs run in parallel and that each one's failure is attributable from the job name alone, by reading the workflow run summary

## 7. Documentation corrections

- [ ] 7.1 Remove reminders from the product description in `README.md` and verify no occurrence of "reminder" remains outside `old/`
- [ ] 7.2 Remove wording implying a password login from `README.md`, leaving magic link and OIDC as the only methods described, and verify against the Scope decisions in the migration plan

## 8. Acceptance

- [ ] 8.1 From a clean clone of the branch, verify `docker build .` succeeds end to end with no manual steps
- [ ] 8.2 Verify CI is green on the pull request, with all three jobs reporting success
- [ ] 8.3 Verify `old/` is untouched: `git diff --stat` against the branch point shows no path under `old/`
