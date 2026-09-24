# Tasks

## 1. Change detection

- [ ] 1.1 Add a lightweight `changes` job using `dorny/paths-filter@v3`, with permissions and event-safe checkout/comparison configuration; verify the workflow YAML parses and the job exposes backend, frontend, and image boolean outputs.
- [ ] 1.2 Configure the documented conservative path filters, including shared OpenAPI, Docker, compose, and CI-workflow inputs; verify representative backend-only, frontend-only, OpenAPI-only, Dockerfile-only, CI-only, and docs-only file sets produce the expected outputs.

## 2. Conditional jobs

- [ ] 2.1 Gate the existing backend, frontend, and image jobs on their matching change outputs while preserving their IDs, names, and commands; verify a documentation-only pull request visibly skips all three jobs.
- [ ] 2.2 Confirm backend-only, frontend-only, OpenAPI-only, and Dockerfile-only pull requests start only the required jobs; verify the image job still runs whenever any Docker build input changes.

## 3. Verify the change

- [ ] 3.1 Run a workflow YAML validator and inspect the pull-request Actions run for the change; verify the detector runs before job conditions are evaluated and no application code or `old/` files changed.
- [ ] 3.2 Run `openspec validate selective-ci-jobs --strict` and confirm all task evidence and path-filter decisions match `design.md`.
