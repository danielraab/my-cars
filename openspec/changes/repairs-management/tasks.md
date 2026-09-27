# Tasks

## 1. API contract

- [ ] 1.1 In `openapi/openapi.yaml`, add `additionalProperties: false` to
  `RepairInput` and `RepairUpdate`; add a `RepairPage` schema
  (`{ items: Repair[], nextCursor }`, mirroring `CarPage`); rewrite
  `/repairs`'s `get` inline (dropping the `ExpenseCollection` pathItem
  `$ref`) with `200` responses pointing at `RepairPage`, reusing the
  `Cursor`/`Limit`/`CarFilter`/`From`/`To` parameter `$ref`s; rewrite
  `/repairs/stations`'s `get` inline (dropping the `StationSuggestions`
  pathItem `$ref`) with `operationId: listRepairStations` and the same
  `string[]` response shape; generalize the `negative` reason's
  description in `Error.fields` to be field-agnostic; verify with
  `pnpm lint:openapi` in `frontend/`
- [ ] 1.2 Copy the source to `backend/openapi.yaml` and regenerate
  `frontend/src/api/schema.gen.ts` (`pnpm generate:api`); verify `go test
  ./...` (`openapi_sync_test.go`) and `pnpm check:api` pass

## 2. Backend repairs package

- [ ] 2.1 Add `backend/internal/repairs` with a `Repository` interface
  (`List`, `Create`, `Get`, `Update`, `Delete`, all scoped by `accountID`
  via a join to `cars`) and a pgx `Store`; the `List` query implements the
  `(date, id)` keyset from design D2 (fetch `limit+1`, drop the extra row,
  encode `nextCursor`) with optional `carId`/`from`/`to` filters; verify
  with a store test against `DATABASE_URL` (skipped when unset) covering:
  first page, following a cursor, the last page (`nextCursor` is `null`),
  the `carId` filter, the `from`/`to` filter, create, get, update, and
  delete
- [ ] 2.2 Implement `Update` per design D3: a `RepairPatch` with a
  `(value, isSet)` pair for `odometerReading` and `description`, plain
  pointers for the rest, applied in one `UPDATE ... CASE WHEN ...
  COALESCE(...)` statement; verify with a store test that clears
  `odometerReading` to `null`, leaves `description` untouched when absent,
  and sets `amount` to a new value (including `0`) in the same call
- [ ] 2.3 Implement the five HTTP handlers (`GET/POST /api/v1/repairs`,
  `GET/PATCH/DELETE /api/v1/repairs/{repairId}`, `GET
  /api/v1/repairs/stations`) with the validation from design D4: required-
  field checks and per-field reason codes on create (including the
  required, non-nullable `amount` decimal per D4's note on it being the
  first field of that shape), unknown-member rejection and the tri-state
  decode on update, `apierror.NotFound` on a missing or unowned repair or
  car for `GET`/`PATCH`/`DELETE`/create, and distinct caller-owned
  stations ordered ascending; verify with table-driven handler tests
  covering every scenario in `specs/api-contract/expenses/spec.md`'s
  repair-related requirements, including that the store is never called
  on a `400`
- [ ] 2.4 Register all five routes in `main.go` behind
  `authService.RequireSession`; verify with a mux/integration test that an
  unauthenticated request to each route returns `401` and that
  `/api/v1/repairs` no longer falls through to `404`

## 3. Frontend API client

- [ ] 3.1 Add `Repair`/`RepairInput`/`RepairUpdate`/`RepairPage` types plus
  `getRepairs({ cursor, carId, from, to })`, `createRepair`, `getRepair`,
  `updateRepair`, `deleteRepair`, and `getRepairStations` to
  `src/api/client.ts`, with an `isRepair`/`isRepairPage` response guard
  following the existing `isCar`/`isCarPage` pattern; verify with
  `client.test.ts` cases for a paginated success, a `400` with `fields`, a
  `401` → `UnauthorizedError`, a `404`, and an invalid response shape

## 4. Frontend repairs screens

- [ ] 4.1 Add de and en messages under `repairs.*` (list columns,
  repair-type labels, form field labels/hints, load-more, running-total
  label, create/edit/delete actions and confirmations, and field/error
  messages for every reason repairs can produce plus a generic fallback);
  verify with the existing i18n completeness test
  (`src/i18n/index.test.ts`) passing for both locales
- [ ] 4.2 Replace `_authenticated.repairs.tsx` with
  `_authenticated.repairs.index.tsx`, the paginated list per design D6/D7
  (`useInfiniteQuery`, load-more button, the documented columns, a running
  amount total over loaded rows, loading/retryable-error states, link to
  create); verify with `pnpm typecheck` and `pnpm check`
- [ ] 4.3 Add `_authenticated.repairs.create.tsx` and a shared
  `RepairForm` component (used by create and edit) with the 7 fields from
  design D6 (car select populated from `getCars({ limit: 100 })`, date,
  station with datalist autocomplete from `getRepairStations`, odometer,
  type, amount, description), field-level errors, a form-level error that
  preserves input, and support for an optional `?carId=` preselect; verify
  with `pnpm typecheck` and `pnpm check`
- [ ] 4.4 Add `_authenticated.repairs.$repairId.edit.tsx` reusing
  `RepairForm` pre-filled (car field fixed) plus `TwoStepDeleteButton`;
  verify with `pnpm typecheck` and `pnpm check`
- [ ] 4.5 Add route tests covering every scenario in
  `specs/frontend/repairs/spec.md`: list with load-more and running total,
  list load failure, create success (including the `?carId=` preselect
  case) and a `400` field error, edit success reflected on the list,
  delete with cancel and with confirm, not-found on an unowned/missing
  repair, and switching the locale to German on the list; verify with
  `pnpm test`
- [ ] 4.6 Confirm the other deferred routes (dashboard, refuels, tickets)
  still render the placeholder; verify the existing `-app.test.tsx` passes

## 5. Integration check

- [ ] 5.1 Run `go test ./...` in `backend/` and `pnpm check && pnpm
  typecheck && pnpm test && pnpm build` in `frontend/`, then log in
  locally, create a repair from a car's context (`?carId=`) and from
  scratch, confirm it appears in the list with the running total updated,
  edit it, load a second page after creating enough repairs to exceed the
  default limit, and delete one with the two-step confirm; verify all
  commands pass and the manual flow behaves as specified
