# Design

## Context

- **The car detail range already exists.** `routes/_authenticated/cars/$carId/index.tsx`
  handles the range this way:
  - Its `validateSearch` accepts `{ tab, from, to }` and drops malformed
    dates.
  - It defaults `from` with `defaultFrom()` and does not write the default
    into the URL.
  - It builds the query filter with `dateRangeToInstants(from, to)`. The
    helpers live in `cars/date-range.ts` and are tested in
    `cars/date-range.test.ts`.
  - `DateRangeControl` is a function inside the route file. It calls that
    route's own `Route.useNavigate()`, uses `replace: true`, and reads the
    labels `cars.detail.range.{label,from,to}`. Its styles are `.date-range`
    in `styles.css`.
- **`/refuels`** keeps `carId` in `useState` and passes `{ carId? }` both to
  `refuelsListQueryOptions` and to `refuelChartQueryOptions`. The per-row
  consumption comes from the chart series (the `derived` map).
- **`/repairs`** and **`/tickets`** have no filter at all. They call
  `repairsListQueryOptions()` and `ticketsListQueryOptions()`.
- **The backend and API client need nothing new.** `ExpenseFilter` already
  has `carId`, `from` and `to`, and all three operations honour them. The
  chart already seeds each car's predecessor from before `from`.
- **Existing links drop the filters.** The create and edit screens go back
  with `to: '/refuels'` or `to: '/repairs'` and no search params.

## Goals / Non-Goals

**Goals:**

- A single implementation of the date range, shared by four screens: car
  detail, `/refuels`, `/repairs` and `/tickets`. Moving the code, not copying it.
- Keep the whole filter state of each overview in the URL.

**Non-Goals:**

- Keeping the filter across the create and edit round trip. Returning to
  an overview from those screens resets the view to the
  default range.
- Presets such as "last year" or "all time", and a "reset" button. Users
  widen the range by editing "from".
- Changing the chart's x-axis to cover the selected range. It keeps fitting
  the data.

## Decisions

### D1. Helpers move to `src/lib/date-range.ts`

- `cars/date-range.ts` and its test move unchanged to `lib/date-range.ts`
  and `lib/date-range.test.ts`.
- All importers switch to `#/lib/date-range`: the car detail route and
  `routes/-car-detail.test.tsx`.
- `src/lib/` is new. It holds framework-free helpers that belong to no
  single feature folder.
- *Alternative:* leave the helpers in `cars/` and import them from
  refuels/repairs. Rejected: feature folders importing from each other
  would couple unrelated screens.

### D2. `DateRangeControl` becomes a controlled component in `components/`

- The new component is `components/date-range-control.tsx`:
  `DateRangeControl({ from, to, onChange })`, where `onChange` is
  `(range: { from?: string; to?: string }) => void`.
- It renders the same `<fieldset class="date-range">`, with its `min`/`max`
  wiring and hidden legend.
- It only reports values that pass `isCalendarDate`, and reports a cleared
  input as `undefined`.
- Each route does its own navigation through its own `Route.useNavigate()`:
  `navigate({ replace: true, search: (prev) => ({ ...prev, ...range }) })`.
- *Alternative:* give the component a route id and let it call
  `useNavigate`. Rejected: TanStack Router's typed search is per route, so
  a generic navigating component would need an `any` cast or a generic
  over route ids. Passing a callback keeps the component free of the
  router.

### D3. List search parsing is a small shared helper

- `/refuels`, `/repairs` and `/tickets` share the same search shape:
  `{ carId?: string; from?: string; to?: string }`.
- `lib/list-search.ts` exports a `validateListSearch` that all three routes use
  as `validateSearch`:
  - `carId` is kept only when it is a UUID.
  - The dates go through `isCalendarDate`.
  - Every key is always set, even to `undefined`, as the car detail route
    already does.
- The car detail route keeps its own `validateSearch` because of `tab`. It
  reuses `isCalendarDate` for the dates.
- An unknown but well-formed `carId` is left in the URL. The API returns an
  empty page for it, and the select shows "All cars" because no option
  matches. That is acceptable, and it avoids waiting for the cars query
  before filtering.

### D4. One query filter feeds the list and the chart

- Each overview builds one object:
  `{ ...(carId ? { carId } : {}), ...dateRangeToInstants(from ?? defaultFrom(), to) }`.
- On `/refuels` the same object is passed to both query options. That
  keeps the table, the running total and the `derived` consumption lookup
  consistent.
- Both query keys already include the filter, so changing the range
  refetches the data without any extra wiring.

### D5. Toolbar layout and messages

- All three overviews render the car `<select>` and the `DateRangeControl` side
  by side in `.list-toolbar`, which wraps on narrow screens.
- The `.date-range` styles move from the car-detail tab bar into shared
  styles, with only the minimal CSS needed for the toolbar context.
- Messages:
  - `cars.detail.range.{label,from,to}` move to a new top-level `dateRange`
    namespace in both locales. The old keys are removed.
  - `/repairs` and `/tickets` gain `{repairs,tickets}.filter` and
    `{repairs,tickets}.allCars`.
  - `refuels.empty`, `repairs.empty` and `tickets.empty` are reworded to
    the range-aware "No refuels/repairs/tickets in this date range."
    (de: "… in diesem Zeitraum.").

## Risks / Trade-offs

- [Users of the overviews suddenly don't see older records] → This is
  intentional and covered by the proposal. The "from" input is always
  visible and shows the date the default resolves to, so the cutoff is
  explicit.
- [Moving the control breaks car detail] → The existing
  `-car-detail.test.tsx` range tests run unchanged against the moved
  component, apart from the import paths.
- [Typed search on `/refuels` breaks the "add refuel" link, which currently
  passes `carId`] → The link keeps passing `search.carId`, so there is no
  change in behaviour.
