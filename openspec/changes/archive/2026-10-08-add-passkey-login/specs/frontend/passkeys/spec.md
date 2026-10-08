# Spec Delta

## Purpose

Defines the profile-screen passkey management section where authenticated
users add, rename, and remove their passkeys, in German and English.

## ADDED Requirements

### Requirement: Profile screen lists the user's passkeys
The frontend SHALL show a passkey section on `/profile` that loads the caller's
passkeys from the documented operation and displays each passkey's name,
authenticator model when known, whether it is synced, creation date, and last
use. It SHALL show a localized empty state, loading state, and retryable error.

#### Scenario: User with passkeys opens the profile
- **WHEN** an authenticated user with two passkeys opens `/profile`
- **THEN** the passkey section lists both passkeys with their details

#### Scenario: User without passkeys opens the profile
- **WHEN** an authenticated user with no passkeys opens `/profile`
- **THEN** the passkey section shows a localized empty state and the add action

#### Scenario: Passkey list cannot be loaded
- **WHEN** the passkey list operation fails with a transport or server error
- **THEN** the section shows a localized error with a retry action

### Requirement: Adding a passkey explains and handles the fresh-login requirement
The passkey section SHALL state that adding a passkey requires a login within
the last 5 minutes. When the backend reports reauthentication required, the
frontend SHALL show a localized message and a link to login with return to
`/profile`, and SHALL NOT report success.

#### Scenario: User adds a passkey with a fresh session
- **WHEN** a user with a fresh session selects add and completes the browser passkey prompt
- **THEN** the new passkey appears in the list with an announced localized confirmation

#### Scenario: Session is too old to add a passkey
- **WHEN** the backend responds reauthentication-required to adding a passkey
- **THEN** the section shows a localized explanation with a link to `/auth/login?returnTo=/profile`

#### Scenario: User cancels the browser prompt
- **WHEN** the user dismisses the browser passkey prompt
- **THEN** the frontend shows no error dialog beyond a neutral localized notice and the list is unchanged

### Requirement: Add action is hidden without browser support
The frontend SHALL hide the add-passkey action and show a localized
explanation when the browser does not support WebAuthn, while still listing,
renaming, and deleting existing passkeys.

#### Scenario: Browser lacks WebAuthn
- **WHEN** the profile screen is opened in a browser without WebAuthn support
- **THEN** no add action is shown and existing passkeys can still be managed

### Requirement: User can rename and delete passkeys
The frontend SHALL let the user rename a passkey with a non-empty name and
delete a passkey after an explicit confirmation step, without requiring a
fresh login. If deleting revokes the current session, the frontend SHALL clear its
session state and navigate to login.

#### Scenario: User renames a passkey
- **WHEN** the user saves a new non-empty name for a passkey
- **THEN** the list shows the new name

#### Scenario: User deletes a passkey
- **WHEN** the user confirms deletion of a passkey
- **THEN** the passkey disappears from the list

#### Scenario: Deleting the passkey used for the current session
- **WHEN** the user deletes the passkey that established the current session
- **THEN** the frontend clears session state and navigates to the login route

### Requirement: Passkey UI is fully localized
Every user-facing string of the passkey section and the passkey login action,
including errors, SHALL be available in German and English and follow the
active locale.

#### Scenario: User switches language on the profile screen
- **WHEN** the user switches from English to German on `/profile`
- **THEN** all passkey section labels, hints, and messages are shown in German
