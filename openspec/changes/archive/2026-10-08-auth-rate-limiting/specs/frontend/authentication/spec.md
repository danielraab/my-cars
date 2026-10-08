# Spec Delta

## ADDED Requirements

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
