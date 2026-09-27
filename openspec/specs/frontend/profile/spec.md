# frontend/profile Specification

## Purpose

Defines the authenticated profile screen where a user reviews their account
email and maintains their first and last name, in German and English.

## Requirements

### Requirement: Profile screen shows the caller's account details
The frontend SHALL render the `/profile` route inside the authenticated
application shell and SHALL load the caller's profile from the documented
profile operation. It SHALL display the email address as read-only and
SHALL explain, in the active locale, that the email address cannot be
changed. It SHALL NOT display session, token, or identity-provider details.
While loading, it SHALL show a localized loading state; a load failure SHALL
produce a localized error with a retry action rather than an empty form.

#### Scenario: User opens the profile screen
- **WHEN** an authenticated user navigates to `/profile`
- **THEN** the screen shows their email as a non-editable value with an
  explanation, and editable first-name and last-name fields prefilled with
  their current values

#### Scenario: Profile cannot be loaded
- **WHEN** the profile operation fails with a transport or server error
- **THEN** the screen shows a localized error with a retry action and no
  editable form

### Requirement: User can update their name from the profile screen
The frontend SHALL let the user edit and save their first and last name,
submitting only those fields; it SHALL NOT submit the email address. While a
save is in progress the submit action SHALL be disabled. After a successful
save the screen SHALL show a localized, accessibly announced confirmation,
and every part of the application that displays the caller's profile SHALL
reflect the saved values without a page reload. A validation rejection
SHALL be shown as a localized message associated with the affected field;
any other failure SHALL be shown as a localized error that keeps the user's
unsaved input.

#### Scenario: User saves a new name
- **WHEN** the user changes their first name and submits the form
- **THEN** the frontend sends only name fields, shows a success confirmation,
  and displays the saved name

#### Scenario: Backend rejects a name
- **WHEN** the backend responds `400` with field details for `lastName`
- **THEN** the frontend shows a localized validation message on the last-name
  field and does not report success

#### Scenario: Save fails unexpectedly
- **WHEN** the save fails with a transport or server error
- **THEN** the frontend shows a localized error and the entered values remain
  in the form

### Requirement: Profile screen is fully localized
Every user-facing string on the profile screen, including validation and
error messages, SHALL be available in German and English and SHALL follow the
active locale.

#### Scenario: User switches language on the profile screen
- **WHEN** the user switches the language from English to German on `/profile`
- **THEN** all labels, hints, and messages on the screen are shown in German
