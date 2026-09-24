# Spec Delta

## Purpose

Defines the stable, secure, and predictable wire conventions shared by every version-one REST endpoint consumed by the static frontend.

## ADDED Requirements

### Requirement: Version-one API has documented, typed representations
The system SHALL define every v1 REST operation, request body, response body, security requirement, path parameter, and success/error status in the OpenAPI 3.1 source document at `openapi/openapi.yaml`. All API routes other than the existing platform routes SHALL be rooted at `/api/v1`.

#### Scenario: Consumer retrieves the contract
- **WHEN** a consumer requests `GET /api/openapi.yaml`
- **THEN** it receives the OpenAPI document defining the v1 operations

### Requirement: API uses common resource and error representations
The system SHALL represent identifiers as UUID strings, timestamps as RFC 3339 date-times, calendar dates as RFC 3339 full-date strings, and monetary amounts as decimal strings. Every non-success response SHALL use one documented error schema containing a stable machine-readable `code` and a human-readable `message`; validation failures SHALL additionally identify invalid fields.

#### Scenario: Invalid request is rejected
- **WHEN** a client submits a request that violates a documented field constraint
- **THEN** the response is `400` with the common error representation and field details

### Requirement: Collection endpoints use cursor pagination and server filters
The system SHALL return collection responses as `{ items, nextCursor }`, accept an opaque `cursor` and a bounded `limit`, and use a documented deterministic ordering with a unique identifier as its tie-breaker. Expense collection endpoints SHALL accept an optional `carId` filter; clients SHALL NOT need to derive the available-car filter from a loaded page.

#### Scenario: Client follows a collection cursor
- **WHEN** a client requests a collection with the `nextCursor` returned by a prior page
- **THEN** it receives the subsequent items in the documented order without duplicates

#### Scenario: Client filters an expense collection by car
- **WHEN** a client requests a caller-owned car ID on an expense collection
- **THEN** the response contains only records for that car

### Requirement: Protected resources are scoped to the session account
The system SHALL require the documented cookie session for protected operations and SHALL expose only the authenticated account's profile, cars, expenses, and suggestions. An absent or invalid session SHALL produce `401`; a resource owned by another account SHALL not be disclosed and SHALL produce `404`.

#### Scenario: Caller requests another account's resource
- **WHEN** an authenticated caller requests a resource owned by a different account
- **THEN** the response is `404` using the common error representation
