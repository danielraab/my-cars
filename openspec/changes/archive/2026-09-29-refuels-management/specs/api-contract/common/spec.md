# Spec Delta

## MODIFIED Requirements

### Requirement: API uses common resource and error representations
The system SHALL represent identifiers as UUID strings, timestamps as RFC 3339 date-times, calendar dates as RFC 3339 full-date strings, and monetary amounts as decimal strings. Every non-success response SHALL use one documented error schema containing a stable machine-readable `code` and a human-readable `message`; validation failures SHALL additionally identify invalid fields. Each field detail SHALL use a documented reason, including `read_only`, `unknown`, `invalid_type`, `too_long`, `required`, `empty`, `invalid_enum`, `invalid_date`, `invalid_decimal`, `negative`, and `non_positive` for a numeric value that must be greater than zero.

#### Scenario: Invalid request is rejected
- **WHEN** a client submits a request that violates a documented field constraint
- **THEN** the response is `400` with the common error representation and field details

#### Scenario: Refuel litres is zero
- **WHEN** a refuel request supplies zero litres
- **THEN** the API returns `400` with `fields.liters` set to `non_positive`
