# Tasks

## 1. Move the shared date-range pieces

- [x] 1.1 Move `frontend/src/cars/date-range.ts` and `date-range.test.ts` to
  `frontend/src/lib/` using `git mv`, and update every importer (car detail
  route, `routes/-car-detail.test.tsx`) to `#/lib/date-range` (D1). Verify
  that `grep -r "cars/date-range" frontend/src` finds nothing and that
  `pnpm test` passes.
- [x] 1.2 Extract `DateRangeControl` from
  `routes/_authenticated/cars/$carId/index.tsx` into
  `components/date-range-control.tsx` as a controlled component
  (`from`, `to`, `onChange`) (D2). The car detail route keeps its
  navigation (`replace: true`) inside its `onChange`. Verify that no
  `DateRangeControl` definition is left in the route file and that the
  `car detail date range` tests in `-car-detail.test.tsx` pass unchanged.
- [x] 1.3 Move the `cars.detail.range.{label,from,to}` messages to a
  top-level `dateRange` namespace in both locales and remove the old keys
  (D5). Verify that `grep -r "cars.detail.range" frontend/src` finds
  nothing and that the car detail tests still find the "From" and "To"
  labels.
- [x] 1.4 Make the `.date-range` styles work outside the car-detail tab
  bar (D5). Verify visually that car detail looks the same as before.
- [x] 1.5 Add `lib/list-search.ts` with `validateListSearch` (UUID
  `carId`, calendar-date `from`/`to`, every key always set) (D3). Verify
  with a unit test covering valid values, malformed values and missing
  values.

## 2. `/refuels`: car filter and range in the URL

- [x] 2.1 Give `routes/_authenticated/refuels/index.tsx` a `validateSearch`
  (`validateListSearch`) and replace the `useState` car filter with
  `search.carId`. The select navigates with `replace: true`, and the
  "add refuel" link keeps passing `carId`. Verify with a route test:
  selecting a car writes `?carId=` and both the list and chart requests
  carry it.
- [x] 2.2 Render `DateRangeControl` in the toolbar and build one filter
  from `carId` plus `dateRangeToInstants(from ?? defaultFrom(), to)`. Pass
  that filter to both `refuelsListQueryOptions` and
  `refuelChartQueryOptions` (D4). Verify with route tests:
  - the default request carries `from` six months back and no `to`;
  - an edited range writes `from`/`to` to the URL, and both requests use
    the inclusive instants;
  - opening `/refuels?carId=…&from=…` restores the car and the range;
  - a malformed `from` falls back to the default.
- [x] 2.3 Reword `refuels.empty` to the range-aware message in de and en.
  Verify with a route test that an empty range shows it in both locales.

## 3. `/repairs`: car filter and range in the URL

- [x] 3.1 Add `validateSearch` (`validateListSearch`) to
  `routes/_authenticated/repairs/index.tsx`. Add a car `<select>` fed by
  `allCarsQueryOptions` and the `DateRangeControl`, and pass
  `{ carId?, ...dateRangeToInstants(...) }` to `repairsListQueryOptions`.
  Verify with route tests covering the default range, car selection
  (`?carId=` plus the request), an edited range (URL plus inclusive
  instants), and restore on reload.
- [x] 3.2 Add `repairs.filter` and `repairs.allCars`, and reword
  `repairs.empty` to the range-aware message, in de and en. Verify with a
  route test that the labels and the empty state appear in German.

## 4. `/tickets`: car filter and range in the URL

- [x] 4.1 Add `validateSearch` (`validateListSearch`) to
  `routes/_authenticated/tickets/index.tsx`, the car `<select>` and the
  `DateRangeControl`, and pass `{ carId?, ...dateRangeToInstants(...) }`
  to `ticketsListQueryOptions`; "add ticket" keeps the selected car.
  Verify with route tests covering the default range, car selection and
  an edited range (URL plus inclusive instants), and restore on reload.
- [x] 4.2 Add `tickets.filter` and `tickets.allCars`, and reword
  `tickets.empty` to the range-aware message, in de and en. Verify with a
  route test that the labels and the empty state appear in German.

## 5. Integration

- [x] 5.1 Run `pnpm check`, `pnpm typecheck` and `pnpm test` in
  `frontend/`, and verify they all pass.
- [x] 5.2 Run the app against seeded data. Verify on `/refuels`, `/repairs`,
  `/tickets` and `/cars/$carId`:
  - the range filters the tables and the chart;
  - reloading keeps the car and the range;
  - the toolbar wraps without horizontal scrolling at phone width.
