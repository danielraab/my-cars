# Tasks

## 1. API contract

- [x] 1.1 Complete the refuel collection, station-suggestion, page, and standalone response schemas in `openapi/openapi.yaml`, including strict request schemas and the positive-litres validation reason; verify `cd frontend && pnpm lint:openapi` passes.
- [x] 1.2 Synchronize `backend/openapi.yaml` and regenerate `frontend/src/api/schema.gen.ts`; verify the backend OpenAPI synchronization test and generated-client type check pass.

## 2. Backend refuel API

- [x] 2.1 Add the caller-scoped refuel repository/store with `(date, id)` keyset pagination, collection filters, owned station suggestions, and ownership-safe single-resource queries; verify store tests cover pagination, filter isolation, and suggestions.
- [x] 2.2 Add authenticated handlers for list, create, retrieve, update, delete, and station suggestions with strict field, decimal, date, enum, odometer, and positive-litres validation; verify handler tests cover success, `400`, `401`, and missing/non-owned `404` cases.
- [x] 2.3 Add the complete `/refuels/chart` query and server-side per-litre, distance, and consumption calculation; verify tests cover multiple cars, missing readings, non-positive distances, and a predecessor outside a table page.
- [x] 2.4 Register the refuel routes in the application server behind the existing session middleware; verify `go test ./...` passes from `backend/`.

## 3. Frontend refuel workflow

- [x] 3.1 Add guarded API client functions and TanStack query helpers for refuel CRUD, cursor pages, stations, and chart data; verify client tests reject malformed response payloads.
- [x] 3.2 Implement the `/refuels` list route with caller-car filtering, table pagination, loaded-row total, and a complete-series fuel-price chart; verify route tests cover loading, retry, filtering, and load-more behavior.
- [x] 3.3 Implement shared refuel creation/editing form behavior with car preselection, caller-owned station datalist, localized fuel choices, field validation, and two-step deletion; verify component and route tests cover create, edit, invalid input, and deletion confirmation.
- [x] 3.4 Add German and English translations for every refuel UI string and validation reason; verify frontend tests pass in both active locales.

## 4. Integration verification

- [x] 4.1 Run `go test ./...` in `backend/`, then `pnpm test`, `pnpm lint`, and `pnpm lint:openapi` in `frontend/`; verify all checks pass.
- [ ] 4.2 Manually verify an authenticated user can create, filter, edit, and delete a refuel and that its fuel-price chart and consumption data stay correct after loading more table pages.
