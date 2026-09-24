# Proposal

## Why

The backend has a Postgres connection and migration runner, and the v1 API
contract is complete, but no application data can yet be stored. A durable
schema is needed before authentication and vertical feature handlers can
implement the contract consistently.

## What Changes

- Add the initial Postgres schema for minimal accounts, cars, refuels, repairs,
  and tickets, using UUID primary keys, `numeric` financial and volume values,
  and UTC timestamps.
- Enforce ownership and lifecycle relationships: account-owned cars; expenses
  owned by cars; hard-deleting a car cascades to its expenses; no soft deletion
  columns are introduced.
- Add PostgreSQL enums for vehicle fuel, refuel fuel grade, repair type, and
  ticket type. Persist stable codes which the frontend can translate.
- Amend the v1 OpenAPI contract to enumerate the same category codes accepted
  by the database.
- Document and test the schema's nullability, constraints, timestamp handling,
  indexes, and migration behavior.
- Record a future one-time legacy-data import approach, including preflight
  reporting for unsupported or invalid source data; do not import legacy data
  in this change.

## Capabilities

### New Capabilities
- `persistence/schema`: durable ownership-scoped Postgres storage for accounts,
  cars, and expense records, including data integrity and deletion semantics.

### Modified Capabilities
- `api-contract/cars`: car fuel values are a documented finite set of stable
  codes.
- `api-contract/expenses`: refuel fuel-grade, repair-type, and ticket-type
  values are documented finite sets of stable codes.

## Impact

- **Backend**: adds embedded SQL migrations and schema migration tests under
  `backend/internal/db`; later repositories and handlers use these tables.
- **API contract**: updates `openapi/openapi.yaml` and the byte-identical
  `backend/openapi.yaml` copy with enum constraints.
- **Database**: creates application tables, PostgreSQL enum types, indexes,
  constraints, and an `updated_at` maintenance trigger on fresh databases.
- **Migration**: no current data import or changes to `old/`; a later,
  separately executed importer maps legacy rows only after preflight review.
