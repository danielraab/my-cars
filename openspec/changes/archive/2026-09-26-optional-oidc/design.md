# Design

## Context

See `proposal.md` for motivation. Backend configuration currently requires all
three OIDC variables, validates the issuer unconditionally, performs discovery
unconditionally during startup, and always registers OIDC routes. The static
frontend always renders OIDC and magic-link actions and has no runtime channel
for deployment-specific method availability.

The OpenAPI contract is the shared source of truth, and the frontend already
generates TypeScript types from it. Magic-link SMTP configuration remains
mandatory and is not part of this change.

## Goals / Non-Goals

**Goals:**

- Allow a deployment to run with magic links and no OIDC configuration.
- Fail fast on accidental partial OIDC configuration.
- Keep frontend method presentation aligned with backend runtime behavior.
- Avoid disclosing provider details through method discovery.

**Non-Goals:**

- Make SMTP or magic-link authentication optional.
- Support multiple OIDC providers, public OIDC clients without a secret, or
  runtime configuration reloads.
- Remove OIDC database tables or migrate existing identity data when OIDC is
  disabled.

## Decisions

### Treat OIDC values as an all-or-none optional group

Configuration reads all three variables independently of the required-variable
loop. Zero values means disabled; three values means enabled; one or two means a
startup validation error naming the group. Issuer URL validation runs only for
the enabled case. A configuration helper exposes the enabled decision so main
startup does not duplicate grouping logic.

Allowing arbitrary partial values was rejected because every current OIDC flow
requires all three. Silently disabling a partially configured provider was
rejected because it would hide deployment mistakes.

### Represent disabled OIDC with an absent provider

Main startup constructs the OIDC client and performs discovery only when the
configuration helper reports enabled. The authentication service accepts an
optional provider, always registers magic-link/session/method routes, and only
registers OIDC start/callback routes when the provider is present.

Handlers that return an error for disabled OIDC were rejected because
unregistered routes accurately represent unavailable behavior and prevent
creating OIDC attempts that cannot complete.

### Publish method codes through a minimal public operation

Add `GET /api/v1/auth/methods` with `security: []` and response
`{ "methods": ["magic_link", "oidc"] }`. `magic_link` is always first and
present; `oidc` is appended only when enabled. The schema uses a closed enum and
the handler derives the response from service wiring, not environment access.

Boolean configuration objects and provider metadata were rejected because an
ordered code list is minimal, extensible, and does not expose configuration.

### Gate the complete login action area on method discovery

The frontend adds a typed query for authentication methods. Until it resolves,
the login card displays a non-interactive loading state. Failure displays the
existing retryable error pattern with no login actions. Success renders the
magic-link form and conditionally renders the OIDC action and divider. This
prevents a transient OIDC button from appearing in magic-link-only deployments.

Build-time flags were rejected because one static bundle must reflect backend
runtime configuration. Optimistically showing magic links while discovery
fails was rejected because the API response is the contract for enabled
methods, even though magic links are currently always enabled.

### Default examples and compose to disabled OIDC

`.env.example` documents empty OIDC values as a valid magic-link-only default
and explains that all three must be set together. Compose passes through each
value with an empty default rather than fake provider values, allowing the
container to start without performing discovery against a placeholder host.

## Risks / Trade-offs

- [The public method response may be cached after deployment configuration changes] → use normal request-time resolution and conservative frontend query caching; configuration still changes only on restart.
- [An enabled provider can still make startup fail when discovery is unavailable] → preserve fail-fast behavior whenever OIDC is explicitly enabled.
- [Older frontend bundles still display OIDC against a magic-link-only backend] → deploy backend and matching static bundle as the existing single image.

## Migration Plan

1. Add the API schema and backend method handler while preserving enabled OIDC behavior.
2. Make configuration, discovery, and route registration conditional.
3. Regenerate frontend API types and gate login actions on method discovery.
4. Change examples and compose defaults to empty OIDC values and deploy the single application image. Existing deployments with all three variables remain OIDC-enabled without data migration.
