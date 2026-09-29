# Design

## Context

- **Car detail today.** `routes/_authenticated/cars/$carId/index.tsx`
  renders only the Details content (`CarDetails`) and an edit link.
- **Filtering already works in the backend.** `GET /refuels`, `/repairs`,
  `/tickets` and `/refuels/chart` all parse `carId`, `from` and `to`. The
  stores filter with `date >= from AND date < to`, so `to` is exclusive.
  A `carId` that names none of the caller's cars gives an empty result.
- **The frontend can't send ranges yet.** `getRefuels`, `getRepairs`,
  `getTickets` and `getRefuelChart` accept only `carId` (and a cursor), not
  `from`/`to`. `repairsListQueryOptions` and `ticketsListQueryOptions` are
  constants with no parameters.
- **Tables are written inline.** Each list route (`refuels/index.tsx`,
  `repairs/index.tsx`, `tickets/index.tsx`) writes its `<table>` itself.
  `/refuels` looks up consumption from the chart query (`derived` map),
  because a table page may not contain each row's predecessor.
- **One hand-drawn chart.** `FuelPriceChart` is hand-written SVG. It uses a
  100×100 stretched viewBox, non-scaling strokes, dots drawn as zero-length
  lines, HTML axis labels and a legend. The `.chart-*` CSS classes in
  `styles.css` belong to it.
- **The chart handler loses predecessors at `from`.** `refuels.Handler.chart`
  works out `distance`/`consumption` by walking the rows the store
  returned. With a `from` bound, the first refuel in range has no
  predecessor in that set and loses both values, which breaks
  `api-contract/expenses`. Nothing passes `from` today, but the shared date
  range will.
- **HeadlessUI** (`@headlessui/react` 2.x) is installed. Only the app shell
  uses it so far.

## Goals / Non-Goals

**Goals:**

- One table component per expense type, used by both the list route and the
  Expenses tab, so the columns can't drift apart.
- One line-chart primitive for every time-series chart (fuel price,
  consumption, and later the dashboard).
- Keep the whole screen state (tab and range) in the URL.

**Non-Goals:**

- A shared helper that spans the three expense types (queries, forms, Go
  packages). That remains the separate refactor the tickets design
  deferred.
- Adding a date-range control to `/refuels`, `/repairs` or `/tickets`.
- Axis ticks, hover tooltips, or zooming in the chart. The new chart
  matches the current fuel-price chart feature for feature.
- Any database migration.

## Decisions

### D1. Tabs: a HeadlessUI `TabGroup` driven by `?tab`

The route's `validateSearch` returns
`{ tab?: 'details' | 'expenses' | 'consumption'; from?: string; to?: string }`.
It drops unknown or malformed values: a date must match `YYYY-MM-DD` and
parse to that same calendar date.

The `TabGroup` is controlled:

- `selectedIndex` is derived from `tab`, with Details as the default.
- `onChange` navigates with `search: (prev) => ({ ...prev, tab })`. The
  range stays in the URL and each switch adds a history entry.

HeadlessUI mounts only the selected `TabPanel` by default (`unmount`), so
expense and chart queries run only for the tab that is visible. The
not-found and error states render instead of the `TabGroup`.

*Alternatives:*

- **Child routes** (`/cars/$carId/expenses`): more route files, the Details
  URL would move, and the tab ARIA wiring would have to be written by hand.
- **Local `useState`**: the tab could not be linked to and would be lost on
  reload.

### D2. The date range lives in the URL as dates and becomes instants at request time

`useCarDateRange()` (next to the route) resolves the search params to
`{ from: string; to?: string }` as `YYYY-MM-DD`:

- A missing `from` becomes the same day six calendar months earlier in
  local time, clamped to the last day of a shorter month (31 August
  becomes 28 February). `Date#setMonth` alone would roll over into the
  next month instead.
- The default is *not* written into the URL, so a bookmark without `from`
  always means "the last six months".

The conversion to request values happens in one place, a pure
`dateRangeToInstants(from, to)` helper:

- `from` becomes local midnight of that day, as an ISO string.
- `to` becomes local midnight of the *next* day, which fits the backend's
  exclusive `to` bound.
- Building both through `new Date(y, m, d)` keeps DST days correct.

The control is two `<input type="date">` fields with localized labels,
rendered above the `TabPanels` and hidden while Details is selected.
Changing a field navigates with `replace: true`, so typing a date doesn't
add a history entry for every keystroke.

*Alternative:* store ISO instants in the URL. They're awkward to read and
edit, and tie the URL to the time zone of whoever created the link.

### D3. The API client and query options accept `from`/`to`

- `getRefuels`, `getRepairs`, `getTickets` and `getRefuelChart` take an
  options object with `carId`, `from` and `to`. `getRefuelChart` changes
  from `(carId?)` to `({ carId?, from?, to? })`.
- `refuelsListQueryOptions`, `refuelChartQueryOptions`,
  `repairsListQueryOptions` and `ticketsListQueryOptions` become functions
  of a filter `{ carId?, from?, to? }`.
- Each query key adds the filter object under the existing type prefix, for
  example `[...repairsQueryKey, 'list', filter]`. The create, edit and
  delete invalidation on the prefix therefore refreshes the car-scoped
  lists as well.
- The existing list routes call these with no range. `/refuels` passes
  `{ carId }` as it does today.

### D4. Table components take rows and render the shared columns

`src/refuels/refuel-table.tsx`, `src/repairs/repair-table.tsx` and
`src/tickets/ticket-table.tsx` each export a component with these props:

- `items`;
- `carNames?: Map<string, string>`, where leaving it out hides the car
  column;
- `RefuelTable` only: `derived: Map<string, Refuel>` for consumption.

They render only the `<table>`: header, rows, edit links and localized
cell formatting, moved unchanged from the routes.

The following stay in the caller:

- queries;
- loading, empty and error states;
- the load-more button;
- `AmountSum` (list routes only).

That makes the Expenses tab's sections thin: each is a query, a heading
with an "add new" `Link` (`search: { carId }`) and the table. The Expenses
tab runs the chart query as well (same car and range) purely to fill the
refuel table's consumption column, as `/refuels` already does.

*Alternative:* have components own their queries. That would mix the two
callers' different state handling and load-more behaviour, and it is the
larger shared-helper refactor that was deferred.

### D5. `LineChart` holds the plotting, and wrappers hold the meaning

`src/components/line-chart.tsx` exports `LineChart` with these props:

- `series: { key, className, label, points: { id, time, value }[] }[]`;
- `formatValue(n)`;
- `ariaLabel`.

It owns everything `FuelPriceChart` draws today:

- scaling, including the flat-range case;
- the stretched viewBox;
- polylines and dot segments;
- the y and x axis labels (with the locale's medium date format);
- the legend, shown when the caller passes `showLegend`. `/refuels` shows
  it even with a single fuel, so it can't depend on the number of series.

It leaves out points whose `time` or `value` is not finite. When no series
has points, it renders the `empty` node the wrapper passes in, so the
finite-point check lives in one place.

The existing `.chart-*` CSS moves from `.fuel-price-chart` to a generic
`.line-chart` class. Per-series colour classes (`chart-normal`, …) stay
as they are, and the consumption series gets `chart-consumption`.

- **`FuelPriceChart`** maps refuels to one series per fuel subtype, using
  the three-decimal price format. Its outward behaviour doesn't change.
- **`ConsumptionChart`** (`src/refuels/consumption-chart.tsx`) maps the
  refuels that have a `consumption` to a single series, using the
  two-decimal format with the `l/100 km` unit from the existing
  `refuels.consumptionValue` message. Its empty state reads "Not enough
  refuels with odometer readings in this range".

*Alternative:* write a second chart component by hand. That copies about
100 lines of geometry, and the dashboard chart (`SCR-02`) would copy it a
third time.

### D6. The chart store returns each car's odometer before `from`

The `Repository.Chart` signature changes to return
`([]Refuel, map[string]int64, error)`. The map holds, for each car, the
last known odometer reading dated before `f.From`. When `From` is nil, the
map is empty and the query is skipped.

The store looks it up with a second query that applies the same ownership
and car filters:

```sql
SELECT DISTINCT ON (car_id) car_id, odometer_reading FROM refuels
WHERE <owned> AND ($2::uuid IS NULL OR car_id = $2::uuid)
  AND date < $3 AND odometer_reading IS NOT NULL
ORDER BY car_id, date DESC, id DESC
```

The handler's `previous` map starts from this map instead of empty. The
existing walk and the existing rule of skipping predecessors that have no
odometer reading stay as they are.

*Alternatives:*

- **A `LAG` window over the unbounded rows, then filtering by range.**
  Postgres has no `IGNORE NULLS`, so skipping refuels without an odometer
  reading makes this harder to follow, and it scans the car's whole
  history on every call.
- **Fetching unbounded rows and trimming in Go.** This sends more data for
  no benefit.

### D7. The contract removal is only a YAML change

Delete the three `/cars/{carId}/…` paths and `components.pathItems.
CarExpenseCollection` from `openapi/openapi.yaml`, then refresh the copies:

- copy the file to `backend/openapi.yaml`, which `openapi_sync_test.go`
  enforces;
- regenerate `schema.gen.ts`, which `pnpm check:api` checks.

No Go handler, and no frontend code outside `schema.gen.ts`, refers to them.

## Risks / Trade-offs

- **[Risk] The `LineChart` extraction changes how `/refuels` looks.**
  Mitigation: move the markup and CSS without changing them, and keep the
  current `-refuels.test.tsx` chart assertions passing before and after.
  Compare `/refuels` in both locales by hand, with one fuel and with
  several.
- **[Risk] Changing `getRefuelChart`'s signature breaks existing callers or
  tests.** Mitigation: `pnpm typecheck` finds every call site, and
  `refuels.test.ts` covers the client.
- **[Trade-off] The Consumption tab defaults to six months instead of the
  whole history.** This is intentional (see proposal). The user can widen
  the range, and D6 keeps the consumption values correct at the range edge.
- **[Trade-off] The Expenses tab runs four queries** (three lists plus the
  chart for consumption). They are small and bounded by car and range; the
  chart query is shared with the Consumption tab through the query cache
  when the range is the same.
- **[Risk] Local-midnight boundaries differ from the server's zone.** This
  is intentional: the user's calendar day is what they mean. It is covered
  by a unit test of `dateRangeToInstants`, including a DST-transition day.

## Migration Plan

Frontend and backend ship together in one release. The removed contract
paths were never served, so no client breaks. Rolling back means reverting
the commit.

## Open Questions

_None._ Parity details that are still open (a column order that differs
from legacy, localized empty-section wording) can be settled during apply
without touching the specs.
