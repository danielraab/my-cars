# Tasks

## 1. API contract

- [x] 1.1 In `openapi/openapi.yaml`, add `additionalProperties: false` to
  `CarInput` and `CarUpdate`, make `Car` standalone with every member
  required, make `fin`/`purchasePrice` nullable, fix the `Decimal` pattern
  escaping (design D6), and document the new `empty`, `invalid_enum`,
  `invalid_date`, `invalid_decimal`, and `negative` reasons (alongside the
  existing ones) in `Error.fields`'s description; verify with
  `pnpm lint:openapi` in `frontend/`
- [x] 1.2 Copy the source to `backend/openapi.yaml` and regenerate
  `frontend/src/api/schema.gen.ts` (`pnpm generate:api`); verify `go test
  ./...` (`openapi_sync_test.go`) and `pnpm check:api` pass

## 2. Backend error writer

- [x] 2.1 In `backend/internal/apierror`, add `CodeNotFound` +
  `NotFound(w)` (404, no fields) and the five new `Reason*` constants from
  design D4; verify with unit tests asserting status, `code`, and empty
  `fields` for `NotFound`

## 3. Backend cars package

- [x] 3.1 Add `backend/internal/cars` with a `Repository` interface
  (`List`, `Create`, `Get`, `Update`, `Delete`, all scoped by `accountID`)
  and a pgx `Store`; the `List` query implements the `(created_at, id)`
  keyset from design D2 (fetch `limit+1`, drop the extra row, encode
  `nextCursor`); verify with a store test against `DATABASE_URL` (skipped
  when unset, as in `db_test.go`) covering: first page, following a cursor,
  the last page (`nextCursor` is `null`), create, get, update, and delete
- [x] 3.2 Implement `Update` per design D3: a `CarPatch` with a `(value,
  isSet)` pair for each nullable column (`fin`, `purchase_date`,
  `purchase_price`) and a plain pointer for the rest, applied in one
  `UPDATE ... CASE WHEN ... COALESCE(...)` statement; verify with a store
  test that clears `fin` to `null`, leaves `purchaseDate` untouched when
  absent, and sets `purchasePrice` to a new value in the same call
- [x] 3.3 Implement the five HTTP handlers (`GET/POST /api/v1/cars`,
  `GET/PATCH/DELETE /api/v1/cars/{carId}`) with the validation from design
  D2/D4: `limit`/`cursor` parsing, required-field checks and per-field
  reason codes on create, unknown-member rejection and the tri-state decode
  on update, and `apierror.NotFound` on a missing or unowned car for
  `GET`/`PATCH`/`DELETE`; verify with table-driven handler tests covering
  every scenario in `specs/api-contract/cars/spec.md`, including that the
  store is never called on a `400`
- [x] 3.4 Register all five routes in `main.go` behind
  `authService.RequireSession`; verify with a mux/integration test that an
  unauthenticated request to each route returns `401` and that
  `/api/v1/cars` no longer falls through to `404`

## 4. Frontend API client

- [x] 4.1 Add `Car`/`CarInput`/`CarUpdate`/`CarPage` types plus `getCars({
  cursor })`, `createCar`, `getCar`, `updateCar`, and `deleteCar` to
  `src/api/client.ts`, with an `isCar`/`isCarPage` response guard following
  the existing `isProfile` pattern; verify with `client.test.ts` cases for
  a paginated success, a `400` with `fields`, a `401` → `UnauthorizedError`,
  a `404`, and an invalid response shape

## 5. Frontend cars screens

- [x] 5.1 Add de and en messages under `cars.*` (list columns, fuel-type
  labels, form field labels/hints, load-more, create/edit/delete actions
  and confirmations, and field/error messages for every reason in design
  D4 plus a generic fallback); verify with the existing i18n completeness
  test (`src/i18n/index.test.ts`) passing for both locales
- [x] 5.2 Add a standalone `TwoStepDeleteButton` component (arm on first
  click, confirm/cancel, calls the provided action on confirm); verify with
  a component test covering arm, confirm, and cancel
- [x] 5.3 Replace `_authenticated.cars.tsx` with the paginated list per
  design D7 (`useInfiniteQuery`, load-more button, the documented columns,
  loading/retryable-error states, link to create); verify with
  `pnpm typecheck` and `pnpm check`
- [x] 5.4 Add `_authenticated.cars.create.tsx` and a shared `CarForm`
  component (used by create and edit) with the 8 fields from design D7,
  field-level errors, and a form-level error that preserves input; verify
  with `pnpm typecheck` and `pnpm check`
- [x] 5.5 Add `_authenticated.cars.$carId.tsx` (Details tab only, per the
  Non-Goals) with a not-found state for a missing or unowned car, and
  `_authenticated.cars.$carId.edit.tsx` reusing `CarForm` pre-filled plus
  `TwoStepDeleteButton`; verify with `pnpm typecheck` and `pnpm check`
- [x] 5.6 Add route tests covering every scenario in
  `specs/frontend/cars/spec.md`: list with load-more, list load failure,
  create success and a `400` field error, detail success and not-found,
  edit success reflected on the detail screen, delete with cancel and with
  confirm, and switching the locale to German on the list; verify with
  `pnpm test`
- [x] 5.7 Confirm the other deferred routes (dashboard, refuels, repairs,
  tickets) still render the placeholder; verify the existing `-app.test.tsx`
  passes

## 6. Integration check

- [x] 6.1 Run `go test ./...` in `backend/` and `pnpm check && pnpm
  typecheck && pnpm test && pnpm build` in `frontend/`, then log in
  locally, create a car, open its detail screen, edit it, load a second
  page after creating enough cars to exceed the default limit, and delete
  one with the two-step confirm; verify all commands pass and the manual
  flow behaves as specified
