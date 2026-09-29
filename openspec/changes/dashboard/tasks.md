# Tasks

## 1. Contract

- [x] 1.1 In `openapi/openapi.yaml`, change the `FromRequired`/`ToRequired`
  parameters of `/stats/expenses` from `date` to `date-time`, keeping the
  optional `CarFilter`. Replace `ExpenseStatistics` with
  `{ items: [{ date: date-time, kind: refuel|repair|ticket, amount: Decimal }] }`,
  all members required, and describe the inclusive/exclusive bounds and
  the unpaged ordering by date (D1). Verify that `pnpm lint:openapi`
  passes with no new warnings.
- [x] 1.2 Copy the spec to `backend/openapi.yaml` and run
  `pnpm generate:api` in `frontend/`. Verify that
  `go test ./...` passes `openapi_sync_test.go` and that `pnpm check:api`
  passes.

## 2. Backend `internal/stats`

- [x] 2.1 Add `internal/stats` with a `Repository` interface and a `Store`
  whose single `UNION ALL` query returns the caller's refuels, repairs and
  tickets within `[from, to)`, optionally for one car, ordered by `date`,
  `kind`, `id`, with `amount` read as text (D2). Verify with a Postgres
  store test (skipped without `DATABASE_URL`, like the other stores)
  covering:
  - rows from all three tables, in order;
  - an expense exactly at `from` included, and one exactly at `to`
    excluded;
  - the car filter;
  - another account's expenses excluded, including when their car ID is
    passed as the filter;
  - an amount with three fraction digits returned unchanged.
- [x] 2.2 Add the handler: `GET /api/v1/stats/expenses` behind
  `requireSession`. `from`/`to` are required RFC 3339 values (`required` or
  `invalid_type`) and `carId` must be a UUID; the response is
  `{ items: [...] }` with an empty array rather than `null` (D2). Verify with
  handler tests against a fake repository: 401 without a session, 400 for
  a missing `to`, malformed `from` and malformed `carId`, and the response
  shape.
- [x] 2.3 Wire `stats.NewHandler(stats.NewStore(pool))` in `main.go` next
  to the other handlers. Verify that `go vet ./...` and `go test ./...`
  pass, and that with the app running on seeded data,
  `GET /api/v1/stats/expenses?from=…&to=…` returns rows.

## 3. Frontend building blocks

- [x] 3.1 Add `getExpenseStatistics({ from, to, carId? })` to
  `api/client.ts` and `expenseStatisticsQueryOptions` in
  `dashboard/queries.ts`, keyed by the filter. Verify with a client test
  that the query string carries all three parameters and that a missing
  `carId` is left out.
- [x] 3.2 Add `lib/decimal.ts` with `sumDecimals` (D3). Verify with unit
  tests: `0.1 + 0.2` gives `0.3`, mixed scales (`1.5 + 2.25 + 3`), three
  fraction digits kept, an empty list gives `0`.
- [x] 3.3 Add `yearToInstants(year)` to `lib/date-range.ts` (D7). Verify
  with a unit test that it returns local midnight on 1 January of the year
  and of the following year, as ISO instants.
- [x] 3.4 Add `dashboard/monthly-expenses.ts` with `monthlyExpenses` (D4).
  Verify with unit tests run in a time zone ahead of UTC (for example
  `Europe/Vienna`):
  - an expense at 00:30 local time on 1 April counts in April;
  - the totals per kind use exact sums;
  - months without expenses are zero;
  - a daylight-saving day is handled correctly.
- [x] 3.5 Add `components/stacked-bar-chart.tsx` and the `.chart-refuel`,
  `.chart-repair` and `.chart-ticket` series styles (D5). Verify with a
  component test:
  - it renders the SVG with its label and a legend naming the series;
  - the hidden table lists every category with its formatted values and
    sum;
  - all-zero input renders `empty`.
- [x] 3.6 Extract `components/car-select.tsx` (D6) and switch `/refuels`,
  `/repairs` and `/tickets` to it with their existing ids and labels.
  Verify that no `<select` bound to a car filter is left in those three
  route files, and that the existing refuels, repairs and tickets route
  tests pass unchanged.
- [x] 3.7 Add `dashboard/search.ts` with `validateDashboardSearch`,
  exporting the UUID pattern from `lib/list-search.ts` instead of copying
  it (D7). Verify with unit tests: a valid year as string and as number,
  `abc`/`20245`/missing → `undefined`, a valid and a malformed `carId`,
  every key present.

## 4. Dashboard route

- [x] 4.1 Replace `routes/_authenticated/home.tsx` with the dashboard
  (D7, D8): header, car cards, the three create shortcuts, the toolbar with
  `CarSelect` and the year stepper, and the chart card with loading,
  retryable error and empty states. It requests `yearToInstants(year)`
  plus `carId`. Verify with route tests (`routes/-dashboard.test.tsx`):
  - the default request covers the current local year, with no `year` in
    the URL;
  - "previous year" writes `year=` one lower and the request moves to it;
    "next year" is enabled on the current year and moves past it;
  - selecting a car writes `?carId=`, the request carries it, and the
    shortcuts link to `/…/create?carId=`;
  - `/home?year=2024&carId=…` restores both, and `?year=abc` shows the
    current year;
  - car cards link to `/cars/$carId`;
  - an empty year shows the empty state, and a failing request shows the
    error, whose retry refetches.
- [x] 4.2 Add the `dashboard.*` messages in de and en: eyebrow, title,
  description, shortcuts, filter labels, previous/next year labels, chart
  label, series names, table headers, and the loading, empty and error
  states. Verify with a route test that the dashboard renders in German,
  including German month names.
- [x] 4.3 Delete `components/deferred-page.tsx`, its `.deferred-page`
  styles and the `unavailable.*` messages. Replace the `/home` case of the
  placeholder test in `routes/-app.test.tsx` with a check that `/home`
  renders the dashboard inside the shell. Verify that
  `grep -rn "DeferredPage\|deferred-page\|unavailable\.title" frontend/src`
  finds nothing and that `pnpm test` passes.

## 5. Parity checklist

- [x] 5.1 Update `SCR-02` and `EP-28` in `docs/parity-checklist.md` to say
  how the rewrite covers them:
  - one calendar year at a time with previous/next navigation, plus a car
    filter;
  - `GET /api/v1/stats/expenses` returns rows grouped into local months by
    the browser.

  Do not edit anything under `old/`. Verify that the file reads correctly
  and that `git status` shows no change under `old/`.

## 6. Integration

- [x] 6.1 Run `pnpm check`, `pnpm typecheck`, `pnpm test` and
  `pnpm check:api` in `frontend/`, and `go vet ./...` and `go test ./...`
  in `backend/`. Verify that they all pass.
- [x] 6.2 Run the app against seeded data and open `/home`. Verify:
  - the bars match the `/refuels`, `/repairs` and `/tickets` totals for
    the same car and year;
  - previous/next and the car filter survive a reload;
  - the German locale formats months and amounts;
  - the page has no horizontal scrolling at phone width.
