# Proposal

## Why

Every push and pull request currently starts the backend, frontend, and image
jobs, even when a change can affect only one of them or only documentation.
This wastes CI capacity and delays useful feedback.

## What Changes

- Add a lightweight change-detection job that runs before all expensive CI jobs
  and exposes path-based outputs.
- Run the backend job only when backend or backend-image inputs change.
- Run the frontend job only when frontend or frontend-build inputs change.
- Run the image job only when a file included in the Docker build changes.
- Skip all expensive jobs for documentation-only and OpenSpec-only changes.
- Keep pull-request and push event coverage; only job selection changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None.

## Impact

- **Files**: `.github/workflows/ci.yml`; potentially CI documentation if a
  concise explanation is needed alongside the workflow.
- **CI**: adds one fast path-filter job and gates existing jobs with its outputs.
- **Product behaviour/API**: unchanged.
