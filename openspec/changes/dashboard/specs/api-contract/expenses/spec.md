# Spec Delta

## ADDED Requirements

### Requirement: Dashboard expense data is bounded by an instant range
The system SHALL document an expense-statistics query that requires a `from` and a `to` date-time and accepts an optional caller-owned car filter. `from` SHALL be inclusive and `to` exclusive, the same as the expense collections' range. The response SHALL contain every refuel, repair and ticket of the caller's cars dated within the range, each as a row with its date-time, its kind (`refuel`, `repair` or `ticket`) and its amount, ordered by date, in a single unpaged response. The response SHALL NOT group rows into days or other calendar buckets, because only the client knows the viewer's time zone. A missing or malformed `from` or `to`, or a malformed car filter, SHALL be rejected with `400` and the common validation error representation identifying the parameter. A car filter naming a car the caller does not own SHALL return no rows.

#### Scenario: Caller requests a year of expenses
- **WHEN** an authenticated caller requests statistics with `from` and `to` bounding one year
- **THEN** the response contains a row for each of that caller's refuels, repairs and tickets dated on or after `from` and before `to`, ordered by date, with its kind and amount

#### Scenario: Expense at the range boundary
- **WHEN** an expense is dated exactly at `to`
- **THEN** it is not in the response, and an expense dated exactly at `from` is

#### Scenario: Caller filters by car
- **WHEN** an authenticated caller requests statistics with the ID of one of their cars
- **THEN** the response contains only that car's expenses within the range

#### Scenario: Caller filters by another account's car
- **WHEN** an authenticated caller requests statistics with the ID of a car they do not own
- **THEN** the response is `200` with no rows

#### Scenario: Caller omits the range
- **WHEN** an authenticated caller requests statistics without `from` or without `to`
- **THEN** the response is `400` with the common validation error representation identifying the missing parameter

#### Scenario: Another account's expenses are excluded
- **WHEN** another account has expenses within the requested range
- **THEN** none of them appear in the caller's response

## REMOVED Requirements

### Requirement: Dashboard expense chart data is aggregated and bounded
**Reason**: Per-day totals over a calendar-date range can't be computed correctly on the server, which doesn't know the viewer's time zone; expenses are stored as instants.
**Migration**: Use the "Dashboard expense data is bounded by an instant range" requirement: request `from`/`to` instants for the viewer's local range and group the returned rows on the client. The old shape was never implemented, so no client depends on it.
