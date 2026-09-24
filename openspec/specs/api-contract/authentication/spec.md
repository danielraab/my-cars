# api-contract/authentication Specification

## Purpose

Defines passwordless OIDC and magic-link authentication that converge on one email-based account and establish browser sessions without browser token storage.

## Requirements

### Requirement: Authentication is provided through OIDC and magic links
The system SHALL document an OIDC sign-in initiation route and callback route, and a magic-link request route and consumption route. Password registration, password login, password reset, email verification, bearer access tokens, and refresh tokens SHALL NOT be part of the v1 contract.

#### Scenario: User starts OIDC sign-in
- **WHEN** a browser requests the documented OIDC initiation route
- **THEN** it is redirected to the configured identity provider with state protection

#### Scenario: User requests a magic link
- **WHEN** a user submits a syntactically valid email to the magic-link request route
- **THEN** the API responds without disclosing whether that email already has an account

### Requirement: Equivalent verified emails resolve to one account
The system SHALL associate a successfully verified OIDC identity and a consumed magic link with the same account when their normalized verified email addresses match. A newly verified email with no matching account SHALL create one account.

#### Scenario: Existing magic-link user signs in through OIDC
- **WHEN** OIDC returns a verified email matching an existing magic-link account
- **THEN** the resulting session is authenticated as that existing account

### Requirement: Browser authentication uses secure cookie sessions
The system SHALL establish the authenticated browser session with an HttpOnly, Secure, SameSite cookie and SHALL provide documented current-session and logout operations. The contract SHALL not require the frontend to receive or persist a session token in localStorage.

#### Scenario: Successful authentication establishes a session
- **WHEN** an OIDC callback or magic-link consumption succeeds
- **THEN** the response sets the documented HttpOnly session cookie and redirects to the frontend

#### Scenario: User signs out
- **WHEN** an authenticated browser invokes the logout operation
- **THEN** the server invalidates the session and clears its cookie
