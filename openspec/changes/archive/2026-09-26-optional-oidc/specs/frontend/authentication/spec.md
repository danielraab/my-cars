# Spec Delta

## MODIFIED Requirements

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
- **WHEN** a user selects enabled OIDC login
- **THEN** the browser navigates to the backend OIDC initiation route with the validated local return path

#### Scenario: Login input is invalid
- **WHEN** a user submits an invalid email or the backend rejects the request as invalid
- **THEN** the frontend displays an accessible localized validation message without reporting successful delivery

#### Scenario: Authentication methods are unavailable
- **WHEN** the enabled-method operation fails
- **THEN** the frontend displays a localized error with a retry action and no login method actions
