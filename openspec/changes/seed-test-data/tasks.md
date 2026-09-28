# Tasks

## 1. Command and validation

- [x] 1.1 Add `seed` command dispatch, email validation/deduplication and database-only configuration; verify CLI unit tests for absent, malformed, and duplicate addresses.

## 2. Database reset and generation

- [x] 2.1 Add transactional application-table reset and account/car generation; verify integration tests retain migration history and remove existing auth and domain data.
- [x] 2.2 Add per-car, five-year expense generation with valid values; verify integration tests check per-account counts, ownership, chronology and rollback.

## 3. Documentation and checks

- [x] 3.1 Document destructive usage and required `DATABASE_URL` in backend README; verify the documented invocation matches the CLI.
- [x] 3.2 Run backend tests and OpenSpec validation; verify both pass or report unavailable integration prerequisites.
