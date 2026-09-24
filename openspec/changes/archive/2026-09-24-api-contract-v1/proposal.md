# Proposal

## Why

The rewrite has a running backend foundation, but its OpenAPI document is an
empty placeholder. The legacy API is the only current record of resource
shapes and behaviour, while it also contains deliberate replacements and
known pagination conflicts. A versioned contract is needed before schema,
authentication, backend, and frontend slices can be implemented consistently.

## What Changes

- Replace the placeholder OpenAPI 3.1 document with the v1 REST contract for
  cars, refuels, repairs, tickets, expense statistics, profile data, scoped
  autocomplete suggestions, and authentication/session flows.
- Define cookie-based OIDC and magic-link authentication in place of the
  legacy password, JWT, refresh-token, verification, and reset endpoints.
- Define common resource, validation, error, date-time, money, identifier,
  ownership, and cursor-pagination conventions.
- Resolve the parity checklist's pagination conflicts with server-side car
  filtering and chart/derived-refuel data that remains complete across list
  page boundaries.
- Add automated validation for the root OpenAPI source document and retain its
  served copy in the backend build.

## Capabilities

### New Capabilities
- `api-contract/common`: versioning, wire-format, error, ownership, and cursor
  pagination conventions shared by v1 endpoints.
- `api-contract/authentication`: OIDC, magic-link, and cookie-session API
  behaviour.
- `api-contract/profile`: caller profile retrieval and update behaviour.
- `api-contract/cars`: car CRUD and ownership-scoped car expense collections.
- `api-contract/expenses`: refuel, repair, ticket, suggestion, derived-value,
  and expense-statistics API behaviour.

### Modified Capabilities
- None.

## Impact

- **API**: establishes the source-of-truth v1 OpenAPI document under
  `openapi/openapi.yaml`, served by the backend at `/api/openapi.yaml`.
- **Backend and frontend**: later `db-schema-v1`, authentication, and feature
  verticals implement and consume these shapes; this change does not add domain
  persistence or runtime feature handlers.
- **Tooling**: adds an OpenAPI validation step to local and CI checks.
- **Parity**: maps the retained behaviour in `EP-07`–`EP-35` and `DRV-01`–
  `DRV-03`; `NG-01`, `NG-02`, `NG-03`, `NG-05`, and `NG-06` guide intentional
  departures from the legacy API.
