# Proposal

## Why

`/home` (`SCR-02`) is the last legacy screen that still shows the "not yet
available" placeholder. The expense-statistics operation behind its chart
(`EP-28`, `GET /stats/expenses`) is in the contract but has no backend
handler. Every other screen and endpoint in the parity checklist is now
either ported or listed as a non-goal, so the dashboard is the remaining
parity slice.

The contract as written can't be implemented correctly. It takes `from` and
`to` as calendar dates and returns one total per calendar day, but expenses
are stored as `TIMESTAMPTZ`, and the backend doesn't know the viewer's time
zone. An expense just after local midnight on 1 April would be counted in
March for anyone east of UTC. The browser is the only side that knows which
local day, and so which month, an expense falls in.

## What Changes

- **Dashboard screen.** `/home` replaces the placeholder with:
  - a card for each of the caller's cars, linking to its detail screen;
  - "add refuel", "add repair" and "add ticket" shortcuts, which preselect
    the chosen car when one is selected;
  - the car selector used on the expense overviews (all cars or one car);
  - a stacked bar chart of refuel, repair and ticket spending per month
    for one calendar year, January to December, in the viewer's time zone;
  - "previous year" and "next year" buttons around the shown year. Both are
    always enabled; a year without expenses shows a localized empty state.
- **URL state.** The year and car are kept in `?year=` and `?carId=`, so a
  reload or shared link restores them. Without a valid `year` the current
  local year is shown; an invalid `carId` falls back to all cars.
- **Intentional difference from legacy:** legacy `SCR-02` charted the
  caller's whole history at once, and had no car filter. The dashboard
  shows one year at a time and can be filtered by car.
- **BREAKING (contract only; never implemented):** `GET /stats/expenses`
  changes shape.
  - `from` and `to` become required date-time instants (`from` inclusive,
    `to` exclusive), the same as the expense collections' range.
  - The response is no longer per-day totals. It is the matching expenses
    as `{ date, kind, amount }` rows (`kind` is `refuel`, `repair` or
    `ticket`), ordered by date, unpaged. The browser groups them into
    months.
  - `carId` stays an optional, caller-scoped filter.
- **Backend.** A handler and store for `GET /stats/expenses`, scoped to the
  caller's cars.
- **Shared car selector.** The car `<select>` that `/refuels`, `/repairs`
  and `/tickets` each define inline becomes one shared component, used by
  those three screens and the dashboard. Nothing visible changes on the
  overviews.
- **Localization.** Dashboard headings, the year navigation, chart labels,
  series names and the empty state, in German and English.

## Capabilities

### New Capabilities

- `frontend/dashboard`: the authenticated `/home` screen — car cards,
  create shortcuts, car selector, year navigation and the monthly stacked
  expense chart.

### Modified Capabilities

- `api-contract/expenses`: the "Dashboard expense chart data is aggregated
  and bounded" requirement is replaced. The statistics operation returns
  the caller's expense rows within a required instant range instead of
  per-day totals.

`frontend/application-shell` does not change. Its placeholder requirement
still holds for routes that aren't implemented; `/home` just stops being
one of them.

## Impact

- **API contract:**
  - `openapi/openapi.yaml`: `/stats/expenses` uses the date-time `From` and
    `To` parameters (now required there), and `ExpenseStatistics` becomes a
    list of rows. The now-unused `FromRequired` and `ToRequired` parameters
    are removed.
  - `backend/openapi.yaml` and `frontend/src/api/schema.gen.ts` are
    regenerated.
- **Backend:** a new `internal/stats` package (handler and store), wired in
  `main.go`. No migration.
- **Frontend:**
  - `routes/_authenticated/home.tsx` becomes the dashboard route.
  - New stacked bar chart component beside `components/line-chart.tsx`.
  - New shared car selector component; the `/refuels`, `/repairs` and
    `/tickets` routes switch to it.
  - A client function and query options for the statistics operation.
  - `components/deferred-page.tsx` and its messages are removed once no
    route uses them.
  - de/en messages and tests.
- **Parity:** completes `SCR-02` and covers `EP-28`. The `SCR-02` and
  `EP-28` entries in `docs/parity-checklist.md` note how the rewrite covers
  them. `old/` is not touched.
