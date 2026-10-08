# Spec Delta

## ADDED Requirements

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
