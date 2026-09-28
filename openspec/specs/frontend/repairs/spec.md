# frontend/repairs Specification

## Purpose
Defines the authenticated repairs screens where a user lists, creates, and
edits their repairs, in German and English.

## Requirements

### Requirement: Repairs list shows the caller's repairs, paginated, with a running total
The frontend SHALL render the `/repairs` route inside the authenticated
application shell and SHALL load the caller's repairs from the documented
paginated repairs operation, showing date, car (linked to that car's
detail screen), station, odometer reading, type (localized), and amount
for each row, and a running sum of the amount of every row loaded so far. While the
first page loads it SHALL show a localized loading state; a load failure
SHALL show a localized error with a retry action. When a further page is
available the screen SHALL offer a localized action to load it, appending
the results to the visible list and updating the running sum without
discarding what is already shown. Each row SHALL link to that repair's
edit screen, and the screen SHALL offer a localized action to create a new
repair.

#### Scenario: User opens the repairs list
- **WHEN** an authenticated user navigates to `/repairs`
- **THEN** the screen shows the documented columns for each of the
  caller's repairs, a running sum of their amounts, and a link to create a
  new repair

#### Scenario: User loads a further page
- **WHEN** the caller has more repairs than the first page returned and the
  user activates the load-more action
- **THEN** the additional repairs are appended to the visible list and the
  running sum includes them

#### Scenario: Repairs list cannot be loaded
- **WHEN** the repairs operation fails with a transport or server error
- **THEN** the screen shows a localized error with a retry action

### Requirement: User can create a repair
The frontend SHALL render a `/repairs/create` route with a form for car (a
choice among the caller's cars), date/time, station (with autocomplete
suggestions from the caller's prior repairs), optional odometer reading,
type (a localized choice among the four documented codes), amount, and
optional description. It SHALL accept an optional `carId` query parameter
to preselect the car. Submitting a valid form SHALL create the repair and
navigate to the repairs list. A validation rejection SHALL be shown as a
localized message associated with the affected field, and SHALL NOT
navigate away or lose the entered values.

#### Scenario: User creates a repair
- **WHEN** the user fills in the required fields and submits the form
- **THEN** the repair is created and the user is taken to the repairs list

#### Scenario: User creates a repair from a car's context
- **WHEN** the user navigates to `/repairs/create?carId=<id>` for one of
  their own cars
- **THEN** the form's car field is preselected to that car

#### Scenario: Backend rejects a field
- **WHEN** the backend responds `400` with a field detail
- **THEN** the frontend shows a localized validation message on that field
  and keeps the entered values

### Requirement: User can edit or delete a repair
The frontend SHALL render a `/repairs/{repairId}/edit` route pre-filled
with the repair's current values, using the same fields as repair
creation with the car field fixed, plus a two-step-confirm delete action.
Submitting a valid edit SHALL save the changes and return the user to the
repairs list with them reflected. Deleting SHALL require an explicit
second confirmation before the repair is removed, after which the user is
returned to the repairs list. A repair that cannot be loaded, including
one whose car belongs to another account, SHALL show a localized
not-found or error state rather than partial data.

#### Scenario: User edits a repair
- **WHEN** the user changes a field on the edit form and submits it
- **THEN** the change is saved and shown on the repairs list

#### Scenario: User deletes a repair
- **WHEN** the user activates delete once and then confirms
- **THEN** the repair is deleted and the user is returned to the repairs
  list

#### Scenario: User cancels a delete
- **WHEN** the user activates delete once but does not confirm
- **THEN** the repair is not deleted

#### Scenario: Repair cannot be found
- **WHEN** the requested repair does not exist or its car belongs to
  another account
- **THEN** the screen shows a localized not-found state

### Requirement: Repairs screens are fully localized
Every user-facing string on the repairs screens, including repair-type
labels, validation, and error messages, SHALL be available in German and
English and SHALL follow the active locale.

#### Scenario: User switches language on a repairs screen
- **WHEN** the user switches the language from English to German on any
  repairs screen
- **THEN** all labels, hints, and messages on that screen are shown in
  German
