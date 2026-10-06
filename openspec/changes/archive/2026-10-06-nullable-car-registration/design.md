## Context

`cars.first_registration` is `DATE NOT NULL`, and `cars.license_plate` is
`TEXT NOT NULL CHECK (btrim(license_plate) <> '')`
(`backend/internal/db/migrations/000002_domain_schema.up.sql`). The contract,
the Go handler and the frontend form all mirror that. The legacy schema
(`old/db/migrations/20221204230207-create-car.js`, `old/db/models/car.ts`)
allows `NULL` for both, and the legacy dump contains a car with both missing.
`legacy-data-import` needs that car to be representable.

The car module already has a pattern for nullable, clearable members: `fin`,
`purchaseDate` and `purchasePrice` use a `nullableString` decoder that yields a
`{Set, Value}` pair, and `Store.Update` applies them with
`CASE WHEN $set THEN $value ELSE column END`. Non-nullable members use
`COALESCE`, which cannot clear a value.

## Goals / Non-Goals

**Goals:**
- Both fields are optional on create and clearable on update, end to end.
- Reuse the existing nullable-member pattern; no new mechanism.

**Non-Goals:**
- Making any other car member optional (type, make, name, fuel stay required).
- Changing how cars are ordered (`created_at, id`, unaffected).
- Any import logic; that belongs to `legacy-data-import`.

## Decisions

### Migration `000005_nullable_car_registration`
Up: `ALTER COLUMN first_registration DROP NOT NULL`, `ALTER COLUMN
license_plate DROP NOT NULL`, and replace the plate check with
`license_plate IS NULL OR btrim(license_plate) <> ''` (the `fin` form). The
existing check constraint is unnamed in `000002`, so the migration drops it by
its Postgres-generated name, `cars_license_plate_check`, and adds a named one.

Down: restore `NOT NULL` and the original check. The down migration fails
while rows with `NULL` exist. That is intended: a silent backfill would
invent data. This is noted rather than worked around.

*Alternative considered:* empty-string sentinels instead of `NULL`. Rejected,
because it contradicts the contract rule that unrecorded optionals are
`null`, and the blank-plate check would have to go.

### Contract shape
`firstRegistration` becomes `type: [string, 'null'], format: date`, and
`licensePlate` becomes `type: [string, 'null']`, in `CarInput`, `CarUpdate`
and `Car`. Both are removed from `CarInput.required` and stay in
`Car.required` (always present, possibly `null`). The `Car` description lists
the two members alongside the existing nullable ones. Both copies of the
spec (`openapi/openapi.yaml`, `backend/openapi.yaml`) stay identical, which
`openapi_sync_test.go` enforces, and `schema.gen.ts` is regenerated.

Omitting a member on create and sending `null` are equivalent, as for `fin`.

### Backend
`Car.FirstRegistration`/`LicensePlate` and `Input` become `*string`. The
handler decodes both via `nullableString`: the date validator for
`firstRegistration`, and the trimmed non-empty validator (`empty` reason) for
`licensePlate`, exactly as `fin` does. They drop out of the create
required-member loop. `Store.Update` moves both from `COALESCE` to the
`CASE WHEN $set` form. The `to_char(first_registration, ...)` select already
yields `NULL` for a `NULL` date, so scanning into `*string` is enough.

### Frontend
`car-form.tsx` marks both fields `optional: true` and maps blanks through the
existing `optional()` helper. Display sites use the existing
`cars.notRecorded` string, so no new i18n keys are needed:
- list cells (`cars/index.tsx`): `formatDate` only for non-null values;
- Details tab rows (`cars/$carId/index.tsx`): same as `fin`;
- header `{make} · {licensePlate}`: render `· plate` only when present.

`isCar` in `api/client.ts` moves both members to the nullable-string group.

## Risks / Trade-offs

- [Other screens assume a non-null plate, for example car pickers that label a
  car by plate] → implementation greps every `licensePlate` and
  `firstRegistration` use in `frontend/src` and in tests, and treats it as
  nullable. Today the only display uses are in the cars list and detail
  routes.
- [Contract break for existing clients] → the frontend in this repo is the
  only client, and it ships in the same change.
- [Down migration is not always reversible] → accepted, see above.
