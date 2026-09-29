# Proposal

## Why

Cars and repairs are now working authenticated vertical slices, but refuels
remain a placeholder despite being the source of the legacy app's fuel-price
and consumption views. Refuels are the next slice because their derived values
must remain correct when the table is cursor-paginated.

## What Changes

- Implement caller-scoped list, create, retrieve, update, delete, and station
  suggestion operations for refuels behind the existing cookie session.
- Document the `/refuels` collection response and station-suggestion operation
  directly, and make `RefuelInput` and `RefuelUpdate` reject undocumented
  request members, matching the cars and repairs contracts.
- Implement the documented `/refuels/chart` query, returning a complete,
  filtered refuel series with server-computed per-litre price, distance, and
  consumption so chart values do not break at table-page boundaries.
- Replace the `/refuels` placeholder with localized list, create, and edit
  screens, including fuel-price charting, car filtering, station autocomplete,
  a running total for loaded table rows, and two-step deletion.
- Keep the car detail page's expenses and consumption tabs, dashboard expense
  chart, and ticket management out of scope for later slices.

## Capabilities

### New Capabilities
- `frontend/refuels`: Authenticated, localized refuel list, creation, and edit
  screens with their list and chart behaviour.

### Modified Capabilities
- `api-contract/expenses`: Specify strict refuel request validation and the
  response and operation details required to implement the refuel collection,
  suggestions, and complete chart query.
- `api-contract/common`: Define the validation reason for zero litres, which
  cannot produce a per-litre price.

## Impact

- **API contract:** `openapi/openapi.yaml`, its backend copy, and generated
  frontend schema gain the completed refuel operation definitions.
- **Backend:** a caller-scoped `internal/refuels` handler and PostgreSQL store
  are registered alongside cars and repairs.
- **Frontend:** new authenticated refuel routes, API client/query helpers,
  form and chart components, de/en messages, and tests.
- **Database:** no migration; the existing `refuels` table and `(car_id, date,
  id)` index are used.
- **Parity:** covers `SCR-13`, `SCR-14`, `SCR-15`; `EP-13`, `EP-18`–`EP-22`;
  and `DRV-01`–`DRV-03`. `EP-12` remains deferred with the car-detail expense
  tabs.
