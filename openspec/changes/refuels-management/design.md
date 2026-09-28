# Design

## Context

- `refuels` already has the `(car_id, date, id)` index and reaches ownership through `cars`; car deletion cascades to it.
- Cars and repairs establish the handler/repository/store, cursor, validation, cookie-session, form, and deletion patterns.
- `/refuels/chart` exists in the contract specifically to avoid deriving consumption from cursor-paginated table data; refuel routes remain unimplemented and their shared OpenAPI references lack explicit response details.

## Goals / Non-Goals

**Goals:**
- Deliver account-wide refuel management and a price chart while preserving correct per-car consumption calculations.
- Complete the OpenAPI operations before generating clients and implementing either tier.

**Non-Goals:**
- Nested car-refuel endpoints and car-detail expenses/consumption tabs.
- Dashboard statistics, tickets, database migration, or a new paging model.

## Decisions

### D1. Follow the repairs package and ownership model

`internal/refuels` will contain a handler, repository interface, and pgx store. All queries join cars and constrain `cars.account_id`; a missing/non-owned single refuel returns `404`, while a collection filter for an unavailable car returns an empty page.

*Alternative:* duplicate `account_id` on refuels. Rejected because it needs schema churn and duplicated ownership state.

### D2. Make refuel contract operations explicit and strict

`/refuels` will declare `RefuelPage` directly and `/refuels/stations` its own `listRefuelStations` operation. Strict input schemas require a standalone `Refuel` response schema rather than `allOf` with a strict input schema. Unknown members are rejected. Litres must be positive: zero reports the common `non_positive` reason and negatives retain `negative`, preventing undefined per-litre values.

*Alternative:* allow zero and omit `perLiter`. Rejected because it violates the response shape and silently damages charts.

### D3. Separate table paging from complete chart computation

The table uses the established opaque `base64url("<RFC3339Nano date>|<id>")` keyset cursor, `(date, id)` order, and optional `carId`, `from`, and `to` filters. `/refuels/chart` applies the same ownership/filter rules but returns the complete matching order. It computes per car:

```text
perLiter    = round(amount / liters, 3)
distance    = current odometer − preceding known odometer
consumption = round(liters / distance × 100, 2)
```

Distance and consumption are absent where readings are unavailable or distance is non-positive. Table pages expose per-litre but do not attempt page-dependent consumption.

*Alternative:* derive all values from loaded table pages. Rejected because later pages lack predecessor rows.

### D4. Use independent frontend table and chart queries

The list holds an infinite table query and a separate chart query, both keyed by selected caller-owned car. The car picker comes from caller cars, not visible refuels. The running amount total reduces loaded table rows only. A shared `RefuelForm` uses a native datalist for caller-owned station suggestions and reuses `TwoStepDeleteButton`; all user-facing text and validation mappings are added in de/en.

## Risks / Trade-offs

- **A caller's unpaged chart series can be large** → Scope it by caller and accept car/date filters; dashboard aggregation is separate work.
- **Corrected odometers can prevent consumption calculation** → Return absence instead of misleading negative or infinite consumption.
- **Strict validation can break hypothetical clients** → No refuel client exists; align now with cars and repairs.

## Migration Plan

No data migration is needed. Regenerate the frontend schema from OpenAPI and deploy backend plus static frontend together. Revert the change to roll back.
