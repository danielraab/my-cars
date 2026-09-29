# Tasks

## 1. Contract: remove the per-car expense placeholder

- [ ] 1.1 Delete `/cars/{carId}/refuels`, `/cars/{carId}/repairs`,
  `/cars/{carId}/tickets` and `components.pathItems.CarExpenseCollection`
  from `openapi/openapi.yaml`. Copy the result to `backend/openapi.yaml`
  and regenerate `frontend/src/api/schema.gen.ts`. Verify that
  `pnpm lint:openapi`, `pnpm check:api`, `pnpm typecheck` and
  `go test ./...` (including `openapi_sync_test.go`) pass.
- [ ] 1.2 In `docs/parity-checklist.md`, note under `EP-12`, `EP-14` and
  `EP-16` that the car-filtered `GET /refuels`, `/repairs` and `/tickets`
  cover them. Verify the ids are unchanged.

## 2. Backend: chart consumption across a `from` bound

- [ ] 2.1 Extend `refuels.Repository.Chart`/`Store.Chart` to also return
  each car's last odometer reading before `f.From` (D6). Skip the extra
  query when `From` is nil. Verify with a `store_test.go` case: two cars,
  a refuel without an odometer reading just before `from`, and a car
  filter.
- [ ] 2.2 Seed the handler's `previous` map from that result. Verify with
  `handler_test.go` cases:
  - a first-in-range refuel gets distance and consumption from its seeded
    predecessor;
  - a car's first refuel ever has neither;
  - `TestChartDerivedValuesAcrossCars` still passes.

## 3. Frontend data layer: date-range filters

- [ ] 3.1 Add `from`/`to` to `getRefuels`, `getRepairs` and `getTickets`.
  Change `getRefuelChart` to take `{ carId?, from?, to? }`. Verify in
  `api/client.test.ts`/`refuels.test.ts` that the query strings contain
  exactly the parameters supplied.
- [ ] 3.2 Turn the refuels, repairs and tickets list/chart query options
  into functions of a filter, with the filter inside each type's existing
  key prefix (D3). Update `/refuels`, `/repairs` and `/tickets` to call
  them. Verify with `pnpm typecheck` and the existing route tests.
- [ ] 3.3 Add a pure `dateRangeToInstants(from, to)` and a default-`from`
  helper (D2). Verify with unit tests covering:
  - the local-midnight `from`;
  - the next-day exclusive `to`;
  - an open `to`;
  - a DST-transition day;
  - the six-month default on a month-end date.

## 4. Frontend: extract the expense tables

- [ ] 4.1 Move the `/refuels` table into `src/refuels/refuel-table.tsx`,
  with an optional `carNames` (car column hidden when omitted) and a
  `derived` consumption map (D4). Switch `/refuels` over to it. Verify
  `-refuels.test.tsx` passes without changes to its assertions.
- [ ] 4.2 Do the same for `src/repairs/repair-table.tsx`
  (`-repairs.test.tsx`) and `src/tickets/ticket-table.tsx`
  (`-tickets.test.tsx`). Add one test per table showing that leaving out
  `carNames` removes the car column.

## 5. Frontend: shared `LineChart`

- [ ] 5.1 Extract `src/components/line-chart.tsx` from `FuelPriceChart`
  (D5), and rename the chart CSS to `.line-chart`. Rebuild `FuelPriceChart`
  on it. Verify:
  - the `-refuels.test.tsx` chart assertions still pass;
  - `/refuels` looks the same in de and en, with one fuel and with several.
- [ ] 5.2 Add `src/refuels/consumption-chart.tsx` (single series, leaves
  out refuels without consumption, localized empty state). Add de/en
  messages. Verify with a component test: plotted points, the empty state,
  and German labels.

## 6. Frontend: car detail tabs

- [ ] 6.1 Add `validateSearch` for `tab`, `from` and `to` to
  `/cars/$carId`, dropping unknown and malformed values (D1, D2). Verify
  with tests that `?tab=bogus` and `?from=2026-02-30` fall back to the
  defaults.
- [ ] 6.2 Replace the detail body with a HeadlessUI `TabGroup` (Details /
  Expenses / Consumption) whose selection follows `?tab`. Keep the edit
  action, and keep the not-found/error states outside the tabs. Add de/en
  tab labels. Verify with tests that:
  - selecting a tab updates the URL;
  - `?tab=consumption` opens that tab;
  - no expense query runs on Details;
  - a car that isn't found renders no tabs.
- [ ] 6.3 Add the shared date-range control, shown only on Expenses and
  Consumption, writing `from`/`to` with `replace: true`. Add de/en labels.
  Verify with tests that:
  - the default range is requested;
  - editing both dates updates the URL and the requests use the instants
    from `dateRangeToInstants`;
  - the range carries over when switching tabs.
- [ ] 6.4 Build the Expenses tab: refuels, repairs and tickets sections,
  each with a car-filtered, range-bounded infinite query, a heading, an
  "add new" link with `?carId=`, a table without the car column, and
  loading/empty/error/load-more states. Feed the refuel consumption column
  from the chart query. Add de/en strings. Verify with tests that:
  - each section lists only the car's rows;
  - the "add new" links carry `carId`;
  - one failing section doesn't hide the others;
  - load more appends only to its own section.
- [ ] 6.5 Build the Consumption tab with `ConsumptionChart` fed by
  `refuelChartQueryOptions({ carId, from, to })`, with loading and
  retryable-error states. Verify with tests that the chart request carries
  the range and that an error shows a retry action.

## 7. Integration checks

- [ ] 7.1 Run `pnpm check`, `pnpm typecheck`, `pnpm test`,
  `pnpm check:api`, `pnpm lint:openapi` and `go test ./...` in the repo.
  All must pass.
- [ ] 7.2 Walk through `SCR-11` in the running app with seeded data
  (`seed` command), in both German and English:
  - tabs, the default range, narrowing and widening the range;
  - "add new" from each section and back;
  - consumption continuing across the `from` edge.

  Confirm the visible behaviour matches the `frontend/cars` delta spec.
