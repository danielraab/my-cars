# api-contract/expenses Specification

## Purpose

Defines caller-scoped expense records, autocomplete data, and complete chart data that preserve legacy expense and consumption behaviour under pagination.

## Requirements

### Requirement: Caller can manage refuels, repairs, and tickets
The system SHALL document caller-scoped collection, create, retrieve, update, and delete operations for refuels, repairs, and tickets. Refuels SHALL include date-time, station, odometer reading, fuel subtype, litres, amount, and the derived per-litre price; repairs and tickets SHALL include their legacy parity fields. Updates SHALL apply every supplied valid field, including `0`, `false`, and empty optional text, rather than ignoring falsy values.

#### Scenario: Caller updates an amount to zero
- **WHEN** an authenticated caller patches an owned expense amount to `0`
- **THEN** the response contains the updated amount of `0`

#### Scenario: Caller creates an expense for an owned car
- **WHEN** an authenticated caller submits a valid expense creation request for an owned car
- **THEN** the response is `201` with that expense linked to the requested car

### Requirement: Suggestions are restricted to the caller's data
The system SHALL document station and ticket-location suggestion operations whose results are drawn only from the authenticated caller's expense records, are distinct values, and are ordered lexically.

#### Scenario: Caller requests station suggestions
- **WHEN** an authenticated caller requests station suggestions
- **THEN** the response contains no station value contributed solely by another account

### Requirement: Refuel data required for consumption and price charts is complete
The system SHALL document a chart-oriented refuel query, separately from the paginated table collection, that returns all matching caller-owned refuels in date order with server-computed `perLiter`, `distance`, and `consumption`. `distance` and `consumption` SHALL be absent only for a car's first applicable refuel, not because a table page begins after its predecessor.

#### Scenario: Refuel follows a prior page boundary
- **WHEN** a chart query includes a refuel whose predecessor is outside a table page
- **THEN** that refuel's distance and consumption are computed from its actual prior refuel for the same car

### Requirement: Dashboard expense chart data is aggregated and bounded
The system SHALL document an expense-statistics query with an explicit date range and optional caller-owned car filter. It SHALL return date-bucketed refuel, repair, and ticket monetary totals suitable for the dashboard chart, rather than requiring clients to fetch unbounded raw expense lists.

#### Scenario: Caller requests a dashboard range
- **WHEN** an authenticated caller requests statistics for a valid date range
- **THEN** the response returns only that caller's categorized totals within the range
