# Design

## Context

- **`/home` is a placeholder.** `routes/_authenticated/home.tsx` renders
  `<DeferredPage feature="dashboard" />`. No other route uses
  `DeferredPage`.
- **The statistics contract exists but has no code behind it.**
  - `/stats/expenses` takes `FromRequired`/`ToRequired` (`format: date`)
    and `CarFilter`, and returns `ExpenseStatistics` as per-day totals.
  - `FromRequired`/`ToRequired` are used nowhere else.
  - The backend has no `stats` package, and `frontend/src/api/client.ts`
    has no function for the operation.
- **Expenses are instants.** `refuels.date`, `repairs.date` and
  `tickets.date` are `TIMESTAMPTZ`; `amount` is `NUMERIC` (non-negative, no
  fixed scale). The contract's `Decimal` is a string with any number of
  fraction digits.
- **Range filters already follow one convention.** The expense collections
  and `GET /refuels/chart` take optional `from`/`to` date-times, with
  `from` inclusive and `to` exclusive. The browser builds them from local
  calendar values (`lib/date-range.ts`). Each backend package parses them
  with `time.Parse(time.RFC3339Nano, …)` and scopes rows with an `owned`
  join on the caller's cars.
- **An unpaged, range-bounded list already exists.** `GET /refuels/chart`
  returns every matching row with no paging and no maximum range.
- **The car selector is duplicated.** `/refuels`, `/repairs` and
  `/tickets` each render the same inline `<select>` fed by
  `allCarsQueryOptions`, with their own `*.filter`/`*.allCars` labels, and
  write `carId` through `validateListSearch`.
- **Charts are hand-drawn SVG.** `components/line-chart.tsx` draws into a
  stretched 100×100 `viewBox`, colours series through a `--series` custom
  property set by a class, and renders an optional legend. There is no
  chart library.
- Car `type` is free text. Legacy picked an icon for `Car`, `Truck` and
  `Bike`, with a fallback for anything else.

## Goals / Non-Goals

**Goals:**

- Month buckets that are correct in the viewer's time zone, with no time
  zone parameter on the API.
- One car-selector implementation for the four screens that filter by car.

**Non-Goals:**

- A yearly or monthly total shown as text next to the chart.
- Year choices other than previous/next (no year picker, no "all time").
- Limiting the range the backend accepts. The UI always asks for one year.
- Keeping the dashboard's year and car when returning from a create screen.

## Decisions

### D1. The API returns rows; the browser does the bucketing

- `GET /stats/expenses?from=&to=[&carId=]` returns
  `{ items: [{ date, kind, amount }] }`.
  - `date` is a date-time.
  - `kind` is an enum of `refuel`, `repair` and `ticket`.
  - `amount` is a `Decimal`.
- The rows are ordered by `date`, then `kind`, then the row's ID, so the
  order is stable. The ID is not part of the response.
- `from` and `to` are date-times, like the collections' `From`/`To`. A
  `$ref`'d parameter can't be made required where it is used, so the
  existing `FromRequired`/`ToRequired` definitions (used only here) change
  from `date` to `date-time` instead of being removed.
- The browser turns each row's `date` into a local `Date` and uses
  `getMonth()`. That is correct across time zones and daylight-saving
  changes, because the browser knows the viewer's time zone.
- *Alternative: a `tz` parameter and `date AT TIME ZONE $tz` in Postgres.*
  Not chosen: it adds IANA zone validation to
  the backend and keeps the bucket boundaries on the server. Rows are cheap
  at this scale: a year is a few hundred rows at most.
- *Alternative: return the legacy shape with three separate arrays.*
  Rejected: one list tagged with `kind` is simpler to group, and the
  contract is being rewritten anyway.

### D2. Backend: a small `internal/stats` package

- The package follows the shape of the expense packages: a `Repository`
  interface, a `Store` on the pool, a `Handler` with `RegisterRoutes(mux,
  requireSession)` and a `withAccount` helper. It is wired in `main.go`
  next to the others.
- The store runs one query: a `UNION ALL` of the three tables, each joined
  to `cars` on `account_id = $1`, filtered by `date >= $from AND date <
  $to` and optional `car_id = $carId`, ordered by `date, kind, id`.
  `amount` is read as text so the value is passed through exactly.
- Validation:
  - `from` and `to` are required and must parse as RFC 3339. A problem is
    reported as `required` or `invalid_type` in the common validation error.
  - `carId` must be a UUID when present.
  - `to <= from` is not an error; it returns no rows, the same as the
    collections.
- A `carId` for a car that isn't the caller's returns no rows, because of
  the ownership join, not `404`. That matches the collections' filter.
- *Alternative: add a `Stats` method to each of the three expense stores
  and merge the results in Go.* Rejected: it is three queries and a merge
  sort for what one SQL statement does, and it spreads one operation
  across three packages.

### D3. Summing money exactly

- A new `lib/decimal.ts` exports `sumDecimals(values: string[]): string`.
  It scales every value to the largest number of fraction digits in the
  input, adds them as `BigInt`s and returns a `Decimal` string. It is
  unit-tested with values such as `0.1 + 0.2` and mixed scales.
- The chart uses `Number(total)` of that exact string for bar heights,
  where float precision doesn't matter, and formats that same exact total
  for labels.
- *Alternative: whole cents.* Rejected: `NUMERIC` has no fixed scale, so an
  amount with three fraction digits would be rounded before summing.
- *Alternative: plain `Number` sums, as the overview running totals do.*
  Rejected for new code. The running totals are left alone.

### D4. Grouping lives in a pure helper

- `dashboard/monthly-expenses.ts` exports
  `monthlyExpenses(items, year): MonthTotals[]` (twelve entries, rows
  outside the local year ignored). Each month holds a
  `refuel`/`repair`/`ticket` total, computed with `sumDecimals` and
  bucketed by local month.
- It is unit-tested with the process time zone set to one ahead of UTC,
  covering an expense at 00:30 local time on the 1st and a
  daylight-saving day.
- The route stays a thin shell: search → query → helper → chart.

### D5. `StackedBarChart` beside `LineChart`

- `components/stacked-bar-chart.tsx` takes
  `{ categories: string[], series: { key, className, label, values: string[] }[], formatValue, label, categoryLabel, totalLabel, empty }`.
  Values are decimal strings, so the table's per-category totals are exact
  sums (`sumDecimals`); only the bar geometry uses `Number`.
- It draws in the same stretched 100×100 SVG: one `<rect>` per non-zero
  segment, stacked upward from the baseline, with categories evenly
  spaced. The y-axis runs from 0 to the largest stacked total, and there
  is always a legend.
- The series colours are new `.chart-refuel`, `.chart-repair` and
  `.chart-ticket` classes that set `--series`. They reuse the palette of
  the existing series classes, so the charts look like one family.
- **Accessibility:** the SVG has `role="img"` and the localized label. A
  visually hidden `<table>` lists each month's three totals and its sum,
  formatted, so screen reader users get the numbers, not just a picture.
  Tests query that table instead of SVG geometry.
- When every value is zero it renders `empty`, the same as `LineChart`.
- Month labels come from `Intl.DateTimeFormat(locale, { month: 'short' })`.
  Below 600px the axis switches to optional `narrowCategories` (`month:
  'narrow'`, e.g. "J F M"), because twelve short names don't fit a phone.
  The table keeps the short names.
- The hidden table sits in an `.sr-only` wrapper rather than carrying the
  class itself: a table ignores the 1px width and grows to its content,
  which scrolled the page sideways at phone width.
- *Alternative: add a chart library.* Rejected: the project has kept
  charts dependency-free, and one stacked bar layout is small.

### D6. Shared `CarSelect`

- `components/car-select.tsx` exports
  `CarSelect({ id, label, allLabel, value, onChange })`.
  - It renders the existing `.form-field` > `label` + `.input-wrap` >
    `select` markup.
  - It loads cars through `allCarsQueryOptions` itself.
  - It reports `undefined` for "all cars".
- `/refuels`, `/repairs` and `/tickets` switch to it, keeping their own
  element ids and message keys so their tests pass unchanged. The
  dashboard passes `dashboard.filter`/`dashboard.allCars`.
- The same controlled-component pattern as `DateRangeControl`: navigation
  stays in each route (`replace: true`).

### D7. Dashboard search and year range

- `dashboard/search.ts` exports `validateDashboardSearch`, returning
  `{ year?: number, carId?: string }`, with every key always set (as
  `validateListSearch` does).
  - `year` is accepted as a number or a string of exactly four digits.
  - `carId` uses the same UUID check as `validateListSearch`. The regex is
    shared by exporting it from `lib/list-search.ts` rather than copying
    it.
- `yearToInstants(year)` in `lib/date-range.ts` returns
  `{ from: new Date(year, 0, 1).toISOString(), to: new Date(year + 1, 0, 1).toISOString() }`,
  both built with the local `Date` constructor.
- The default year is `new Date().getFullYear()`, not written to the URL.
  The previous/next buttons navigate with `replace: true` to
  `year ± 1`, with a `title`/`aria-label` naming the target year.

### D8. Page layout

- The header matches the other screens: icon, eyebrow, title and
  description.
- **Car cards:** a labelled section holding a wrapping grid of links (`Link to="/cars/$carId"`) with a
  lucide icon picked case-insensitively from the type (`car` → `CarFront`,
  `truck` → `Truck`, `bike`/`motorcycle` → `Bike`, otherwise `Car`) and
  `make name`. The cards come from `allCarsQueryOptions`, the same query
  `CarSelect` uses, so there is one request. If loading the cars fails,
  the cards area is left out; the chart has its own error state.
- **Shortcuts:** a labelled list of three `Link`s to `/refuels/create`, `/repairs/create` and
  `/tickets/create`, each with `search={carId ? { carId } : {}}`.
- **Toolbar:** a `.list-toolbar` holding `CarSelect` and the year stepper
  (`‹ 2026 ›`), then the chart card with its loading, error and empty
  states.
- `DeferredPage`, its `.deferred-page` styles and its `unavailable.*`
  messages are deleted. Nothing else uses them.

## Risks / Trade-offs

- **[A hand-made request for a huge range returns a large unpaged
  response]** → The response is still scoped to the caller's own data,
  which is small for this application. `/refuels/chart` makes the same
  trade-off. A maximum range can be added later without changing the
  shape.
- **[Contract shape change]** → The operation was never implemented and
  nothing calls it. `check:api` and `openapi_sync_test.go` catch drift
  between the three copies of the schema.
- **[Viewer's time zone differs from where the expense was recorded]** →
  Buckets follow the viewer's time zone, the same as the date ranges on the
  overviews. That is consistent, and it is the accepted behaviour for this
  app.
- **[Stacked bars with one dominant month flatten the others]** → This
  matches legacy. The accessible table still gives exact values.

## Migration Plan

No data migration. The contract change, backend handler and frontend ship
together. Rollback is a revert: the old per-day shape had no consumer.
