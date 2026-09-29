# Proposal

## Why

Tickets is the last of the three expense verticals. Cars, repairs and
refuels are working slices, but `/tickets` still renders the deferred
placeholder and the backend has no `internal/tickets` package. Both
remaining parity slices (the car-detail Expenses tab, `SCR-11`, and the
dashboard expense chart, `SCR-02`/`EP-28`) show ticket data, so tickets has
to land before either of them. The database table already exists and the
contract is mostly documented, but it still has the same gaps repairs and
refuels had to close before they could be implemented:

- `GET /tickets` has no response body schema, because it goes through the
  shared `ExpenseCollection` pathItem.
- `TicketInput`/`TicketUpdate` do not reject undocumented members.
- `Ticket` is `allOf: [ExpenseBase, TicketInput]`, which stops validating
  once `TicketInput` is strict.

## What Changes

- Implement `GET/POST /api/v1/tickets`, `GET/PATCH/DELETE
  /api/v1/tickets/{ticketId}`, and `GET /api/v1/tickets/locations` behind
  the existing cookie session. Every query is scoped to the caller's cars
  through a join. A ticket whose car the caller does not own is treated the
  same as a missing one: `404`.
- **BREAKING (contract only; nothing implements these operations yet):**
  `TicketInput` and `TicketUpdate` gain `additionalProperties: false`. An
  unknown member is rejected with `400` and a field-level `unknown` reason.
- Make `Ticket` a standalone schema in which every member is always present
  (`description` is empty when not recorded). Add a `TicketPage` schema and
  document `GET /tickets`'s `200` with it inline. Write
  `/tickets/locations` inline with its own `operationId`
  (`listTicketLocations`).
- Remove the shared contract components that are left without a user:
  `ExpenseBase`, the `ExpenseCollection`, `StationSuggestions`, and
  `LocationSuggestions` pathItems. `CarExpenseCollection` stays for the
  car-detail slice.
- Replace the `/tickets` placeholder with three screens:
  - a paginated tickets list with a running sum of the loaded rows
    (`SCR-19`);
  - a create-ticket form with a car picker, location autocomplete and an
    optional `?carId=` preselect (`SCR-20`);
  - an edit-ticket form with the two-step-confirm delete (`SCR-21`).
- Fully localize the new screens in German and English, including the three
  ticket-type labels.

## Capabilities

### New Capabilities

- `frontend/tickets`: the tickets list, create, and edit screens.

### Modified Capabilities

- `api-contract/expenses`: adds `TicketInput`/`TicketUpdate` to the strict
  request schemas. Requires the ticket collection to return an explicit
  cursor page, and the location-suggestion operation to have its own
  operation identifier and a string-array response.

## Impact

- **API contract:** `openapi/openapi.yaml` gains `TicketPage`, tightens
  `TicketInput`/`TicketUpdate`, makes `Ticket` standalone, writes
  `/tickets` `get` and `/tickets/locations` inline, and drops the unused
  shared components. `backend/openapi.yaml` and
  `frontend/src/api/schema.gen.ts` are regenerated.
- **Backend:** a new `internal/tickets` package (handler + pgx store),
  registered in `main.go` behind `authService.RequireSession`. No new
  `apierror` reasons are needed.
- **Frontend:**
  - new routes under `_authenticated/tickets/`, replacing the
    `_authenticated/tickets.tsx` placeholder;
  - API client functions and a shared `TicketForm`;
  - reuse of `TwoStepDeleteButton`;
  - de/en messages and tests.
- **Database:** no migration. The `tickets` table and its
  `(car_id, date, id)` index already exist.
- **Ordering:** the `api-contract/expenses` delta builds on the requirement
  text from `refuels-management`. Archive that change first.
- **Parity:** covers `SCR-19`, `SCR-20`, `SCR-21`; `EP-17`, `EP-29`,
  `EP-30`, `EP-31` (as `PATCH`), `EP-32`, and `EP-33`. `EP-33` is now scoped
  to the caller, so legacy's cross-account leak (`NG-03`) is not carried
  over.
- **Deferred, not non-goals:**
  - `GET /cars/{carId}/tickets` (`EP-16`), together with `EP-12`/`EP-14`,
    belongs to the car-detail Expenses tab slice.
  - The dashboard chart (`SCR-02`, `EP-28`) is a separate slice.
- **No car filter on `/tickets`:** as with `/repairs`, the legacy
  `/tickets` page (`old/pages/tickets/index.tsx`) has no car-filter
  control, so none is built. The server still supports the `carId` query
  parameter.
