# Proposal

## Why

`/cars/{carId}` (`SCR-11`) only has the **Details** tab. Cars-management
deferred the legacy **Expenses** and **Consumption** tabs until all three
expense verticals existed. Refuels, repairs and tickets are now done, and
their collections, plus `GET /refuels/chart`, already accept `carId`,
`from` and `to`. The data the tabs need is available, so SCR-11 is the next
parity slice.

The contract still carries an unimplemented placeholder for these tabs:
`/cars/{carId}/{refuels,repairs,tickets}` via `CarExpenseCollection`, with
an untyped `200`. The car-filtered collections already cover it.

## What Changes

- **Car detail tabs.** `/cars/{carId}` becomes a three-tab screen:
  **Details**, **Expenses** and **Consumption**. The selected tab is kept
  in the URL (`?tab=`), so each tab can be linked to and the back button
  works.
- **Shared date range.** Expenses and Consumption share a date-range filter
  with plain dates (`?from=` / `?to=`). `from` defaults to six months before
  today and `to` is open. The backend does the filtering: both the "to" day
  and the "from" day are included in full.
- **Expenses tab.** It shows the car's refuels, repairs and tickets in three
  paginated tables without a car column. Each table has an "add new" link
  that preselects the car. There are no amount totals.
- **Consumption tab.** It draws a line chart of the car's consumption
  (`DRV-03`) over the selected range, fed by the complete chart series
  rather than table pages.
  - **Intentional difference from legacy:** legacy charted the car's whole
    history. The range defaults to six months and can be widened.
- **Chart consumption across a `from` bound (fix).** Today, when
  `GET /refuels/chart` gets a `from` bound, the first refuel in range loses
  its distance and consumption. That breaks the existing
  `api-contract/expenses` requirement. The chart now works out each
  refuel's predecessor even when that predecessor is before `from`.
- **BREAKING (contract only; never implemented):** remove
  `/cars/{carId}/refuels`, `/cars/{carId}/repairs`, `/cars/{carId}/tickets`
  and the `CarExpenseCollection` pathItem. The car-filtered `GET /refuels`,
  `/repairs`, `/tickets` and `/refuels/chart` operations cover `EP-12`,
  `EP-14` and `EP-16`.
- **Shared frontend pieces** (internal refactor, no visible change on
  existing pages):
  - The refuel, repair and ticket tables are pulled out of their list
    routes, so the list routes and the Expenses tab render the same tables.
  - The SVG plotting is pulled out of the fuel-price chart into a shared
    line chart used by the fuel-price and consumption charts.
- **Localization.** Tab labels, filter labels, section headings, and the
  consumption chart's labels and empty state are added in German and
  English.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `frontend/cars`:
  - The car detail requirement no longer forbids expense and consumption
    views.
  - New requirements for the tab structure, the shared date range, the
    Expenses tab and the Consumption tab.
- `api-contract/cars`: removes the "Caller can retrieve a car's paginated
  expenses" requirement. The car-filtered expense collections replace it.
- `api-contract/expenses`: the chart-completeness requirement adds a
  scenario for a predecessor that is earlier than the requested `from`.

## Impact

- **API contract:**
  - `openapi/openapi.yaml` loses three paths and the `CarExpenseCollection`
    pathItem.
  - `backend/openapi.yaml` and `frontend/src/api/schema.gen.ts` are
    regenerated.
- **Backend:**
  - `internal/refuels`: the chart query also returns, for each car, the last
    odometer reading before `from`, and the handler uses it as that car's
    starting predecessor.
  - No new routes and no migration.
- **Frontend:**
  - `routes/_authenticated/cars/$carId/index.tsx`: tabs, search params and
    the date-range control.
  - New `RefuelTable`, `RepairTable` and `TicketTable` components; the
    `/refuels`, `/repairs` and `/tickets` routes switch to them.
  - A shared `LineChart`. `FuelPriceChart` is rebuilt on it, and a new
    `ConsumptionChart` is added.
  - Car-filtered, date-bounded query options for repairs and tickets.
  - de/en messages and tests.
- **Parity:** completes `SCR-11`; covers `EP-12`, `EP-14`, `EP-16` (through
  the car-filtered collections) and `DRV-03` on the Consumption tab.
- **Deferred, not non-goals:** the dashboard expense chart (`SCR-02`,
  `EP-28`) is the remaining parity slice.
