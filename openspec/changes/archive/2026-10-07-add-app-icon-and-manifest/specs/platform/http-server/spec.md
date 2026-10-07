## ADDED Requirements

### Requirement: Web app manifest is served with a manifest media type
The system SHALL serve the frontend's web app manifest with the
`Content-Type` `application/manifest+json`, independently of the MIME tables
available in the runtime image.

#### Scenario: Fetching the manifest
- **WHEN** `GET` is called for the manifest path linked from the frontend's `index.html`
- **THEN** the response status is `200` and the `Content-Type` is `application/manifest+json`
