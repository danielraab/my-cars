# frontend/tickets Specification

## Purpose
Defines the authenticated tickets screens where a user lists, creates, and
edits their parking, speeding, and other tickets, in German and English.

## Requirements

### Requirement: Tickets list shows the caller's tickets, paginated, with a running total
The frontend SHALL render the `/tickets` route inside the authenticated
application shell and SHALL load the caller's tickets from the documented
paginated tickets operation. Each row SHALL show date, car (linked to that
car's detail screen), type (localized), location, and amount, and the
screen SHALL show a running sum of the amount of every row loaded so far.
While the first page loads it SHALL show a localized loading state, and a
load failure SHALL show a localized error with a retry action. When a
further page is available the screen SHALL offer a localized action to load
it, appending the results to the visible list and updating the running sum
without discarding what is already shown. Each row SHALL link to that
ticket's edit screen, and the screen SHALL offer a localized action to
create a new ticket.

#### Scenario: User opens the tickets list
- **WHEN** an authenticated user navigates to `/tickets`
- **THEN** the screen shows the documented columns for each of the
  caller's tickets, a running sum of their amounts, and a link to create a
  new ticket

#### Scenario: User loads a further page
- **WHEN** the caller has more tickets than the first page returned and the
  user activates the load-more action
- **THEN** the additional tickets are appended to the visible list and the
  running sum includes them

#### Scenario: Tickets list cannot be loaded
- **WHEN** the tickets operation fails with a transport or server error
- **THEN** the screen shows a localized error with a retry action

### Requirement: User can create a ticket
The frontend SHALL render a `/tickets/create` route with a form for car (a
choice among the caller's cars), date/time, type (a localized choice among
the three documented codes), location (with autocomplete suggestions from
the caller's prior tickets), amount, and optional description. It SHALL
accept an optional `carId` query parameter to preselect the car. Submitting
a valid form SHALL create the ticket and navigate to the tickets list. A
validation rejection SHALL be shown as a localized message associated with
the affected field, and SHALL NOT navigate away or lose the entered values.

#### Scenario: User creates a ticket
- **WHEN** the user fills in the required fields and submits the form
- **THEN** the ticket is created and the user is taken to the tickets list

#### Scenario: User creates a ticket from a car's context
- **WHEN** the user navigates to `/tickets/create?carId=<id>` for one of
  their own cars
- **THEN** the form's car field is preselected to that car

#### Scenario: Location suggestions are offered
- **WHEN** the caller has earlier tickets and opens the create form
- **THEN** the location field offers the caller's distinct prior locations
  as suggestions

#### Scenario: Backend rejects a field
- **WHEN** the backend responds `400` with a field detail
- **THEN** the frontend shows a localized validation message on that field
  and keeps the entered values

### Requirement: User can edit or delete a ticket
The frontend SHALL render a `/tickets/{ticketId}/edit` route pre-filled
with the ticket's current values. It SHALL use the same fields as ticket
creation, with the car field fixed, plus a two-step-confirm delete action.
Submitting a valid edit SHALL save the changes and return the user to the
tickets list with them reflected. Deleting SHALL require an explicit second
confirmation before the ticket is removed, after which the user is returned
to the tickets list. A ticket that cannot be loaded, including one whose
car belongs to another account, SHALL show a localized not-found or error
state rather than partial data.

#### Scenario: User edits a ticket
- **WHEN** the user changes a field on the edit form and submits it
- **THEN** the change is saved and shown on the tickets list

#### Scenario: User deletes a ticket
- **WHEN** the user activates delete once and then confirms
- **THEN** the ticket is deleted and the user is returned to the tickets
  list

#### Scenario: User cancels a delete
- **WHEN** the user activates delete once but does not confirm
- **THEN** the ticket is not deleted

#### Scenario: Ticket cannot be found
- **WHEN** the requested ticket does not exist or its car belongs to
  another account
- **THEN** the screen shows a localized not-found state

### Requirement: Tickets screens are fully localized
Every user-facing string on the tickets screens, including ticket-type
labels, validation, and error messages, SHALL be available in German and
English and SHALL follow the active locale.

#### Scenario: User switches language on a tickets screen
- **WHEN** the user switches the language from English to German on any
  tickets screen
- **THEN** all labels, hints, and messages on that screen are shown in
  German
