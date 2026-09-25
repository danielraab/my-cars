# Design

## Context

See `proposal.md` for motivation. `accounts` already has a normalized unique
email and the OpenAPI v1 contract fixes the public authentication routes. The
backend currently has a Postgres pool, embedded migrations, SMTP configuration,
and a minimal `net/http` mux, but no application handlers or authentication
state. The legacy JWT/password implementation is read-only reference material
and is explicitly not portable.

## Goals / Non-Goals

**Goals:**

- Add stateful, database-backed passwordless authentication whose only browser
  credential is a secure cookie.
- Protect OIDC authorization-code flow against correlation, interception, and
  token-validation failures.
- Make account convergence deterministic using the existing normalized account
  email constraint.
- Make local mail testing work with the existing Mailpit configuration while
  keeping production SMTP authenticated and TLS-capable.

**Non-Goals:**

- Frontend login, callback, profile, or protected-feature UI.
- Password, JWT bearer/refresh-token, account recovery, or email-verification
  flows from the legacy application.
- Account linking/unlinking UI, multiple OIDC providers, role authorization,
  rate limiting, CAPTCHA, or a production mail queue.
- Legacy data import, including legacy credentials and tokens.

## Decisions

### Store opaque credential digests, not bearer values

An additive migration creates `oidc_identities`, `oidc_login_attempts`,
`magic_link_challenges`, and `sessions`. OIDC identities are uniquely keyed by
issuer and subject; attempts and challenges retain a SHA-256 digest of their
random opaque state/token, timestamps, a consumed marker, and the data needed
to complete their short-lived flow. Sessions retain a digest, account foreign
key, expiry, and revocation timestamp. Lookup-and-consume operations are
atomic, so concurrent magic-link or callback replays yield at most one session.

Persisting plaintext tokens was rejected because a database read would become
an immediately usable authentication credential. Stateless signed tokens were
rejected because logout and one-time replay prevention require deny-list state.

### Use generic OIDC discovery with authorization code, state, nonce, and PKCE

The backend reads issuer URL, client ID, and client secret from the three
documented OIDC environment variables and fetches provider metadata through
discovery. An initiation creates a random state, nonce, and PKCE verifier,
stores the state digest plus verifier and validated return path, then redirects
to the provider's authorization endpoint. The callback consumes state once,
exchanges its code with the verifier, and validates ID-token signature and
claims against discovered metadata before resolving the verified email.

An implicit flow was rejected because it exposes tokens in browser URLs. A
frontend-managed OIDC client was rejected because the backend must own auth and
the client secret/callback validation.

### Send magic links through SMTP and always return 202 for valid requests

The request handler normalizes a syntactically valid email, generates a
cryptographically random token, stores only its digest with a short expiry,
and sends an absolute backend URL based on `AUTH_BASE_URL`. It returns `202`
whether the email already maps to an account. Consumption atomically marks the
challenge used, resolves or creates the account, then redirects with a session
cookie. A mail-send failure returns a server error and leaves no usable
challenge.

Creating an account during request was rejected because it makes unsolicited
requests durable accounts. Storing only the latest token per email was rejected
because it complicates delivery retries and does not improve replay protection.

### Cookie sessions are scoped to the backend and validated by middleware

Authentication success creates a random session value and places it in a
named HttpOnly, Secure, SameSite=Lax cookie with Path=/ and the session expiry.
The raw value never appears in an API body, log, or database row. A shared
middleware resolves active sessions for `/api/session` and later protected
handlers; logout revokes the resolved row and sends an expired cookie using
matching attributes. Expired/revoked state may be pruned after it cannot affect
validation.

Browser local storage and bearer Authorization tokens were rejected by the
target architecture. Cookie-only server sessions permit immediate logout and
avoid exposing credentials to frontend JavaScript.

### Validate return targets as paths, not arbitrary URLs

`returnTo` is parsed as a relative application path. It must begin with one
slash, must not be protocol-relative, and must not contain a scheme, host, or
user-info; otherwise initiation returns `400`. The stored validated path is
used after successful authentication, falling back to `/`.

Allowlisting arbitrary origins was rejected because the backend and static
frontend have a shared origin in production and open redirects add phishing
risk.

## Risks / Trade-offs

- [OIDC provider interoperability varies] → use standards-based discovery and
  test against a disposable local OIDC provider plus mocked discovery/token
  transport.
- [SMTP delivery may fail after challenge storage] → delete the unissued
  challenge on send failure and surface a server error without enumeration.
- [Database growth from expired state] → index expiry columns and prune expired
  attempts, challenges, and revoked/expired sessions during normal operations.
- [Secure cookies complicate non-TLS development] → retain the Secure attribute
  required by the contract and document browser-localhost testing expectations.
- [Email alone cannot prove ownership for a misconfigured OIDC provider] →
  require verified-email claims and issuer/audience/signature validation.

## Migration Plan

1. Deploy additive migration and indexes before registering authentication
   handlers; existing accounts and domain records remain unchanged.
2. Configure SMTP and OIDC values, verify discovery and mail delivery in the
   deployment environment, then enable the routes.
3. Validate OIDC, magic-link, session, and logout flows with a fresh account
   and a converged existing account.
4. Roll back code by disabling routes; do not run the down migration once
   authentication state exists. Use a forward corrective migration for any
   production schema issue.
