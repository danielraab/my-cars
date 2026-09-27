# Design

## Context

- The `cars` table, its enum types, and the
  `cars_account_created_at_id_idx` index already exist
  (`000002_domain_schema.up.sql`). `account_id` is `ON DELETE RESTRICT`
  (an account with cars can't be deleted); each expense table's `car_id` is
  `ON DELETE CASCADE`, so deleting a car already cascades to its refuels,
  repairs, and tickets without any explicit code.
- `openapi/openapi.yaml` already documents `GET/POST /cars` and
  `GET/PATCH/DELETE /cars/{carId}` in full, including `CarInput`, `CarUpdate`,
  `Car`, and `CarPage` (from `api-contract-v1`). This change tightens
  validation strictness; it does not change the operations' shapes.
- `auth.Service.RequireSession` and `auth.AccountFromContext` are already
  used exactly this way by `internal/profile`.
- `internal/apierror` has `Write`, `Validation`, `Internal`, and five reason
  constants (`read_only`, `unknown`, `invalid_type`, `too_long`,
  `required`), but no `NotFound` helper and no code for the constraint
  kinds cars introduces (enum, date, decimal, sign, blank string).
- Nothing paginated exists yet — cars is the first collection endpoint
  implemented, and the first frontend route with a dynamic path segment.

## Goals / Non-Goals

**Goals:**

- A cursor-pagination pattern (backend keyset query + frontend infinite
  query) that refuels, repairs, and tickets can copy.
- A partial-update pattern that extends profile's absent/value decoding to
  resources with *nullable* columns (`fin`, `purchase_date`,
  `purchase_price`), where absent, explicit `null`, and a value are three
  distinct instructions.
- A standalone two-step-confirm delete component, since three more edit
  screens (`SCR-15`, `SCR-18`, `SCR-21`) need the identical pattern.

**Non-Goals:**

- `SCR-11`'s Expenses and Consumption tabs. They need `EP-12`/`EP-14`/`EP-16`
  and `DRV-01`–`DRV-03`, which don't exist yet, and their pagination
  questions are flagged and unresolved in `docs/parity-checklist.md`.
- Any database change. The schema is already correct.
- The station/location suggestion endpoints (`EP-22`/`EP-27`/`EP-33`
  analogues) — unrelated to cars.
- `isActive` in the UI. The column exists and defaults to `true`, but
  neither `SCR-10` nor `SCR-12`'s field list in the parity checklist
  includes it; the create/edit forms never show or send it.

## Decisions

### D1. New `internal/cars` package, mirroring `internal/profile`'s shape

`cars.Handler` holds a `Repository` interface implemented by a pgx-backed
`Store`. `main.go` registers all five routes wrapped in
`authService.RequireSession`, the same wiring as the profile handler.

### D2. Cursor: opaque keyset over `(created_at, id)`

Ordering matches the existing index and the contract's "ordered by creation
time then ID". The cursor is `base64url("<createdAt RFC3339Nano>|<id>")`.
The query is:

```sql
SELECT ... FROM cars
WHERE account_id = $1 AND (created_at, id) > ($2, $3)
ORDER BY created_at, id
LIMIT $4 + 1
```

Fetching `limit + 1` rows lets the store detect a next page without a
second query; the extra row is dropped and the `(created_at, id)` of the
last *returned* row becomes `nextCursor` (using the dropped row's key would
skip it, because the keyset condition is a strict `>`). `limit` absent → `25`; unparsable or outside `[1, 100]` → `400
validation_failed` on field `limit`. A cursor that fails to decode (bad
base64, wrong shape, unparsable timestamp) → `400 validation_failed` on
field `cursor`. Both reuse the existing `invalid_type` reason rather than
inventing a pagination-specific one — the client-visible fact is the same
("this value doesn't look like what I sent you").

### D3. Partial update via per-field `(value, isSet)` pairs and `CASE WHEN`

Profile's update used `COALESCE($n, column)`, which works because none of
its columns are nullable — a `nil` pointer unambiguously means "don't
touch". Cars has three nullable columns (`fin`, `purchase_date`,
`purchase_price`) where the request needs a third state: explicit `null`
("clear it"). The store method takes a `CarPatch` where each nullable field
is represented as a value pointer plus a `Set bool`, and the single `UPDATE`
uses:

```sql
UPDATE cars SET
  type = COALESCE($2, type),
  ...,
  fin = CASE WHEN $8 THEN $9 ELSE fin END,
  purchase_date = CASE WHEN $10 THEN $11 ELSE purchase_date END,
  purchase_price = CASE WHEN $12 THEN $13 ELSE purchase_price END,
  updated_at = now()
WHERE account_id = $1 AND id = $14
RETURNING ...
```

The non-nullable fields keep the `COALESCE` shape from profile; the
nullable ones add a `Set` boolean so the request can pass `NULL` through
deliberately. Zero rows returned means "not found or not owned" (see D5).

*Alternative considered*: building the `SET` clause dynamically per
supplied field. Rejected — string-built SQL is harder to review for
injection safety, and a single fixed statement is easy to test
exhaustively; the handful of no-op `COALESCE`s on an unset field cost
nothing measurable at this scale.

### D4. New `apierror` reasons and a `NotFound` helper

| Reason | Meaning |
|---|---|
| `empty` | A required string is blank after trimming (`type`, `make`, `name`, `licensePlate`, or a non-null `fin`) |
| `invalid_enum` | `fuel` is outside `other`/`diesel`/`gasoline`/`electric` |
| `invalid_date` | `firstRegistration` or `purchaseDate` isn't a valid RFC 3339 full-date |
| `invalid_decimal` | `purchasePrice` doesn't match the documented decimal pattern |
| `negative` | `purchasePrice` parses but is below zero |

`unknown` (extra member) and `required` (missing member on create) are
reused as-is from profile. `apierror.NotFound(w)` writes `404 not_found`
with no fields, for `GET`/`PATCH`/`DELETE` on a car that doesn't exist or
isn't the caller's.

### D5. Ownership scoping via `WHERE`, not lookup-then-403

`GET`/`PATCH`/`DELETE` all filter `WHERE account_id = $accountID AND id =
$carID` in one query. Zero rows affected or returned means either wrong
owner or missing car — both produce the same `404`, per
`api-contract/common`'s "a resource owned by another account SHALL not be
disclosed and SHALL produce 404".

### D6. Contract edits

- `additionalProperties: false` on `CarInput` and `CarUpdate`. Same
  rationale as `ProfileUpdate` in `profile-management`: an unexpected member
  should be a localizable `400`, not a silent no-op or a `500`.
  `Error.fields`' description gains the five reasons from D4.
- `Car` becomes a standalone schema instead of `allOf: [CarInput, …]`.
  With `additionalProperties: false` on `CarInput`, the `allOf` would make
  every `Car` carrying `id`/`createdAt`/`updatedAt` schema-invalid. The
  standalone `Car` requires every member, so the frontend never has to
  tell "absent" from "null".
- `fin` and `purchasePrice` become nullable in `CarInput`, `CarUpdate`, and
  `Car` (a new `NullableDecimal` schema). The columns are nullable and `fin`
  cannot be `''`, so without this a user could never clear either value
  and D3's tri-state update would have nothing to express.
- The `Decimal` pattern (and the refuel `consumption` pattern) was written
  as `\\.` in a plain YAML scalar, which is a literal backslash, so
  `"12.50"` did not match. Corrected to `\.`.

### D7. Frontend: `useInfiniteQuery` list, shared `CarForm`, shared delete button

- `getCars({ cursor })` → `CarPage`; the list route uses
  `useInfiniteQuery` keyed `['cars']`, `getNextPageParam` reading
  `nextCursor`. A "Load more" button calls `fetchNextPage` — not infinite
  scroll, so the interaction stays keyboard- and screen-reader-friendly.
- List columns, per `SCR-09`: type, make, name, fuel (localized label),
  first registration, license plate, purchase price. `isActive`, `fin`, and
  `purchaseDate` are omitted, matching the checklist.
- A shared `CarForm` (type, make, name, fuel select, first-registration
  date, license plate, optional FIN, optional purchase date, optional
  purchase price) backs both the create and edit routes — the same 8
  fields for both, per `SCR-10`/`SCR-12`.
- The detail screen (`SCR-11`, Details tab only) renders those fields
  read-only in a description list, with an "Edit Car" button to the edit
  route. No Expenses/Consumption tabs (see Non-Goals).
- `TwoStepDeleteButton`: first click arms it (shows confirm/cancel), the
  confirm click calls `deleteCar` and navigates to the list. Built
  standalone so `SCR-15`/`SCR-18`/`SCR-21` reuse it verbatim.

### D8. Route shape

`_authenticated.cars.index.tsx` (list, replaces the
`_authenticated.cars.tsx` placeholder), `_authenticated.cars.create.tsx`,
`_authenticated.cars.$carId.index.tsx` (detail), and
`_authenticated.cars.$carId.edit.tsx` — the app's first dynamic-segment
routes. The list and detail are `index` routes because a flat
`cars.tsx`/`cars.$carId.tsx` would become the layout parent of its sibling
files and have to render an `<Outlet />`.

## Risks / Trade-offs

- **The fixed `UPDATE` sends every column parameter on every `PATCH`,
  mostly as no-ops.** → Negligible at this table's size; keeps the
  statement singular and fully testable instead of dynamically built.
- **A forged or stale cursor.** → It can only ever page through the
  caller's own rows, because `account_id` is always in the `WHERE`
  alongside the keyset condition; a bad cursor produces `400`, never
  another account's data.
- **`additionalProperties: false` is a breaking contract change.** →
  Accepted: neither operation has ever been implemented or called by a
  real client, so nothing regresses.

## Migration Plan

No data migration. `cars` (and the expense tables) already exist from
`db-schema-v1`. Rollback is reverting the commit.
