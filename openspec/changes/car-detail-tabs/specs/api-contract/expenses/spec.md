# Spec Delta

## MODIFIED Requirements

### Requirement: Refuel data required for consumption and price charts is complete
The system SHALL document a chart-oriented refuel query, separately from the paginated table collection, that returns all matching caller-owned refuels in date order with server-computed `perLiter`, `distance`, and `consumption`. `distance` and `consumption` SHALL be absent only for a car's first applicable refuel, not because a table page begins after its predecessor, and not because the predecessor lies before the query's `from` bound.

#### Scenario: Refuel follows a prior page boundary
- **WHEN** a chart query includes a refuel whose predecessor is outside a table page
- **THEN** that refuel's distance and consumption are computed from its actual prior refuel for the same car

#### Scenario: Refuel's predecessor lies before the requested range
- **WHEN** a chart query with a `from` bound includes a car's first refuel on or after `from`, and that car has an earlier refuel with an odometer reading before `from`
- **THEN** the response contains only refuels within the range, and that first refuel's distance and consumption are computed from the earlier refuel's odometer reading

#### Scenario: Car's first refuel ever
- **WHEN** a chart query includes a car's earliest refuel with an odometer reading
- **THEN** that refuel has no distance and no consumption
