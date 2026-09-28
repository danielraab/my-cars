# Proposal

## Why

Repairs is the second vertical slice of the deferred expense-tracking work
cars-management set up (cursor pagination, tri-state partial updates,
two-step-confirm delete): `/repairs` is still the placeholder route, and
the backend has no `internal/repairs` package. The contract for it is
already largely documented (`api-contract/expenses`, from `api-contract-v1`)
and the database table already exists (`persistence/schema`, from
`db-schema-v1`), but three contract gaps block implementation: `GET
/repairs` has no response body schema (the shared `ExpenseCollection`
pathItem never had one), `/repairs/stations` inherits the wrong `operationId` from the shared
`StationSuggestions` pathItem it `$ref`s (`listRefuelStations`), and
`RepairInput`/`RepairUpdate` lack the `additionalProperties: false`
strictness `CarInput`/`CarUpdate` already have. Repairs is a smaller,
lower-risk slice than refuels (no derived per-litre/consumption values, no
fuel-price chart) and structurally close to cars, making it the natural
next slice while those patterns are still fresh.

## What Changes

- Implement `GET/POST /api/v1/repairs`, `GET/PATCH/DELETE
  /api/v1/repairs/{repairId}`, and `GET /api/v1/repairs/stations` in the
  backend, behind the existing cookie session, scoped to the caller's cars
  via a join (repairs has no `account_id` column of its own). A repair
  whose car the caller does not own is treated the same as a missing one:
  `404`.
- **BREAKING (contract only, not yet implemented anywhere):** `RepairInput`
  and `RepairUpdate` gain `additionalProperties: false`, matching
  `CarInput`/`CarUpdate`. An unknown member is rejected with `400` and a
  field-level `unknown` reason.
- Add a `RepairPage` response schema and document `GET /repairs`'s `200`
  response with it directly (rather than through the shared
  `ExpenseCollection` pathItem, whose `200` has never had a response body
  schema); give `/repairs/stations` its own inline operation and
  `operationId` instead of inheriting `listRefuelStations` from the shared
  `StationSuggestions` pathItem. `/refuels` and `/tickets` keep using the
  still-undocumented shared pathItems until their own slices fix them the
  same way.
- Generalize the `negative` field-reason's description in `Error.fields`
  (currently written only in terms of `purchasePrice`) since it now also
  covers `amount` and `odometerReading`.
- Replace the `/repairs` placeholder with three screens: a paginated
  repairs list with a running sum of the loaded rows (`SCR-16`), a
  create-repair form with a car picker and station autocomplete (`SCR-17`),
  and an edit-repair form with the two-step-confirm delete button carried
  over from cars-management (`SCR-18`).
- Fully localize the new screens (de/en), including the four repair-type
  labels.

## Capabilities

### New Capabilities

- `frontend/repairs`: The repairs list, create, and edit screens.

### Modified Capabilities

- `api-contract/expenses`: Documents the repairs collection and station
  operations' response bodies (previously undocumented), tightens
  `RepairInput`/`RepairUpdate` to reject unknown members, and generalizes
  the `negative` reason's description. The refuel and ticket requirements
  in this capability are unchanged.

## Impact

- **API contract**: `openapi/openapi.yaml` adds `RepairPage`, tightens
  `RepairInput`/`RepairUpdate`, replaces `/repairs`'s and
  `/repairs/stations`'s shared-pathItem references with inline operations,
  and edits the `negative` reason's description. `backend/openapi.yaml` and
  `frontend/src/api/schema.gen.ts` are regenerated.
- **Backend**: a new `internal/repairs` package (handler + pgx store);
  `main.go` wires the five routes behind `authService.RequireSession`. No
  new `apierror` reason constants — repairs reuses `required`, `empty`,
  `invalid_enum`, `invalid_type`, `invalid_decimal`, and `negative` as-is.
- **Frontend**: three new routes under `_authenticated.repairs.*`, new API
  client functions, a shared `RepairForm` component, reuse of
  `TwoStepDeleteButton` from cars-management, de/en messages, and tests.
  The other deferred routes (dashboard, refuels, tickets) are untouched.
- **Database**: no migration. The `repairs` table and its
  `(car_id, date, id)` index already exist.
- **Parity**: covers `SCR-16`, `SCR-17`, `SCR-18`; `EP-15`, `EP-23`,
  `EP-24`, `EP-25` (as `PATCH`), `EP-26`, `EP-27` (now correctly
  caller-scoped, matching the contract's existing "distinct caller-owned
  station names" requirement rather than legacy's unscoped `NG-03` bug).
- **Deferred, not a non-goal**: `GET /cars/{carId}/repairs` (`EP-14`) has
  no consumer yet — `SCR-11`'s Expenses tab needs refuels and tickets too
  and is out of scope here, same as cars-management deferred it. The
  dashboard's expense chart (`SCR-02`, `EP-28`) is also untouched. A
  client-side car filter on `/repairs` is intentionally not built: unlike
  `/refuels` (`SCR-13`), the legacy `/repairs` list (`old/pages/repairs/index.tsx`)
  has no car-filter control, so the parity-checklist's flagged question #2
  ("client-side car filter... affects SCR-13, SCR-16, SCR-19") appears to
  overstate repairs' and tickets' actual legacy behavior; this proposal
  follows the more specific `SCR-16` checklist entry, which does not
  mention a filter.
