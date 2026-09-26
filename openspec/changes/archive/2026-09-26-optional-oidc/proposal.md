# Proposal

## Why

OIDC is currently mandatory at startup even though magic-link authentication is
a complete login method on its own. Deployments that only need magic links
should not require placeholder OIDC credentials or a reachable discovery
endpoint, and their frontend should not advertise an unavailable login method.

## What Changes

- Make `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` an optional
  all-or-none configuration group: all absent disables OIDC, all present enables
  it, and partial configuration fails startup with a clear error.
- Skip provider discovery and do not register OIDC start/callback routes when
  OIDC is disabled; magic-link and session operations remain available.
- Add a public API operation that reports the enabled authentication methods
  without exposing provider configuration or credentials.
- Make the login frontend load authentication-method availability and render
  the OIDC action only when enabled, while preserving magic-link login.
- Update environment examples, compose defaults, generated API types,
  documentation, and tests for both OIDC-enabled and magic-link-only modes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `api-contract/authentication`: document a public operation that reports
  enabled passwordless authentication methods.
- `authentication/passwordless-service`: permit magic-link-only startup and
  expose/register OIDC behavior only when the complete OIDC group is configured.
- `frontend/authentication`: offer only authentication methods reported as
  enabled by the backend.

## Impact

- **Configuration**: the three OIDC variables become optional together;
  partially configured OIDC remains invalid.
- **Backend**: conditional OIDC discovery and route registration plus one public
  read-only authentication-method endpoint.
- **API**: additive OpenAPI operation and response schema; generated frontend
  types change in lockstep.
- **Frontend**: the login page resolves method availability before presenting
  login actions and handles capability-loading failure explicitly.
- **Deployment**: compose and `.env.example` default to magic-link-only unless
  an operator supplies all three OIDC values.
