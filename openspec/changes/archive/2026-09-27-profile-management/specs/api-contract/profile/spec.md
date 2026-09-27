# Spec Delta

## MODIFIED Requirements

### Requirement: Caller can update the current profile
The system SHALL expose `PATCH /api/v1/me` for first name and last name
updates only. The email address SHALL NOT be changeable through this
operation: a request body that contains an `email` member SHALL be rejected
with `400` and the common validation error representation identifying the
`email` field, and no part of the request SHALL be applied. A request body
that contains any other undocumented member, no documented member, or a
non-string name value SHALL likewise be rejected with `400` identifying the
offending fields. Supplied names SHALL have leading and trailing whitespace
removed, SHALL be accepted when empty rather than silently ignored, and SHALL
be rejected with `400` when longer than 100 characters after trimming. A
successful update SHALL apply every supplied name field and return the
complete updated profile.

#### Scenario: Caller updates their name
- **WHEN** an authenticated caller patches a valid first or last name
- **THEN** the response is `200` and contains the updated profile

#### Scenario: Caller clears an optional name
- **WHEN** an authenticated caller patches `lastName` to an empty string
- **THEN** the response is `200` and the profile's `lastName` is empty

#### Scenario: Caller attempts to change their email
- **WHEN** an authenticated caller patches a body containing `email`, with or
  without name fields
- **THEN** the response is `400` with the common error representation whose
  field details identify `email`, and the stored profile is unchanged

#### Scenario: Caller selects an occupied email
- **WHEN** an authenticated caller patches their email to one used by another
  account
- **THEN** the response is `400` (not `409`) with the common error
  representation whose field details identify `email` as read-only, without
  disclosing whether the address is in use

#### Scenario: Caller supplies an undocumented field
- **WHEN** an authenticated caller patches a body containing a member other
  than `firstName` or `lastName`
- **THEN** the response is `400` identifying that member and the stored
  profile is unchanged

#### Scenario: Caller supplies an overlong name
- **WHEN** an authenticated caller patches a first or last name longer than
  100 characters after trimming
- **THEN** the response is `400` identifying that field and the stored
  profile is unchanged

#### Scenario: Unauthenticated caller updates a profile
- **WHEN** a request without a valid session patches `/api/v1/me`
- **THEN** the response is `401` with the common error representation
