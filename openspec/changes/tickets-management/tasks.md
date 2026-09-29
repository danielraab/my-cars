# Tasks

## 1. API contract

- [ ] 1.1 Edit `openapi/openapi.yaml` per design D5:
  - add `additionalProperties: false` to `TicketInput` and `TicketUpdate`;
  - make `Ticket` a standalone schema with every member required;
  - add `TicketPage`;
  - write `/tickets` `get` inline (`operationId: listTickets`, `200` →
    `TicketPage`, reusing the `Cursor`/`Limit`/`CarFilter`/`From`/`To`
    parameter `$ref`s);
  - write `/tickets/locations` `get` inline
    (`operationId: listTicketLocations`, `string[]`);
  - delete `ExpenseBase` and the `ExpenseCollection`, `StationSuggestions`,
    and `LocationSuggestions` pathItems.

  Verify that `pnpm lint:openapi` in `frontend/` passes and that
  `grep -n "ExpenseBase\|pathItems/ExpenseCollection\|StationSuggestions\|LocationSuggestions" openapi/openapi.yaml`
  prints nothing.
- [ ] 1.2 Copy the source to `backend/openapi.yaml` and regenerate
  `frontend/src/api/schema.gen.ts` (`pnpm generate:api`). Verify that
  `go test ./...` (including `openapi_sync_test.go`), `pnpm check:api`, and
  `pnpm typecheck` pass.

## 2. Backend tickets package

- [ ] 2.1 Add `backend/internal/tickets/store.go`: a `Repository`
  interface (`List`, `Create`, `Get`, `Update`, `Delete`, `Locations`, all
  scoped by `accountID` through a join to `cars`) and a pgx `Store`.
  Follow design D2 (`(date, id)` keyset with `limit+1`, and the optional
  `carId`/`from`/`to` filters) and D3 (a single `COALESCE` update, with
  `description` read as `COALESCE(description, '')`).
  Verify with `store_test.go` against `DATABASE_URL` (skipped when unset),
  covering:
  - the first page, following a cursor, and the last page
    (`nextCursor == nil`);
  - the `carId` filter, including another account's car → empty;
  - the `from`/`to` filter;
  - create, get, update (including `amount` → `0` and `description` →
    `""`), and delete;
  - get/update/delete of another account's ticket → not found;
  - `Locations` returning distinct, sorted values that exclude another
    account's.
- [ ] 2.2 Add `backend/internal/tickets/handler.go` with the six handlers
  and `RegisterRoutes`, using the validation table in design D4.
  Verify with table-driven `handler_test.go` over a fake `Repository`,
  covering every ticket scenario in
  `specs/api-contract/expenses/spec.md`:
  - each field reason, including an unknown member, and `carId` on update
    → `unknown`;
  - an empty patch → `400`;
  - a malformed cursor, `carId`, `from`, or `to` → `400`;
  - store not-found → `404`;
  - the store is never called on a `400`.
- [ ] 2.3 Register the handler in `backend/main.go` next to repairs and
  refuels. Verify with a mux/integration test that an unauthenticated
  request to each of the six routes returns `401`, and that
  `/api/v1/tickets` no longer falls through to `404`.

## 3. Frontend API client

- [ ] 3.1 Add to `src/api/client.ts`:
  - `Ticket`/`TicketInput`/`TicketUpdate`/`TicketPage` types;
  - `getTickets({ cursor, carId, from, to })`, `createTicket`, `getTicket`,
    `updateTicket`, `deleteTicket`, and `getTicketLocations`;
  - `isTicket`/`isTicketPage` guards following the repair guards.

  Verify with `client.test.ts` cases for a paginated success, a `400` with
  `fields`, a `401` → `UnauthorizedError`, a `404`, and an invalid response
  shape.

## 4. Frontend tickets screens

- [ ] 4.1 Add de and en messages under `tickets.*`:
  - list columns;
  - `tickets.types.{parking,velocity,other}`;
  - form labels and hints;
  - load-more and the running-total label;
  - create/edit/delete actions and confirmation;
  - not-found;
  - a field message for every reason in design D4, plus a generic
    fallback.

  Verify with the i18n completeness test (`src/i18n/index.test.ts`) for
  both locales.
- [ ] 4.2 Delete `routes/_authenticated/tickets.tsx` and add
  `routes/_authenticated/tickets/index.tsx`: the paginated list with
  load-more, a running total, loading and retryable-error states, rows
  linking to edit, car cells linking to car detail, and a create link.
  Verify with `pnpm typecheck` and `pnpm check`.
- [ ] 4.3 Add `src/tickets/ticket-form.tsx` and
  `routes/_authenticated/tickets/create.tsx`. The form has car select,
  date/time, type, location with a `<datalist>` from
  `getTicketLocations`, amount, and description. It shows field-level
  errors and a form-level error that keeps the input, and supports an
  optional `?carId=` preselect. Verify with `pnpm typecheck` and
  `pnpm check`.
- [ ] 4.4 Add `routes/_authenticated/tickets/$ticketId/edit.tsx` reusing
  `TicketForm` pre-filled with the car fixed, plus `TwoStepDeleteButton`.
  Invalidate the tickets and locations queries after save or delete.
  Verify with `pnpm typecheck` and `pnpm check`.
- [ ] 4.5 Add `routes/-tickets.test.tsx` covering every scenario in
  `specs/frontend/tickets/spec.md`:
  - list with load-more and running total, and list load failure;
  - create success, the `?carId=` preselect, location suggestions shown,
    and a `400` field error that keeps the input;
  - an edit reflected on the list;
  - delete with cancel and with confirm;
  - not-found;
  - switching to German.

  Update `routes/-app.test.tsx` so `/tickets` is no longer expected to
  render the deferred placeholder, while `/home` still does. Verify with
  `pnpm test`.

## 5. Integration check

- [ ] 5.1 Run `go test ./...` in `backend/`, and
  `pnpm check && pnpm typecheck && pnpm test && pnpm build` in `frontend/`.
  Then seed local data (`seed` command) and log in, and:
  - open `/tickets` and load a second page, checking that the running
    total grows;
  - create a ticket from scratch and one with `?carId=`, checking that a
    new location is suggested next time;
  - edit a ticket and clear its description;
  - delete a ticket with the two-step confirm.

  Verify that all commands pass and the manual flow behaves as specified.
