# Design

## Context

The backend foundation serves `GET /api/openapi.yaml`, but the root source
document contains no application operations. The parity checklist inventories
the legacy routes and explicitly assigns cursor-pagination, filter, and chart
conflicts to this change. The frontend is static and the target authentication
model is OIDC plus magic link, not the legacy JWT/password model.

## Goals / Non-Goals

**Goals:**

- Make `openapi/openapi.yaml` the complete OpenAPI 3.1 source of truth for the
  first application API version.
- Specify a coherent contract that later backend and frontend slices can use
  without re-deciding shared conventions.
- Preserve the observable legacy product behaviour while deliberately applying
  the established non-goals.

**Non-Goals:**

- Implement database tables, session storage, email delivery, OIDC provider
  integration, domain handlers, or frontend screens.
- Preserve legacy password/JWT wire formats, cross-user suggestions, unpaged
  collections, numeric IDs, or truthy-only updates.
- Generate a client SDK; consumers use the validated OpenAPI document directly
  until a later change explicitly introduces generation.

## Decisions

### One OpenAPI source document with reusable components

`openapi/openapi.yaml` is the authored source and defines `/api/v1` paths,
schemas, cookie security, reusable pagination parameters, and the shared error
response. The Docker build continues to copy this file into the backend before
embedding it; the committed backend copy is kept byte-identical for local Go
builds.

Keeping one YAML document makes the published endpoint and CI validation test
the same contract. Splitting by domain was considered, but adds bundling and
reference-resolution complexity before the API has any generated consumers.

### UUID resources, ISO temporal fields, and decimal money

New resource IDs use UUID strings. Dates use `date`, instants use RFC 3339
`date-time`, and money is serialized as a decimal string. This avoids legacy
database-integer leakage, timezone ambiguity, and binary floating-point money
values. JSON numeric money was rejected because it reintroduces precision loss;
integer minor units were rejected because values may have more than two decimal
places in legacy data and complicate displayed decimal inputs.

### Cursor pagination is based on documented stable orders

Every list returns `items` and nullable `nextCursor`; cursors are opaque. Cars
are ordered by creation time then ID. Time-based expenses are ordered by date
then ID. The `limit` has a documented default and maximum. Refuel, repair, and
ticket lists accept `carId`, `from`, and `to` query parameters, so filtering is
performed before pagination.

Offset pagination was rejected because inserts/deletes make pages unstable; an
unpaged compatibility path violates `NG-05`.

### Charts use dedicated complete queries

Table endpoints remain paginated. A refuel chart query returns the selected
range's full ordered refuel series with `perLiter`, `distance`, and
`consumption` computed by the server. The statistics query returns bounded,
date-bucketed totals by expense category. This means no chart depends on the
pages a table happens to have loaded.

Having the frontend accumulate all cursor pages was rejected because it
silently recreates unbounded fetching. Returning a predecessor hint was
rejected because it leaves correctness logic and calculation semantics split
between client and server.

### Session routes use redirects and HttpOnly cookies

The contract uses OIDC start/callback routes, magic-link request/consume routes,
`GET /api/v1/session`, and `DELETE /api/v1/session`. Successful browser flows
set an HttpOnly, Secure, SameSite session cookie and redirect to an allowed
frontend path. The backend maps verified normalized email addresses to accounts
so either sign-in method reaches the same account.

Returning bearer tokens was rejected because `NG-06` prohibits browser token
storage. Authenticated profile access is `GET/PATCH /api/v1/me`, rather than a
caller-supplied user ID, which removes an unnecessary authorization surface.

### Contract-only delivery with validation

This change adds a reproducible OpenAPI validation command to the repository's
existing checks. Validation verifies OpenAPI 3.1 syntax and resolved local
references; a small regression test verifies that the root source and the
backend's embedded copy match. Handler conformance tests are deferred to the
changes that implement each route.

## Risks / Trade-offs

- [An unlimited chart range can still be expensive] → The contract requires an
  explicit range and later handlers enforce documented maximum spans.
- [Cookie sessions need cross-site request protection] → Cookie attributes and
  state-changing-request protection are specified before session implementation.
- [A copied backend document can drift from the source] → CI compares the two
  files and the Docker build copies the source immediately before compilation.
- [Legacy data uses floats and numeric IDs] → `db-schema-v1` includes an
  explicit import/mapping decision before any production data migration.

## Migration Plan

1. Author and validate the OpenAPI document and synchronize its backend copy.
2. Merge the contract before schema, auth, and feature implementation changes.
3. Implement routes incrementally against this contract; contract changes use
   a later OpenSpec change rather than undocumented handler changes.
4. If the contract must be rolled back before implementation begins, restore
   the placeholder document and remove the validation dependency; no persisted
   data or browser session is affected.
