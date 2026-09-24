# Design

## Context

The single CI workflow has independent backend, frontend, and image jobs, but
each currently runs for every `push` and `pull_request`. The Docker image uses
both application directories and the root OpenAPI document; the frontend also
lints that document.

## Goals / Non-Goals

**Goals:**

- Determine changed paths before any expensive CI job starts.
- Gate each job using outputs from that determination.
- Keep CI workflow changes conservatively covered by all affected jobs.

**Non-Goals:**

- Split the workflow into separate files or alter branch/event triggers.
- Skip tests within a selected job.
- Add cache, concurrency, or deployment changes.

## Decisions

### Use one `dorny/paths-filter` detection job

The workflow gains a `changes` job that checks out the repository with enough
history for comparisons and uses `dorny/paths-filter@v3`. It compares a pull
request head to its base SHA, and a push only to `github.event.before` (the
previous pushed commit). It publishes boolean outputs consumed through
`needs.changes.outputs.<name>` by the existing jobs.

Native workflow-level `paths` filters were rejected because they skip the whole
workflow, not individual jobs. Per-job `git diff` commands were rejected because
they duplicate event-specific base-SHA handling and still allocate each runner.

### Define conservative ownership filters

| Output | Changed paths |
| --- | --- |
| `backend` | `backend/**`, `openapi/**`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| `frontend` | `frontend/**`, `openapi/**`, `redocly.yaml`, `.github/workflows/ci.yml` |
| `image` | `Dockerfile`, `backend/**`, `frontend/**`, `openapi/**`, `.github/workflows/ci.yml` |

The root OpenAPI source triggers every consumer that embeds, lints, or packages
it. The CI workflow triggers all jobs so a workflow change is exercised. Pure
documentation and OpenSpec paths do not match any expensive-job filter.

### Preserve job names and make skipped jobs explicit

The existing backend, frontend, and image job IDs and visible names remain
unchanged. Their job-level `if` expressions combine `always()` with the relevant
change output so they evaluate even after the detector and only run on a `true`
output. A skipped job is visible as skipped in the GitHub Actions UI rather than
silently succeeding.

## Risks / Trade-offs

- [A path is omitted from a filter] → Include root build and workflow inputs
  conservatively and add fixture-style tests for representative change sets.
- [A skipped required job blocks merge] → Verify the repository's branch
  protection rules accept skipped checks before enabling the change.
- [The external action changes] → Pin to its v3 major release and rely on its
  maintained GitHub event handling.

## Migration Plan

1. Add the detection job, permissions, filters, and dependent job conditions.
2. Validate workflow YAML and exercise the filter action against representative
   backend-only, frontend-only, OpenAPI, Dockerfile, CI-workflow, and docs-only
   path sets.
3. Confirm the pull-request Actions UI runs only the expected jobs before merge.
4. Roll back by removing the detector and job conditions; the existing
   unconditional workflow is restored without application impact.
