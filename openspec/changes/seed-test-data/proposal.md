# Proposal

## Why

Development and UI testing need realistic, multi-year data across multiple accounts without manually creating thousands of records. A repeatable CLI reset makes it easy to start from a known dataset.

## What Changes

- Add a backend `seed` subcommand requiring one or more email addresses.
- Replace all application rows with per-account sample cars, refuels, repairs, and tickets spanning the last five years.
- Document the destructive command and its database configuration.

## Capabilities

### New Capabilities

- `platform/test-data-seeding`: CLI validation, atomic reset, and multi-account data distribution.

### Modified Capabilities

None.

## Impact

Backend command dispatch, Postgres seed logic, backend documentation and tests. No REST API or schema change.
