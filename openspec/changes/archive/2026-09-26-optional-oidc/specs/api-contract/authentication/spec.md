# Spec Delta

## ADDED Requirements

### Requirement: Enabled authentication methods are publicly discoverable
The system SHALL document an unauthenticated `GET /api/v1/auth/methods`
operation that returns the enabled passwordless login method codes. The response
SHALL always include `magic_link` and SHALL include `oidc` only when OIDC is
fully configured. It SHALL NOT expose issuer URLs, client identifiers, client
secrets, or other provider configuration.

#### Scenario: Magic-link-only deployment reports methods
- **WHEN** a caller requests authentication methods from a deployment without OIDC configuration
- **THEN** the response is `200` and contains only `magic_link`

#### Scenario: OIDC-enabled deployment reports methods
- **WHEN** a caller requests authentication methods from a deployment with complete OIDC configuration
- **THEN** the response is `200` and contains `magic_link` and `oidc`
