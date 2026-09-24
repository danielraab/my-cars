# Spec Delta

## Purpose

Defines the authenticated caller's profile representation and safe update operation used by the rewrite's profile screen.

## ADDED Requirements

### Requirement: Caller can retrieve the current profile
The system SHALL expose `GET /api/v1/me` for the authenticated account and return its ID, email, first name, and last name without exposing session or identity-provider credentials.

#### Scenario: Authenticated caller reads profile
- **WHEN** an authenticated caller requests `GET /api/v1/me`
- **THEN** the response is `200` with that caller's profile

### Requirement: Caller can update the current profile
The system SHALL expose `PATCH /api/v1/me` for email, first name, and last name updates. It SHALL reject an email already assigned to another account and SHALL allow documented zero-like and empty optional name values rather than silently ignoring them.

#### Scenario: Caller updates their name
- **WHEN** an authenticated caller patches a valid first or last name
- **THEN** the response contains the updated profile

#### Scenario: Caller selects an occupied email
- **WHEN** an authenticated caller patches their email to one used by another account
- **THEN** the response is `409` with the common error representation
