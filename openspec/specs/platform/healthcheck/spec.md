# platform / healthcheck

## Purpose

Lets the container runtime and anyone operating the service determine
whether the backend is ready to serve traffic, without a separate HTTP
client being available inside the runtime image.

## Requirements

### Requirement: Health endpoint reports readiness
The system SHALL expose `GET /api/healthz`. It SHALL respond `200` when the
database is reachable and `503` when it is not. It SHALL respond `405` to
any other HTTP method on that path.

#### Scenario: Database reachable
- **WHEN** `GET /api/healthz` is called and the database connection pool
  can execute a query
- **THEN** the response status is `200`

#### Scenario: Database unreachable
- **WHEN** `GET /api/healthz` is called and the database connection pool
  cannot execute a query
- **THEN** the response status is `503`

#### Scenario: Wrong method
- **WHEN** a request other than `GET` is made to `/api/healthz`
- **THEN** the response status is `405`

### Requirement: CLI healthcheck subcommand mirrors the HTTP contract
The system SHALL support being invoked with `healthcheck` as its first
argument. In that mode it SHALL probe its own `/api/healthz` over HTTP on
the configured port, exit with status `0` if that probe returned `200`, and
exit with a non-zero status for any other response or if the probe could
not connect.

#### Scenario: Server healthy
- **WHEN** the binary is run as `server healthcheck` against a server whose
  `/api/healthz` responds `200`
- **THEN** the subcommand exits with status `0`

#### Scenario: Server unhealthy or unreachable
- **WHEN** the binary is run as `server healthcheck` against a server whose
  `/api/healthz` responds with a non-`200` status, or no server is
  listening on the configured port
- **THEN** the subcommand exits with a non-zero status
