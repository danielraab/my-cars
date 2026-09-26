# Spec Delta

## ADDED Requirements

### Requirement: OIDC configuration is optional as a complete group
The system SHALL enable OIDC only when issuer URL, client ID, and client secret
are all configured. It SHALL start without provider discovery when all three
values are absent and continue to provide magic-link and session operations. It
SHALL reject startup when only part of the OIDC configuration group is present.
When OIDC is disabled, OIDC initiation and callback routes SHALL not be
registered.

#### Scenario: No OIDC values starts magic-link-only mode
- **WHEN** the backend starts with issuer URL, client ID, and client secret all absent
- **THEN** startup succeeds without OIDC discovery and magic-link authentication remains available

#### Scenario: Complete OIDC values enable OIDC
- **WHEN** the backend starts with all three valid OIDC values
- **THEN** it performs provider discovery and registers OIDC initiation and callback routes

#### Scenario: Partial OIDC values are rejected
- **WHEN** the backend starts with one or two OIDC values present
- **THEN** startup fails with an error identifying the configuration group that must be supplied together
