# Spec Delta

## Purpose

Defines backend passkey (WebAuthn) behavior: how authenticated users register
and manage passkeys and how a passkey assertion establishes a browser session
for the account that owns the credential.

## ADDED Requirements

### Requirement: Relying party is derived from the application base URL
The system SHALL use the host of the configured application base URL as the
WebAuthn relying-party ID and its origin as the only accepted client origin.
Passkey support SHALL always be enabled and SHALL NOT require additional
configuration. Ceremonies presented from any other origin SHALL be rejected.

#### Scenario: Ceremony from the configured origin succeeds
- **WHEN** a valid registration or assertion response carries the configured application origin
- **THEN** the system accepts the origin check

#### Scenario: Ceremony from another origin is rejected
- **WHEN** a registration or assertion response carries an origin different from the configured application origin
- **THEN** the system rejects it and neither stores a credential nor establishes a session

### Requirement: Ceremony challenges are random, short-lived, and single-use
The system SHALL issue a fresh random challenge for every registration and
assertion ceremony, persist only server-side state needed to verify it, and
accept a response only once and only before the challenge expires. A
registration challenge SHALL be bound to the account that started it.

#### Scenario: Replayed ceremony response is rejected
- **WHEN** a caller submits a response for a challenge that was already consumed
- **THEN** the system rejects it without storing a credential or establishing a session

#### Scenario: Expired challenge is rejected
- **WHEN** a caller submits a response after its challenge expired
- **THEN** the system rejects it without storing a credential or establishing a session

#### Scenario: Registration challenge used by another account
- **WHEN** a registration response is submitted by a session of a different account than the one that started the ceremony
- **THEN** the system rejects it and stores no credential

### Requirement: Passkey registration requires a fresh login
The system SHALL allow starting and completing passkey registration only for
an authenticated session established at most 5 minutes earlier, by any login
method. Otherwise it SHALL respond with a distinguishable
reauthentication-required error and SHALL NOT issue or consume a challenge.

#### Scenario: Fresh session registers a passkey
- **WHEN** a session established 2 minutes ago starts and completes a valid registration
- **THEN** the system stores the passkey for that session's account

#### Scenario: Stale session cannot start registration
- **WHEN** a session established 10 minutes ago requests registration options
- **THEN** the system responds with the reauthentication-required error and issues no challenge

#### Scenario: Session becomes stale during registration
- **WHEN** a session that was fresh when requesting options completes registration more than 5 minutes after it was established
- **THEN** the system responds with the reauthentication-required error and stores no credential

### Requirement: Registered passkeys are discoverable and bound to one account
The system SHALL request discoverable credentials with user verification and
no attestation, and SHALL store the credential's public key, signature
counter, transports, authenticator model identifier, and backup flags against
the registering account. It SHALL exclude the account's existing credentials
from new registrations and SHALL reject a credential ID already registered.

#### Scenario: Account registers several passkeys
- **WHEN** an account with one passkey registers a passkey on a different authenticator
- **THEN** both passkeys are stored for that account

#### Scenario: Duplicate credential is rejected
- **WHEN** a registration response contains a credential ID that is already stored
- **THEN** the system rejects it and the existing credential is unchanged

### Requirement: Passkey assertion establishes a session for the owning account
The system SHALL let an anonymous caller start an assertion without supplying
an email and SHALL establish the standard browser session for the account that
owns the asserted credential only after verifying signature, challenge,
origin, user verification, and user handle. It SHALL never create an account.

#### Scenario: Valid passkey login
- **WHEN** a caller submits a valid assertion for a stored credential
- **THEN** the system sets the session cookie for the owning account and records the credential's last use

#### Scenario: Unknown credential is rejected
- **WHEN** a caller submits an assertion for a credential ID that is not stored
- **THEN** the system rejects it without establishing a session or creating an account

#### Scenario: Invalid signature is rejected
- **WHEN** a caller submits an assertion whose signature does not verify against the stored public key
- **THEN** the system rejects it without establishing a session

### Requirement: Users manage only their own passkeys
The system SHALL let an authenticated user list, rename, and delete their own
passkeys without a fresh login. Listing SHALL return metadata only and never
key material. Operations naming another account's passkey SHALL behave as if
the passkey does not exist.

#### Scenario: User lists passkeys
- **WHEN** an authenticated user lists passkeys
- **THEN** the response contains each of their passkeys with name, creation time, last use, authenticator model, and backup state, and no public key

#### Scenario: User renames a passkey
- **WHEN** an authenticated user renames one of their passkeys to a non-empty name
- **THEN** the new name is stored and returned

#### Scenario: Foreign passkey is not found
- **WHEN** an authenticated user tries to rename or delete a passkey owned by another account
- **THEN** the system responds not found and the passkey is unchanged

### Requirement: Deleting a passkey ends its sessions
The system SHALL, when a passkey is deleted, revoke every session that was
established by asserting that passkey in the same operation, including the
caller's own session if it was. Sessions established by other passkeys or
other login methods SHALL remain active.

#### Scenario: Sessions created with the passkey are revoked
- **WHEN** a user deletes a passkey that established two active sessions
- **THEN** both sessions are revoked and later requests with their cookies are rejected

#### Scenario: Other sessions remain active
- **WHEN** a user logged in via magic link deletes a passkey
- **THEN** the current magic-link session stays active

#### Scenario: Last passkey can be deleted
- **WHEN** a user deletes their only passkey
- **THEN** the deletion succeeds and magic-link login remains available for the account
