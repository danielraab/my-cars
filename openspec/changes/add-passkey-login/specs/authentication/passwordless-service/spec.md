# Spec Delta

## MODIFIED Requirements

### Requirement: Browser sessions are server-side and safely invalidated
The system SHALL issue an opaque session identifier only in an HttpOnly,
Secure, SameSite cookie and SHALL persist only a non-reversible representation
of the identifier server-side with its account, creation time, expiry, and,
when established by a passkey, a reference to that passkey. It
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

#### Scenario: Passkey session records its credential
- **WHEN** a session is established by a passkey assertion
- **THEN** the persisted session references that passkey, while OIDC and
  magic-link sessions reference none
