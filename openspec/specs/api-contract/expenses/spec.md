# api-contract/expenses Specification

## Purpose

Defines caller-scoped expense records, autocomplete data, and complete chart data that preserve legacy expense and consumption behaviour under pagination.

## Requirements

### Requirement: Caller can manage refuels, repairs, and tickets
The system SHALL document caller-scoped collection, create, retrieve, update, and delete operations for refuels, repairs, and tickets. Refuels SHALL include date-time, station, an optional odometer reading, fuel subtype, litres, amount, and the derived per-litre price; repairs and tickets SHALL include their legacy parity fields. Refuel fuel subtype SHALL accept only `normal`, `special`, and `other`; repair type SHALL accept only `check`, `service`, `wearing_part`, and `crash_repair`; ticket type SHALL accept only `parking`, `velocity`, and `other`. Refuel litres MUST be greater than zero. Updates SHALL apply every supplied valid field, including `0`, `false`, and empty optional text, rather than ignoring falsy values. `RefuelInput`, `RefuelUpdate`, `RepairInput`, `RepairUpdate`, `TicketInput`, and `TicketUpdate` SHALL reject request members outside their documented properties with `400` and the common validation error representation identifying the offending member. The refuel and ticket collections SHALL each return an explicit cursor page ordered by date then ID. The refuel station suggestion operation and the ticket location suggestion operation SHALL each have their own operation identifier and a string-array response. A ticket representation SHALL always contain every documented member, with an empty description when none was recorded.

#### Scenario: Caller updates an amount to zero
- **WHEN** an authenticated caller patches an owned expense amount to `0`
- **THEN** the response contains the updated amount of `0`

#### Scenario: Caller creates an expense for an owned car
- **WHEN** an authenticated caller submits a valid expense creation request for an owned car
- **THEN** the response is `201` with that expense linked to the requested car

#### Scenario: Caller omits an odometer reading
- **WHEN** an authenticated caller submits a valid expense without an odometer reading
- **THEN** the response represents the expense with an absent odometer reading

#### Scenario: Caller supplies an unsupported expense category
- **WHEN** an authenticated caller submits or updates an expense with a category value outside its documented codes
- **THEN** the response is `400` with the common validation error representation

#### Scenario: Caller supplies zero litres
- **WHEN** an authenticated caller creates or updates a refuel with `liters` equal to zero
- **THEN** the response is `400` with `fields.liters` set to `non_positive`

#### Scenario: Caller supplies an undocumented refuel field
- **WHEN** an authenticated caller submits a refuel creation or update request with an undocumented member
- **THEN** the response is `400` identifying that member, and no refuel is created or changed

#### Scenario: Caller supplies an undocumented repair field
- **WHEN** an authenticated caller submits a repair creation or update request with a member outside `RepairInput`/`RepairUpdate`'s documented properties
- **THEN** the response is `400` with the common validation error representation identifying that member, and no repair is created or changed

#### Scenario: Caller supplies an undocumented ticket field
- **WHEN** an authenticated caller submits a ticket creation or update request with a member outside `TicketInput`/`TicketUpdate`'s documented properties
- **THEN** the response is `400` with the common validation error representation identifying that member, and no ticket is created or changed

#### Scenario: Caller pages through tickets
- **WHEN** an authenticated caller lists tickets and the response carries a non-null `nextCursor`
- **THEN** requesting the collection with that cursor returns the following tickets in date-then-ID order, and the last page carries a `null` `nextCursor`

#### Scenario: Caller clears a ticket description
- **WHEN** an authenticated caller patches an owned ticket's `description` to the empty string
- **THEN** the response contains the ticket with an empty `description`, and every other member unchanged

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
