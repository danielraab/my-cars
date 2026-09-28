# Spec Delta

## MODIFIED Requirements

### Requirement: Caller can manage refuels, repairs, and tickets
The system SHALL document caller-scoped collection, create, retrieve, update, and delete operations for refuels, repairs, and tickets. Refuels SHALL include date-time, station, an optional odometer reading, fuel subtype, litres, amount, and the derived per-litre price; repairs and tickets SHALL include their legacy parity fields. Refuel fuel subtype SHALL accept only `normal`, `special`, and `other`; repair type SHALL accept only `check`, `service`, `wearing_part`, and `crash_repair`; ticket type SHALL accept only `parking`, `velocity`, and `other`. Updates SHALL apply every supplied valid field, including `0`, `false`, and empty optional text, rather than ignoring falsy values. `RepairInput` and `RepairUpdate` SHALL reject any request member outside their documented properties with `400` and the common validation error representation identifying the offending member.

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
- **WHEN** an authenticated caller submits or updates an expense with a category
  value outside its documented codes
- **THEN** the response is `400` with the common validation error representation

#### Scenario: Caller supplies an undocumented repair field
- **WHEN** an authenticated caller submits a repair creation or update
  request with a member outside `RepairInput`/`RepairUpdate`'s documented
  properties
- **THEN** the response is `400` with the common validation error
  representation identifying that member, and no repair is created or
  changed
