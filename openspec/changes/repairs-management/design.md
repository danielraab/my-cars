# Design

## Context

- The `repairs` table and its `repairs_car_date_id_idx (car_id, date, id)`
  index already exist (`000002_domain_schema.up.sql`). `repairs.car_id` is
  `ON DELETE CASCADE` from `cars`. Unlike `cars`, `repairs` has no
  `account_id` column — ownership is always one join away, through
  `cars.account_id`.
- `openapi/openapi.yaml` already documents `POST /repairs` and
  `GET/PATCH/DELETE /repairs/{repairId}` in full via the shared
  `RepairCreate`/`RepairDetail` pathItems, including `RepairInput`,
  `RepairUpdate`, and `Repair`. `GET /repairs` and `GET /repairs/stations`
  are also documented, but through the `ExpenseCollection` and
  `StationSuggestions` pathItems shared with refuels and tickets — neither
  the `200` response of `ExpenseCollection` nor `CarExpenseCollection` has
  ever had a response body schema, and `StationSuggestions`'s single
  `operationId` (`listRefuelStations`) is inherited unchanged by
  `/repairs/stations`.
- `internal/cars` (from `cars-management`) is the pattern to mirror:
  `Handler` + `Repository` interface + pgx `Store`, cursor pagination via
  an opaque `base64url("<key>|<id>")` cursor, tri-state `(value, isSet)`
  patch fields for nullable columns via `CASE WHEN`, and
  `apierror.NotFound` for both "missing" and "not owned."
  `auth.Service.RequireSession` and `auth.AccountFromContext` are used the
  same way.
- `apierror` already has every reason code repairs needs: `required`,
  `empty`, `invalid_enum`, `invalid_type`, `invalid_decimal`, `negative`.
  Nothing new to add here, unlike cars-management (which added five).
- The frontend already has `TwoStepDeleteButton` (built standalone by
  cars-management for exactly this reuse) and the `getCars` client
  function repairs' car picker can call.

## Goals / Non-Goals

**Goals:**

- Extend cars-management's cursor-pagination and tri-state-patch patterns
  to a resource scoped through a join rather than a direct `account_id`
  column, and to a collection that isn't nested under a single car (the
  account-wide `/repairs` list, filterable by an optional `carId`).
- Fix the two pre-existing contract gaps that block documenting `GET
  /repairs` and `GET /repairs/stations` correctly: the missing response
  schema and the wrong inherited `operationId`.

**Non-Goals:**

- `GET /cars/{carId}/repairs` (`EP-14`). No screen in this change consumes
  it — `SCR-11`'s Expenses tab needs refuels and tickets too and stays
  deferred, exactly as cars-management left it.
- Fixing `ExpenseCollection`/`CarExpenseCollection`'s missing response
  schema for refuels or tickets, or `StationSuggestions` for
  `/refuels/stations`. Only the repairs-facing paths are touched; the
  other two verticals fix their own copies of this gap when their slices
  land.
- A car-filter control on `/repairs`. The legacy `/repairs` page
  (`old/pages/repairs/index.tsx`) has no `ButtonSelect`/car-filter
  component — only `/refuels` does. The `carId` query parameter is still
  implemented server-side (it's already required generically by
  `api-contract/common`), just not surfaced in this screen's UI.
- Any database change. The schema is already correct.
- The dashboard's expense chart (`SCR-02`, `EP-28`).

## Decisions

### D1. New `internal/repairs` package, mirroring `internal/cars`

Same shape: `repairs.Handler` holds a `Repository` interface implemented
by a pgx-backed `Store`. `main.go` registers all five routes wrapped in
`authService.RequireSession`.

### D2. Ownership and listing via a join to `cars`, not a stored `account_id`

Every query joins `repairs r ON cars c` and filters `c.account_id = $1`.
For the single-resource operations (`GET`/`PATCH`/`DELETE
/repairs/{repairId}`), zero rows from `WHERE r.id = $1 AND c.account_id =
$2` means missing or not-owned — both `apierror.NotFound`, per the same
D5 rationale cars-management used.

For the collection (`GET /repairs`), the optional `carId` filter is just
another `AND r.car_id = $n` alongside the join — no separate ownership
check is needed before applying it, because a `carId` the caller doesn't
own can never match a row that also satisfies `c.account_id = $1`. Filtering
by another account's car (or a nonexistent one) therefore returns an empty
page, not `404` or `400`: this endpoint's contract obligation is "show me
my data," and an empty result set for a filter that matches none of it
satisfies that without inventing new response semantics for a list filter.

The cursor is the same `base64url("<date RFC3339Nano>|<id>")` shape as
cars' `(created_at, id)` cursor, keyed on `(date, id)` to match the
collection's documented "ordered by date then ID." An optional `from`/`to`
date-time range (already documented on `ExpenseCollection`) adds `AND
r.date >= $n AND r.date < $n` conditions before the keyset predicate;
malformed cursor, `carId`, `from`, or `to` values all reuse `invalid_type`,
following cursor's own precedent in cars-management (D2: "the
client-visible fact is the same") rather than inventing per-parameter
reasons.

*Alternative considered*: a materialized/denormalized `account_id` column
on `repairs`, refreshed via trigger or duplicated on write, to avoid the
join. Rejected — the table is small, the join is a single indexed lookup
on `cars.id`/`cars.account_id`, and it would be schema churn purely for a
query-planning concern with no evidence it's needed yet (see Risks).

### D3. Partial update: only `odometerReading` needs tri-state

`odometer_reading` is nullable and the contract types it `integer | null`,
so it is a `(value, isSet)` pair combined with `CASE WHEN`, as in cars'
`Patch`. `description` is nullable in the table but the contract types it
as a plain `string`, and `api-contract/expenses` already says updates
apply "empty optional text" — so an empty string is how a description is
cleared, and it is a plain pointer with `COALESCE` like `date`, `station`,
`type`, and `amount`. The store writes `''` rather than `NULL` for an
absent description and reads `COALESCE(description, '')`, so the API never
has to distinguish the two.

*Alternative considered*: making `description` `string | null` in the
contract to mirror the column. Rejected — it adds a third state for a
free-text field whose only meaningful "unset" value is empty, and the
existing requirement already names empty text as the clearing value.

### D4. Validation reuses cars-management's reasons without adding any

| Field | Constraint | Reason reused |
|---|---|---|
| `carId` | must reference an owned car | `apierror.NotFound` (404, not a field reason) |
| `date` | required, RFC 3339 date-time | `invalid_type` (malformed string — see D2's precedent) |
| `station` | required, non-blank after trim | `empty` |
| `odometerReading` | optional int ≥ 0 | `negative` |
| `type` | one of the four documented codes | `invalid_enum` |
| `amount` | required decimal ≥ 0 | `invalid_decimal`, `negative` |
| `description` | optional, unconstrained text | — |
| unknown member | rejected once `additionalProperties: false` lands | `unknown` |

`amount` is the first *required, non-nullable* `Decimal` field in the app
(cars' `purchasePrice` was optional). It follows the same two-step check
cars used for `purchasePrice` (pattern match, then sign), just without the
nullable wrapper — decode as a required string via the existing
`requiredString`-style helper, then apply the same `decimalPattern`
match and negative-sign check inline.

The `negative` reason's description in `Error.fields` (currently "`purchasePrice`
parses but is below zero") is generalized to a field-agnostic wording as
part of this change's contract edits, since it now also covers `amount`
and `odometerReading`.

### D5. Contract edits

- `RepairInput`/`RepairUpdate` gain `additionalProperties: false`, same
  rationale as `CarInput`/`CarUpdate`: an unexpected member should be a
  localizable `400`, not a silent no-op.
- `Repair` becomes a standalone schema instead of `allOf: [ExpenseBase,
  RepairInput]`, for the same reason cars-management made `Car` standalone:
  with `additionalProperties: false` on `RepairInput`, the `allOf` would
  make every `Repair` carrying `id` schema-invalid. The standalone `Repair`
  requires every member (`odometerReading` may be `null`, `description`
  may be empty), so the frontend never has to tell "absent" from "null".
  `ExpenseBase` stays for `Refuel`/`Ticket`.
- New `RepairPage` schema (`{ items: Repair[], nextCursor }`), mirroring
  `CarPage`. `/repairs`'s `get` stops `$ref`-ing
  `#/components/pathItems/ExpenseCollection/get` and is written inline
  instead (same style as `/cars`), so its `200` response can point at
  `RepairPage`. The shared parameters (`Cursor`, `Limit`, `CarFilter`,
  `From`, `To`) are still referenced by `$ref`, only the operation
  wrapper and response body are no longer shared.
- `/repairs/stations`'s `get` similarly stops `$ref`-ing
  `#/components/pathItems/StationSuggestions/get` and is written inline
  with its own `operationId: listRepairStations`, keeping the same `string[]`
  response shape.
- `/refuels`, `/refuels/stations`, `/tickets`, and `/cars/{carId}/repairs`
  keep using the shared pathItems as-is — their response-schema gap is
  unrelated to what this change implements and is left for their own
  slices, per the Non-Goals above.

### D6. Frontend: car picker, station autocomplete, running total

- `RepairForm`'s car field is a `<select>` populated from `getCars({
  limit: 100 })` (the contract's maximum page size), fetched once and not
  paginated further — a personal car-tracking account exceeding 100 cars
  is out of scope, matching the project's own "no speculative
  abstraction" guidance.
- Station autocomplete reuses the legacy pattern: a native `<datalist>`
  populated from a new `getRepairStations()` client call, following the
  existing `isCar`/`isCarPage`-style response guard.
- The repairs list keeps a running sum of every row loaded via
  `fetchNextPage` so far (`SCR-16`'s "`AmountSum` of the currently-shown
  rows"), computed client-side with a plain reduce over
  `useInfiniteQuery`'s accumulated pages — no new aggregation endpoint,
  since the checklist's own parity target is "shown," not "all."
- `TwoStepDeleteButton` is reused unchanged from cars-management.

### D7. Route shape

`_authenticated.repairs.index.tsx` (list, replacing the placeholder
`_authenticated.repairs.tsx`), `_authenticated.repairs.create.tsx`, and
`_authenticated.repairs.$repairId.edit.tsx` — no detail/view route, since
neither the legacy app nor the parity checklist has one for repairs (rows
link straight to edit, per `SCR-16`). The list is an `index` route for the
same reason cars-management's was: a flat `repairs.tsx` would become the
layout parent of its sibling route files and need an `<Outlet />`.

## Risks / Trade-offs

- **The account-wide `/repairs` list has no index covering `(account_id,
  date, id)` — only the per-car `repairs_car_date_id_idx`.** → Accepted at
  this table's expected size; the query plans as an index scan on
  `cars(account_id)` (a handful of rows per account) joined to
  `repairs(car_id, date, id)` per car, not a sequential scan of the whole
  table. Revisit with a dedicated covering index only if this measurably
  matters.
- **`additionalProperties: false` on `RepairInput`/`RepairUpdate` is a
  breaking contract change.** → Accepted, same as cars-management: neither
  operation has a real client yet.
- **The parity-checklist's flagged question #2 says a car filter affects
  `SCR-16`, but the legacy code doesn't have one there.** → Documented in
  the proposal; this change follows the more specific, code-grounded
  `SCR-16` entry rather than the flagged question's broader claim. Not a
  spec change — just a note for whoever revisits that flagged question
  when tickets (`SCR-19`) is proposed.

## Migration Plan

No data migration. `repairs` already exists from `db-schema-v1`. Rollback
is reverting the commit.
