# Proposal

## Why

Cars is the dependency root of the whole rewrite: a refuel, repair, or
ticket cannot exist without a car to belong to, and the `/home` dashboard
needs at least one car before it has anything to summarize. The contract
for it is already fully documented (`api-contract/cars`, from
`api-contract-v1`) and the database table already exists
(`persistence/schema`, from `db-schema-v1`), but there is no backend
implementation and `/cars` is still the deferred placeholder. Building it
now unblocks every later expense-tracking slice, and it is also the app's
first paginated list and first owner-scoped CRUD screen, so the patterns it
establishes (cursor pagination, partial updates with nullable fields,
two-step-confirm delete) are what refuels, repairs, and tickets will copy.

## What Changes

- Implement `GET/POST /api/v1/cars` and `GET/PATCH/DELETE
  /api/v1/cars/{carId}` in the backend, behind the existing cookie session,
  scoped to the caller's `account_id`. A car the caller does not own is
  treated the same as a missing one: `404`.
- **BREAKING (contract only, not yet implemented anywhere):** `CarInput` and
  `CarUpdate` gain `additionalProperties: false`. A request carrying an
  undocumented member is rejected with `400` and a field-level `unknown`
  reason, matching the strictness already established for `ProfileUpdate`.
- Add a handful of new field-reason codes to the shared `apierror` package
  (`empty`, `invalid_enum`, `invalid_date`, `invalid_decimal`, `negative`)
  and a `not_found` response code for owner-scoped lookups that miss.
- Replace the `/cars` placeholder with four screens: a paginated cars list
  (`SCR-09`), a create-car form (`SCR-10`), a car-detail screen showing the
  **Details** tab only (`SCR-11`), and an edit-car form with a two-step-confirm
  delete button (`SCR-12`).
- Fully localize the new screens (de/en), including the four fuel-type
  labels, and build the two-step-confirm delete as a standalone component so
  the refuel/repair/ticket edit screens (`SCR-15`, `SCR-18`, `SCR-21`) can
  reuse it unchanged.

## Capabilities

### New Capabilities

- `frontend/cars`: The cars list, create, detail (Details tab), and edit
  screens.

### Modified Capabilities

- `api-contract/cars`: Tightens `CarInput`/`CarUpdate` to reject unknown
  members and documents the new validation reason codes. The five
  operations themselves are unchanged from `api-contract-v1`.

## Impact

- **API contract**: `openapi/openapi.yaml` changes `CarInput`/`CarUpdate`
  and the `Error.fields` description. `backend/openapi.yaml` and
  `frontend/src/api/schema.gen.ts` are regenerated.
- **Backend**: a new `internal/cars` package (handler + pgx store);
  `internal/apierror` gains `NotFound` and five new reason constants;
  `main.go` wires the five routes behind `authService.RequireSession`.
- **Frontend**: four new routes under `_authenticated.cars.*`, new API
  client functions, a shared `TwoStepDeleteButton` component, de/en
  messages, and tests. The other deferred routes (refuels, repairs,
  tickets, dashboard) are untouched.
- **Database**: no migration. The `cars` table and its
  `(account_id, created_at, id)` index already exist.
- **Parity**: covers `SCR-09`, `SCR-10`, `SCR-12`, and the Details portion
  of `SCR-11`; `EP-07`, `EP-08`, `EP-09`, `EP-10` (as `PATCH`), `EP-11`.
- **Deferred, not a non-goal**: `SCR-11`'s Expenses and Consumption tabs
  need `EP-12`/`EP-14`/`EP-16` and `DRV-01`–`DRV-03`, which belong to the
  refuels/repairs/tickets slice along with the three flagged
  `api-contract-v1` open questions (predecessor odometer across pages,
  client-side car filter, chart truncation). Out of scope here.
