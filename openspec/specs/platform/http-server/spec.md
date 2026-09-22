# platform / http-server

## Purpose

Defines the backend's single request-routing contract — what lives under
`/api/` versus what falls back to the frontend — so every later slice
(API endpoints, auth routes) adds routes consistently and the frontend's
client-side routing keeps working on a hard refresh.

## Requirements

### Requirement: API namespace is reserved under /api/
The system SHALL mount every API endpoint under the `/api/` path prefix.
A request under `/api/` that does not match a registered API route SHALL
NOT fall back to the frontend static handler.

#### Scenario: Unknown API path
- **WHEN** a request is made to a path under `/api/` that matches no
  registered route
- **THEN** the response status is `404`, and the response body is not the
  frontend's `index.html`

### Requirement: OpenAPI document is served
The system SHALL serve `GET /api/openapi.yaml` with the exact contents of
the OpenAPI document embedded in the binary at build time.

#### Scenario: Fetching the contract
- **WHEN** `GET /api/openapi.yaml` is called
- **THEN** the response body equals the OpenAPI document embedded in the
  binary, byte for byte

### Requirement: Frontend is served with SPA fallback
The system SHALL serve the embedded frontend build for any `GET` request
outside `/api/`: the matching static file if the path corresponds to one,
or `index.html` otherwise, so client-side routes resolve on a direct
navigation or hard refresh.

#### Scenario: Static asset request
- **WHEN** `GET` is called for a path outside `/api/` that matches a file
  in the embedded frontend build
- **THEN** that file's bytes are returned with status `200`

#### Scenario: Client-side route request
- **WHEN** `GET` is called for a path outside `/api/` that matches no file
  in the embedded frontend build
- **THEN** the embedded `index.html` is returned with status `200`
