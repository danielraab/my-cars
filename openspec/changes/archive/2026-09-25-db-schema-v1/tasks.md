# Tasks

## 1. Align the API contract

- [x] 1.1 Update `openapi/openapi.yaml` to make car fuel, refuel fuel, repair type, and ticket type the agreed stable enums; make expense odometer readings nullable; verify `cd frontend && pnpm lint:openapi` passes.
- [x] 1.2 Synchronize the generated/served `backend/openapi.yaml` copy with the source document and verify `go test ./...` passes the byte-identical OpenAPI regression test.

## 2. Add the initial application schema

- [x] 2.1 Add an embedded SQL migration (and rollback) that enables UUID generation and creates the four agreed PostgreSQL enum types; verify migrations apply successfully to a clean Postgres database.
- [x] 2.2 Add `accounts` and `cars` with UUID keys, normalized unique account email, timestamps, ownership constraint, car fields, nullable optional fields, and documented checks; verify integration tests cover accepted and rejected rows.
- [x] 2.3 Add `refuels`, `repairs`, and `tickets` with their enum categories, nullable non-negative odometer readings, `numeric` values, required-field checks, car foreign keys, and hard-delete cascade; verify integration tests cover constraints and cascading deletion.
- [x] 2.4 Add the shared `updated_at` trigger and owner/date cursor-query indexes; verify updates advance timestamps and database metadata contains the intended indexes.

## 3. Strengthen migration verification

- [x] 3.1 Update database migration tests for the new migration version and add clean-schema assertions for tables, enum values, constraints, and rerun safety; verify with `DATABASE_URL=... go test ./backend/internal/db`.
- [x] 3.2 Run the complete backend test suite against Postgres and verify `go test ./...` passes with migrations applied at startup.

## 4. Document the deferred data migration

- [x] 4.1 Add concise developer documentation describing the future one-time import's preflight/reporting requirement, legacy field/category mappings, deliberate credential-token exclusion, and unresolved source-timezone policy; verify it does not add an importer or edit `old/`.

## 5. Validate the change

- [x] 5.1 Run `openspec validate db-schema-v1 --strict`, `cd frontend && pnpm lint:openapi`, and the backend test suite; verify all pass and `git diff --check` reports no whitespace errors.
