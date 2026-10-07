# Spec Delta

## ADDED Requirements

### Requirement: Rate-limited authentication responses are documented
The contract SHALL document a `429` response with a `Retry-After` header and
the standard error body (code `rate_limited`) for the magic-link request and
the passkey login operations, and a redirect to
`/auth/login?error=rate_limited` for magic-link consumption, OIDC start, and
OIDC callback.

#### Scenario: Client reads the magic-link request contract
- **WHEN** a client inspects the magic-link request operation
- **THEN** it documents `429` with `Retry-After` and error code `rate_limited`

#### Scenario: Client reads the OIDC start contract
- **WHEN** a client inspects the OIDC start operation
- **THEN** it documents the redirect to the login route with `error=rate_limited`
