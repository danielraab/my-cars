# frontend / authentication

## Purpose

Defines how the static browser frontend initiates passwordless login, reflects
the backend-owned cookie session, protects application routes, and logs out.

## Requirements

### Requirement: Login offers both backend-owned passwordless methods
The frontend SHALL load the enabled methods from the documented backend
operation before presenting login actions. It SHALL provide the magic-link form
when `magic_link` is enabled and SHALL offer OIDC login only when `oidc` is
enabled. It SHALL initiate OIDC with a full-page navigation to the documented
backend route; it SHALL NOT contact an identity provider directly or request,
receive, or persist an authentication token. Failure to load enabled methods
SHALL produce a localized retryable state rather than advertising an unknown
method set.

#### Scenario: Magic-link-only login is presented
- **WHEN** the backend reports only `magic_link`
- **THEN** the login route shows the magic-link form and no OIDC action

#### Scenario: Both enabled login methods are presented
- **WHEN** the backend reports `magic_link` and `oidc`
- **THEN** the login route shows the magic-link form and OIDC action

#### Scenario: User requests a magic link
- **WHEN** a user submits a syntactically valid email on the login route
- **THEN** the frontend submits the email and validated local return path to the backend and displays the same accepted confirmation regardless of account existence

#### Scenario: User starts OIDC login
- **WHEN** a user selects OIDC login
- **THEN** the browser navigates to the backend OIDC initiation route with the validated local return path

#### Scenario: Login input is invalid
- **WHEN** a user submits an invalid email or the backend rejects the request as invalid
- **THEN** the frontend displays an accessible localized validation message without reporting successful delivery

#### Scenario: Authentication methods are unavailable
- **WHEN** the enabled-method operation fails
- **THEN** the frontend displays a localized error with a retry action and no login method actions

### Requirement: Session state controls access to protected routes
The frontend SHALL resolve the current session through the documented session
operation before deciding whether a protected route is available. A valid
session SHALL expose only the returned profile to frontend UI; a `401` SHALL be
treated as anonymous, while a transport or server failure SHALL be presented as
a retryable error rather than as proof that the user is logged out.

#### Scenario: Authenticated user opens a protected route
- **WHEN** current-session resolution returns a valid profile
- **THEN** the protected route renders within the authenticated application shell

#### Scenario: Anonymous user opens a protected route
- **WHEN** current-session resolution returns `401` for a protected route
- **THEN** the frontend redirects to login and retains the requested local path for use after authentication

#### Scenario: Session resolution is unavailable
- **WHEN** current-session resolution fails for a reason other than `401`
- **THEN** the frontend displays a retryable localized error and does not classify the user as authenticated or anonymous

### Requirement: Return destinations remain application-local
The frontend SHALL accept a post-login destination only when it is an
application-local path and SHALL otherwise use `/home`. The validated path
SHALL be supplied to both login methods and SHALL never be used to navigate to
another origin.

#### Scenario: External return destination is supplied
- **WHEN** login is opened with an absolute or protocol-relative return destination
- **THEN** the frontend replaces it with `/home` before initiating authentication

### Requirement: Logout invalidates frontend session state
The frontend SHALL invoke the documented logout operation and, after a
successful response or an already-invalid `401` response, clear its in-memory
session state and navigate to the public landing route. It SHALL not claim
logout succeeded after another server or transport failure.

#### Scenario: Authenticated user logs out
- **WHEN** the logout operation succeeds
- **THEN** protected content is removed and the user is returned to the public landing route

#### Scenario: Logout fails unexpectedly
- **WHEN** the logout operation fails with a transport error or server error other than `401`
- **THEN** the frontend keeps the current session state and displays a localized error

### Requirement: Login offers passkey sign-in when supported
The login route SHALL offer a "sign in with a passkey" action when the backend
reports `passkey` and the browser supports WebAuthn, without asking for an
email. After a successful assertion it SHALL refresh session state and navigate
to the validated local return path. It SHALL NOT receive or persist a token.

#### Scenario: Passkey action is presented
- **WHEN** the backend reports `passkey` and the browser supports WebAuthn
- **THEN** the login route shows the passkey action alongside the other enabled methods

#### Scenario: Browser lacks WebAuthn
- **WHEN** the browser does not support WebAuthn
- **THEN** the login route shows no passkey action

#### Scenario: User signs in with a passkey
- **WHEN** the user selects the passkey action and the backend accepts the assertion
- **THEN** the frontend navigates to the validated return path, or `/home` if none was supplied

#### Scenario: Passkey sign-in fails
- **WHEN** the backend rejects the assertion
- **THEN** the frontend shows a localized error that suggests another login method and does not navigate

#### Scenario: User cancels the browser prompt
- **WHEN** the user dismisses the browser passkey prompt
- **THEN** the login route stays unchanged without an error message

### Requirement: Login presents rate limiting as a localized message
The login route SHALL show a localized, accessibly announced "too many
attempts, try again later" message when the magic-link request or passkey
sign-in responds `429`, or when the route is opened with
`error=rate_limited`. It SHALL keep entered input and SHALL NOT report
successful delivery.

#### Scenario: Magic-link request is rate limited
- **WHEN** the backend responds `429` to a magic-link request
- **THEN** the login route shows the localized rate-limit message, keeps the email, and shows no delivery confirmation

#### Scenario: Redirected after a throttled navigation
- **WHEN** the login route is opened with `error=rate_limited`
- **THEN** it shows the localized rate-limit message together with the login methods

#### Scenario: Unknown error parameter
- **WHEN** the login route is opened with an unrecognized `error` value
- **THEN** no error message is shown
