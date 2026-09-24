# Tasks

## 1. Shared contract conventions

- [x] 1.1 Replace the placeholder `openapi/openapi.yaml` with a valid OpenAPI 3.1 v1 document, reusable common schemas, cookie security scheme, standard errors, UUID/date/decimal formats, and cursor parameters; verify it resolves and validates with the selected OpenAPI validator.
- [x] 1.2 Define the common paginated collection response and deterministic cursor ordering/filter parameters for cars and expenses; verify example requests and responses validate against the document.
- [x] 1.3 Define documented `401`, `404`, validation, conflict, and server-error responses for every protected v1 operation; verify the validator reports no operation missing a declared error response.

## 2. Authentication and profile contract

- [x] 2.1 Add OIDC initiation/callback, magic-link request/consumption, current-session, and logout operations with redirect and cookie-session responses; verify the document has no password, bearer-token, or refresh-token operations.
- [x] 2.2 Define `GET` and `PATCH /api/v1/me`, including duplicate-email conflict and profile schemas; verify the operations and examples validate.

## 3. Vehicle and expense contract

- [x] 3.1 Define car collection, create, retrieve, update, delete, and per-car expense collection operations with all parity fields from `EP-07`–`EP-17`; verify every operation is protected and ownership errors are documented.
- [x] 3.2 Define paginated refuel, repair, and ticket collection/create/detail/update/delete operations, including zero-value updates and caller-scoped suggestion endpoints; verify request and response examples validate.
- [x] 3.3 Define complete refuel-chart and bounded expense-statistics operations, including server-derived refuel fields and categorized date buckets; verify their schemas support `DRV-01`–`DRV-03` and dashboard chart data without page accumulation.

## 4. Published document and validation

- [x] 4.1 Synchronize `backend/openapi.yaml` with the root OpenAPI source and add a regression test that compares their contents; verify `go test ./...` passes in `backend/`.
- [x] 4.2 Add the OpenAPI validation command and its required development dependency to the repository's documented local and CI checks; verify the command runs from a clean checkout and CI invokes it.
- [x] 4.3 Run `openspec validate api-contract-v1 --strict`, the OpenAPI validator, backend tests, frontend `pnpm check`, and `pnpm build`; verify all pass without changes under `old/`.
