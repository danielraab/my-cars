# Tasks

## 1. Database

- [x] 1.1 Add `backend/internal/db/migrations/000005_nullable_car_registration.{up,down}.sql`
  per design: drop `NOT NULL` on `first_registration` and `license_plate`,
  and replace `cars_license_plate_check` with a named
  `license_plate IS NULL OR btrim(license_plate) <> ''` check. The down
  migration restores the original constraints. Verify that the db migration
  tests in `go test ./internal/db/...` pass up and down on an empty database.
- [x] 1.2 Add a persistence test: a car with both columns `NULL` is stored,
  and a whitespace-only plate is rejected.

## 2. API contract

- [x] 2.1 In `openapi/openapi.yaml`, make `firstRegistration` (`format: date`)
  and `licensePlate` `[string, 'null']` in `CarInput`, `CarUpdate` and `Car`.
  Remove both from `CarInput.required`, and extend the `Car` description's
  list of nullable members. Verify that `pnpm lint:openapi` passes.
- [x] 2.2 Copy to `backend/openapi.yaml` and run `pnpm generate:api`. Verify
  that `openapi_sync_test.go` and `pnpm check:api` pass.

## 3. Backend

- [x] 3.1 In `internal/cars`, make `Car.FirstRegistration`/`LicensePlate`,
  `Input` and `carBody` use `*string`. Decode both members with
  `nullableString` (date validator; trimmed non-empty validator with `empty`),
  and remove them from the create required-member loop.
- [x] 3.2 Switch both columns in `Store.Update` from `COALESCE` to the
  `CASE WHEN $set` form, and renumber the parameters.
- [x] 3.3 Extend the handler/store tests: create without both fields → `201`
  with `null`s; PATCH each to `null` → cleared; PATCH omitting them → kept;
  blank plate → `400 empty`; invalid date → `400 invalid_date`. Fix
  `seed`/`stats` tests and any other code that inserts cars if the types
  changed. Verify that `go test ./...` and `go vet ./...` pass.

## 4. Frontend

- [x] 4.1 `api/client.ts`: move `firstRegistration` and `licensePlate` into
  `isCar`'s nullable-string group. Update `client.test.ts`.
- [x] 4.2 `cars/car-form.tsx`: mark both fields `optional: true`, initialise
  them from `null` as `''`, and send blanks as `null` via `optional()`.
- [x] 4.3 `cars/index.tsx` list and `cars/$carId/index.tsx` Details tab:
  show `cars.notRecorded` for `null` values. Render the header's
  `· licensePlate` only when it is present.
- [x] 4.4 Grep `frontend/src` for remaining `licensePlate`/`firstRegistration`
  uses and fix any that assume a string. Update the fixtures in the route
  tests as needed.
- [x] 4.5 Add tests: the list and detail show the placeholder for a car with
  both `null`; the create form submits `null` for both when blank; the edit
  form clears an existing plate. Verify that `pnpm typecheck`, `pnpm lint`
  and `pnpm test` pass, and check the screens in en and de.

## 5. Docs

- [x] 5.1 `docs/parity-checklist.md`: note at `SCR-10`/`SCR-12` (and
  `EP-08`/`EP-10` if they list required fields) that first registration and
  license plate are optional, as in the legacy model.
