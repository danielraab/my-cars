# Proposal

## Why

The v1 API contract and domain schema define passwordless authentication, but
the backend has no way to authenticate a caller or establish an account-scoped
browser session. Implementing this now unlocks protected API handlers and the
frontend migration without carrying forward the legacy password/JWT design.

## What Changes

- Add backend OIDC authorization-code login with discovery, state and PKCE
  protection, callback validation, and verified-email account resolution.
- Add magic-link request and consumption flows, SMTP delivery, opaque
  single-use tokens, expiry, and account resolution without email enumeration.
- Add durable authentication identities, login challenges, and server-side
  sessions, including expiry and cleanup behavior.
- Establish and clear authenticated browser sessions exclusively through a
  secure HttpOnly cookie; implement current-session and logout operations.
- Add the OIDC runtime configuration documented by the existing environment
  template and validate configuration at startup.
- Add backend integration and HTTP tests for successful flows, account
  convergence, invalid/expired/replayed credentials, and session lifecycle.

## Capabilities

### New Capabilities
- `authentication/passwordless-service`: backend OIDC and magic-link flows,
  account identity resolution, durable server-side sessions, and secure
  browser-cookie lifecycle.

### Modified Capabilities
- None.

## Impact

- **Backend**: new authentication packages, database migration, HTTP routes and
  middleware, SMTP integration, OIDC client/discovery dependency, configuration,
  and tests.
- **Database**: additive tables for OIDC identities, one-time login challenges,
  and server-side sessions associated with existing `accounts` rows.
- **API**: implements the existing `api-contract/authentication` OpenAPI
  endpoints; no password or bearer-token endpoints are added.
- **Frontend**: no login UI is introduced in this change; browser redirects and
  cookie sessions provide the integration foundation for its later migration.
