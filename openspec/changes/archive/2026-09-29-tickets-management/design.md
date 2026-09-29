# Design

## Context

- `tickets` already exists (`000002_domain_schema.up.sql`) with a
  `ticket_type` enum (`parking`, `velocity`, `other`), a non-blank
  `location` check, `amount >= 0`, a nullable `description`, and the
  `tickets_car_date_id_idx (car_id, date, id)` index. `car_id` is `ON
  DELETE CASCADE` from `cars`. Like repairs and refuels, the table has no
  `account_id` column, so ownership is always one join away.
- `internal/repairs` is the closest existing pattern: a `Handler` plus a
  `Repository` interface and a pgx `Store`. Its other conventions:
  - `(date, id)` keyset pagination with an opaque
    `base64url("<date RFC3339Nano>|<id>")` cursor;
  - optional `carId`/`from`/`to` filters;
  - `apierror.NotFound` for both "missing" and "not owned";
  - `description` stored as `''` and read with `COALESCE(description, '')`.
- Tickets are simpler than repairs: there is no odometer reading, so no
  field needs the tri-state `(value, isSet)` patch.
- The contract still routes `GET /tickets` through the shared
  `ExpenseCollection` pathItem, `/tickets/locations` through
  `LocationSuggestions`, and builds `Ticket` from
  `allOf: [ExpenseBase, TicketInput]`. After repairs and refuels moved
  inline, tickets are the last user of those components.
- Frontend building blocks already exist: `TwoStepDeleteButton`, `getCars`,
  the `RepairForm`/`RefuelForm` layout in `src/repairs/` and
  `src/refuels/`, and the route layout under `routes/_authenticated/`.

## Goals / Non-Goals

**Goals:**

- Finish the third expense vertical using exactly the repairs pattern, so
  the three packages stay easy to compare and later slices (car-detail
  tabs, dashboard) can rely on consistent behaviour.
- Leave the contract with no shared expense pathItems except
  `CarExpenseCollection`, which the car-detail slice will replace.

**Non-Goals:**

- Extracting a shared Go package or shared frontend list/form helpers
  across repairs, refuels, and tickets. The duplication is known.
  Consolidating it is a refactor with its own proposal, not part of a
  parity slice.
- `GET /cars/{carId}/tickets` (`EP-16`) and any change to
  `CarExpenseCollection`.
- A car filter control on `/tickets`, for the same reason repairs has none
  (see proposal).
- Showing the description as a row tooltip, as the legacy list did with
  `title=`. Repairs dropped this too; the description is visible on the
  edit screen.
- Any database change.

## Decisions

### D1. New `internal/tickets` package mirroring `internal/repairs`

The `Repository` has the same shape: `List`, `Create`, `Get`, `Update`,
`Delete`, plus `Locations` in place of `Stations`. `RegisterRoutes` mounts
all six routes behind `requireSession`. `GET /api/v1/tickets/locations` is
registered before `GET /api/v1/tickets/{ticketId}`, as in repairs, so the
literal segment is not read as an ID. (Go's `ServeMux` already prefers the
more specific pattern; the ordering is only for readability.)

*Alternative considered*: a generic `internal/expenses` package
parameterised by table. Rejected for this slice; see Non-Goals.

### D2. Ownership, listing, and filters follow repairs D2 unchanged

Every query joins `tickets t` to `cars c` and filters on
`c.account_id = $1`. Other rules carried over from repairs:

- A single ticket that is missing or not owned is `404`.
- A `carId` filter naming another account's car returns an empty page.
- `from`/`to` bound `t.date`.
- A malformed `cursor`, `carId`, `from`, or `to` is `400` with
  `invalid_type`.
- Default page size is 25, maximum 100.

`Locations` returns
`SELECT DISTINCT t.location ... ORDER BY t.location` over the caller's
tickets only, which fixes `NG-03`.

### D3. Partial update uses plain pointers only

`date`, `type`, `location`, `amount`, and `description` are all `*T` and
applied with `COALESCE($n, column)` in one `UPDATE ... RETURNING`.
`description` is cleared with `""`, as in repairs D3. The API never returns
`null` for it, so no tri-state is needed.

### D4. Validation reuses existing reasons

| Field | Constraint | Reason |
|---|---|---|
| `carId` | required UUID of an owned car | `required`, `invalid_type`; a car that is not owned → `404` |
| `date` | required RFC 3339 date-time | `required`, `invalid_type` |
| `type` | one of `parking`, `velocity`, `other` | `required`, `invalid_enum` |
| `location` | required, non-blank after trim | `required`, `empty` |
| `amount` | required decimal ≥ 0 | `required`, `invalid_decimal`, `negative` |
| `description` | optional text | `invalid_type` if not a string |
| unknown member | rejected | `unknown` |
| `carId` on update | not part of `TicketUpdate` | `unknown`, as in repairs |
| empty update body `{}` | `minProperties: 1` | `required` on the body field, as in repairs |

No new `apierror` constant and no change to `api-contract/common`.

### D5. Contract edits

- `TicketInput`/`TicketUpdate` gain `additionalProperties: false`.
- `Ticket` becomes a standalone schema whose members are all required:
  `id`, `carId`, `date`, `type`, `location`, `amount`, `description`. This
  follows repairs D5: `allOf` with a strict `TicketInput` would make any
  `Ticket` that carries `id` invalid.
- New `TicketPage` (`{ items: Ticket[], nextCursor: string | null }`).
  `/tickets` `get` is written inline (`operationId: listTickets`) and still
  references the shared `Cursor`/`Limit`/`CarFilter`/`From`/`To`
  parameters.
- `/tickets/locations` `get` is written inline
  (`operationId: listTicketLocations`, `string[]`).
- `ExpenseBase` and the `ExpenseCollection`, `StationSuggestions`, and
  `LocationSuggestions` pathItems are deleted once nothing references them.
  `redocly.yaml` has `no-unused-components: off`, so leaving them would not
  fail lint, but they would be dead text that invites the next slice to
  reuse a known-broken shape.

### D6. Frontend

- Files:
  - `src/tickets/ticket-form.tsx`, shared by create and edit;
  - routes `_authenticated/tickets/index.tsx`, `create.tsx`, and
    `$ticketId/edit.tsx`, replacing `_authenticated/tickets.tsx`;
  - client functions in `src/api/client.ts` with `isTicket`/`isTicketPage`
    guards.
- The car `<select>` loads `getCars({ limit: 100 })`, the same trade-off as
  repairs D6. Location autocomplete uses a native `<datalist>` fed by
  `getTicketLocations()`.
- The list uses `useInfiniteQuery` with a load-more button. The running
  total is a reduce over the loaded pages, and the rows are the columns
  from `SCR-19`.
- After a create, edit, or delete, the tickets list query and the
  locations query are invalidated so that a new location is suggested
  immediately.
- Ticket-type labels live under `tickets.types.*` in both locales. The
  German labels are "Parken", "Geschwindigkeit", and "Sonstiges".

## Risks / Trade-offs

- **Third near-copy of the same package.** → Accepted for parity speed and
  easy side-by-side review. A shared-helper refactor becomes attractive
  once all three verticals and the car-detail tabs exist, because only then
  is the common shape actually known.
- **Account-wide listing has no `(account, date, id)` index.** → Same
  accepted risk as repairs: per-account ticket volume is small.
- **The `api-contract/expenses` delta is based on refuels-management's
  unarchived text.** → Archive `refuels-management` before this change. If
  the order is reversed, re-apply the refuel sentences when archiving.
- **Deleting the shared pathItems changes `schema.gen.ts`.** → No frontend
  code imports the generated shared-pathItem types directly;
  `pnpm check:api` and `pnpm typecheck` confirm this.

## Migration Plan

No data migration. Deploy the backend and frontend together as usual.
Rollback is reverting the commit.
