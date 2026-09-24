# Design

## Context

See `proposal.md` — Why. The backend already opens a `pgxpool.Pool` and embeds
SQL migrations through `golang-migrate`; its migration directory currently has
only the migration tool's bookkeeping effect. The API contract establishes UUID
resources, decimal strings, date/date-time wire formats, ownership scoping, and
hard deletion of a car's dependent expenses. The legacy database is read-only
reference material and is not an input to this change.

## Goals / Non-Goals

**Goals:**

- Create an enforceable, queryable initial domain schema on a fresh Postgres
  database.
- Give the later authentication change a minimal account record to resolve an
  email address to, without committing to a particular identity provider or
  session representation.
- Keep a future one-time legacy import feasible and auditable.

**Non-Goals:**

- Implement authentication identities, OIDC state, magic links, sessions,
  email delivery, repositories, API handlers, or frontend controls.
- Import, transform, or modify any legacy data.
- Add account deletion, soft deletion, audit history, or category management.

## Decisions

### A minimal account table precedes authentication-specific tables

`accounts` contains a generated UUID, normalized unique email, first and last
name (non-null, default empty string), and creation/update timestamps. Cars
reference it with a non-null foreign key. Identity-provider subject mappings,
magic-link secrets, sessions, and expiry/cleanup policy belong to
`auth-oidc-magic-link`.

Email is stored normalized to lowercase and protected by a uniqueness constraint
on that canonical value. This makes the contract's same-normalized-email account
rule structural rather than dependent on every caller remembering case handling.
Postgres `citext` was rejected because application normalization is still needed
for a defined canonical response value and a functional/normalized text index
avoids an extension dependency.

### SQL types follow API semantics rather than legacy implementation types

All application IDs use `uuid` with `pgcrypto` UUID generation. API calendar
dates map to `date`; event and audit timestamps map to `timestamptz`; money and
litres map to unconstrained `numeric`; odometer readings map to nullable
`bigint`. The legacy numeric IDs, `FLOAT` values, and timezone-ambiguous date
columns are not carried forward.

`numeric` is intentionally unconstrained so the database does not silently
round decimal values the API contract permits. Application validation can later
set display or operational limits without changing stored precision.

### Domain constraints protect invariants, not workflow assumptions

Required strings are non-null and nonblank. Amounts are non-negative; litres
are positive; supplied odometer readings are non-negative. Optional FIN,
purchase date, and purchase price remain independently nullable. The database
does not enforce future-date restrictions, uniqueness of plates or FINs, a
purchase-date/price dependency, or monotonic odometer readings: all can be
validly absent, corrected, reused, or backdated in real data.

Every mutable table uses a shared database trigger to update `updated_at`; this
prevents drift among future handler/repository implementations. Application-side
timestamp updates were rejected because every write path would need to remember
the invariant.

### Categories use PostgreSQL enum types with localization-safe codes

The migration defines `vehicle_fuel`, `refuel_fuel`, `repair_type`, and
`ticket_type` enum types. Their values are respectively `other`, `diesel`,
`gasoline`, `electric`; `normal`, `special`, `other`; `check`, `service`,
`wearing_part`, `crash_repair`; and `parking`, `velocity`, `other`. These are
stored codes, not translated labels; the frontend owns German and English
translations. The OpenAPI enum definitions change in lockstep.

Lookup tables were rejected because these are a fixed initial vocabulary with
no category-management feature. Free text was rejected because it permits
inconsistent values and makes localization unreliable.

### Hard deletion is expressed through foreign keys

Cars reference accounts with `ON DELETE RESTRICT`. Refuels, repairs, and tickets
reference cars with `ON DELETE CASCADE`, preserving `EP-11`. No `deleted_at`
columns are created; individual expense deletes remain permanent. Account
deletion has no current product contract and is deliberately deferred.

### Indexes match the documented collection access patterns

Cars use `(account_id, created_at, id)` for owner-scoped cursor order. Each
expense table uses `(car_id, date, id)` for owned-car date traversal; its
primary key supports individual lookup. Additional global, suggestion, or
statistics indexes are deferred until handlers provide query plans to validate.

### Legacy import is a later all-or-nothing operation

This migration creates no import tool or mapping table. The future importer
first produces a preflight report, then runs in a transaction only after review.
It generates UUID mappings; maps `carMake` to `make`, `liter` to `liters`, and
the known legacy category labels to enum codes; and resolves legacy timestamps
with an explicit source-timezone choice. Password hashes, refresh tokens, and
legacy verification/reset tokens are intentionally not portable to the new OIDC
and magic-link model.

Unknown categories, duplicate normalized emails, invalid required values,
negative/non-finite floats, and timezone ambiguity must be reported rather than
coerced. Any remediation policy requires a future approved change.

## Risks / Trade-offs

- [A future category needs a database migration and contract update] → Accepted
  in exchange for a finite, localizable vocabulary; add it through OpenSpec.
- [Unconstrained `numeric` admits impractically large values] → handler-level
  validation can introduce operational bounds without precision loss.
- [Database triggers add migration complexity] → cover insert/update behavior
  with integration tests against Postgres.
- [No import happens now] → retain an explicit mapping/preflight design so the
  schema does not preclude the planned one-time migration.

## Migration Plan

1. Add an additive embedded migration that enables the required UUID extension,
   creates enums, tables, trigger function/triggers, constraints, and indexes.
2. Run backend migration tests against a clean Postgres database and confirm
   rerunning migrations is a no-op.
3. Deploy normally: the existing startup migration runner applies the schema
   before the HTTP server accepts traffic. No handlers expose it yet.
4. Roll back only before domain data is written by reverting the deployment and
   applying the corresponding down migration. Once data exists, use a forward
   corrective migration rather than dropping production tables.
