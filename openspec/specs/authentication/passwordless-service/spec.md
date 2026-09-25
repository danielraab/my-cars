# authentication/passwordless-service Specification

## Purpose

Defines backend passwordless authentication that turns verified OIDC or email
magic-link logins into one durable account and a secure browser session.

## Requirements

### Requirement: OIDC authorization-code login is verified before authentication
The system SHALL initiate OIDC authorization-code login using issuer discovery,
state correlation, and PKCE. It SHALL authenticate a callback only after the
provider response, state, nonce, issuer, audience, expiry, and verified-email
claims have been validated. The system SHALL reject a callback that is invalid,
expired, replayed, or lacks a verified normalized email without creating a
session.

#### Scenario: Verified OIDC callback creates a session
- **WHEN** a provider returns a valid authorization-code callback containing a
  verified email
- **THEN** the system resolves that email to an account and establishes a
  browser session for it

#### Scenario: Replayed OIDC state is rejected
- **WHEN** a callback reuses state that was already consumed
- **THEN** the system rejects the callback and does not establish a session

### Requirement: Magic links are opaque, short-lived, and single-use
The system SHALL accept a syntactically valid email request without disclosing
whether that email already has an account. It SHALL deliver an opaque,
single-use, expiring magic link to the normalized address and SHALL establish a
browser session only when its unexpired token is consumed for the first time.
The system SHALL not persist a usable magic-link token value.

#### Scenario: Request does not enumerate accounts
- **WHEN** a caller requests a magic link for either a new or existing valid
  email address
- **THEN** the system returns the same accepted response for both requests

#### Scenario: Expired magic link is rejected
- **WHEN** a caller consumes an expired magic-link token
- **THEN** the system rejects the token and does not establish a session

### Requirement: Verified identities converge on normalized email accounts
The system SHALL normalize verified email addresses before account lookup. It
SHALL reuse the existing account for a matching normalized email regardless of
whether that account was first created through OIDC or a magic link. It SHALL
record an OIDC issuer-and-subject identity only after its verified email has
been resolved to that account, and SHALL reject an attempt to associate an
existing identity with a different account.

#### Scenario: OIDC follows magic-link account creation
- **WHEN** a verified OIDC callback contains the normalized email of an account
  previously created through a magic link
- **THEN** the OIDC identity and new session belong to that existing account

### Requirement: Browser sessions are server-side and safely invalidated
The system SHALL issue an opaque session identifier only in an HttpOnly,
Secure, SameSite cookie and SHALL persist only a non-reversible representation
of the identifier server-side with its account, creation time, and expiry. It
SHALL authenticate current-session requests only with an unexpired active
session, and logout SHALL invalidate the presented session and clear the
cookie. Session expiry, logout, and credential failures SHALL not expose an
authentication token in a JSON response or browser storage.

#### Scenario: Current session reports the authenticated account
- **WHEN** a caller presents an active session cookie to the current-session
  operation
- **THEN** the system returns that session's account information

#### Scenario: Logout prevents later use of the cookie
- **WHEN** an authenticated caller logs out
- **THEN** the system invalidates the session, clears its cookie, and rejects a
  later request using that session identifier

### Requirement: Authentication redirects stay within the configured application origin
The system SHALL accept an authentication return target only when it resolves
to an allowed application-local path. It SHALL redirect successful callbacks
and magic-link consumption only to that validated target or the configured
application default, and SHALL reject invalid external return targets.

#### Scenario: External return target is rejected
- **WHEN** a caller starts authentication with an external return target
- **THEN** the system rejects the request without redirecting to that target
