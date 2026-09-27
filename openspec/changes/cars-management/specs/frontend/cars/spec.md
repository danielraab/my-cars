# Spec Delta

## Purpose

Defines the authenticated cars screens where a user lists, creates, views,
and edits their cars, in German and English.

## ADDED Requirements

### Requirement: Cars list shows the caller's cars, paginated
The frontend SHALL render the `/cars` route inside the authenticated
application shell and SHALL load the caller's cars from the documented
paginated cars operation, showing type, make, name, fuel (localized),
first registration, license plate, and purchase price for each row. It
SHALL NOT display active state, FIN, or purchase date in the list. While
the first page loads it SHALL show a localized loading state; a load
failure SHALL show a localized error with a retry action. When a further
page is available the screen SHALL offer a localized action to load it,
appending the results to the visible list without discarding what is
already shown. Each row SHALL link to that car's detail screen, and the
screen SHALL offer a localized action to create a new car.

#### Scenario: User opens the cars list
- **WHEN** an authenticated user navigates to `/cars`
- **THEN** the screen shows the documented columns for each of the
  caller's cars and a link to create a new car

#### Scenario: User loads a further page
- **WHEN** the caller has more cars than the first page returned and the
  user activates the load-more action
- **THEN** the additional cars are appended to the visible list

#### Scenario: Cars list cannot be loaded
- **WHEN** the cars operation fails with a transport or server error
- **THEN** the screen shows a localized error with a retry action

### Requirement: User can create a car
The frontend SHALL render a `/cars/create` route with a form for type,
make, name, fuel (a localized choice among the four documented codes),
first registration, license plate, and optional FIN, purchase date, and
purchase price. It SHALL NOT expose the active-state field. Submitting a
valid form SHALL create the car and navigate to its detail screen. A
validation rejection SHALL be shown as a localized message associated with
the affected field, and SHALL NOT navigate away or lose the entered values.

#### Scenario: User creates a car
- **WHEN** the user fills in the required fields and submits the form
- **THEN** the car is created and the user is taken to its detail screen

#### Scenario: Backend rejects a field
- **WHEN** the backend responds `400` with a field detail
- **THEN** the frontend shows a localized validation message on that field
  and keeps the entered values

### Requirement: Car detail screen shows the caller's car
The frontend SHALL render a `/cars/{carId}` route that loads the car from
the documented single-car operation and displays its type, make, name,
fuel (localized), first registration, license plate, FIN, purchase date,
and purchase price as read-only values, with a localized action to edit
the car. It SHALL NOT render an expenses or consumption view in this
change. A car that cannot be loaded, including one owned by another
account, SHALL show a localized not-found or error state rather than
partial data.

#### Scenario: User opens a car's detail screen
- **WHEN** an authenticated user navigates to one of their car's detail
  screens
- **THEN** the screen shows the car's documented fields and an edit action

#### Scenario: Car cannot be found
- **WHEN** the requested car does not exist or belongs to another account
- **THEN** the screen shows a localized not-found state

### Requirement: User can edit or delete a car
The frontend SHALL render a `/cars/{carId}/edit` route pre-filled with the
car's current values, using the same fields as car creation, plus a
two-step-confirm delete action. Submitting a valid edit SHALL save the
changes and every part of the application that displays the car SHALL
reflect them without a page reload. Deleting SHALL require an explicit
second confirmation before the car and its expenses are removed, after
which the user is returned to the cars list.

#### Scenario: User edits a car
- **WHEN** the user changes a field on the edit form and submits it
- **THEN** the change is saved and shown on the car's detail screen

#### Scenario: User deletes a car
- **WHEN** the user activates delete once and then confirms
- **THEN** the car is deleted and the user is returned to the cars list

#### Scenario: User cancels a delete
- **WHEN** the user activates delete once but does not confirm
- **THEN** the car is not deleted

### Requirement: Cars screens are fully localized
Every user-facing string on the cars screens, including fuel-type labels,
validation, and error messages, SHALL be available in German and English
and SHALL follow the active locale.

#### Scenario: User switches language on a cars screen
- **WHEN** the user switches the language from English to German on any
  cars screen
- **THEN** all labels, hints, and messages on that screen are shown in
  German
