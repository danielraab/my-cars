# Spec Delta

## MODIFIED Requirements

### Requirement: Cars list shows the caller's cars, paginated
The frontend SHALL render the `/cars` route inside the authenticated
application shell and SHALL load the caller's cars from the documented
paginated cars operation, showing type, make, name, fuel (localized),
first registration, license plate, and purchase price for each row. An
absent first registration or license plate SHALL be shown as the localized
"not recorded" placeholder. It
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

#### Scenario: Car without registration details is listed
- **WHEN** the cars list contains a car whose first registration and
  license plate are `null`
- **THEN** both cells show the localized "not recorded" placeholder

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
and optional first registration, license plate, FIN, purchase date, and
purchase price. An optional field left blank SHALL be submitted as `null`.
It SHALL NOT expose the active-state field. Submitting a
valid form SHALL create the car and navigate to its detail screen. A
validation rejection SHALL be shown as a localized message associated with
the affected field, and SHALL NOT navigate away or lose the entered values.

#### Scenario: User creates a car
- **WHEN** the user fills in the required fields and submits the form
- **THEN** the car is created and the user is taken to its detail screen

#### Scenario: User creates a car without registration details
- **WHEN** the user leaves first registration and license plate blank and
  submits an otherwise valid form
- **THEN** the car is created with both values `null`

#### Scenario: Backend rejects a field
- **WHEN** the backend responds `400` with a field detail
- **THEN** the frontend shows a localized validation message on that field
  and keeps the entered values

### Requirement: Car detail screen shows the caller's car
The frontend SHALL render a `/cars/{carId}` route that loads the car from
the documented single-car operation and shows a localized action to edit
the car. It SHALL show the car's type, make, name, fuel (localized), first
registration, license plate, FIN, purchase date, and purchase price as
read-only values on its Details tab, showing the localized "not recorded"
placeholder for any absent optional value. A header that includes the
license plate SHALL omit it when it is absent. A car that cannot be loaded,
including one owned by another account, SHALL show a localized not-found or
error state rather than partial data or any tab content.

#### Scenario: User opens a car's detail screen
- **WHEN** an authenticated user navigates to one of their car's detail
  screens
- **THEN** the screen shows the car's documented fields on the Details tab
  and an edit action

#### Scenario: Car without registration details is shown
- **WHEN** the user opens the detail screen of a car whose first
  registration and license plate are `null`
- **THEN** both values show the localized "not recorded" placeholder and
  the header shows no license plate separator

#### Scenario: Car cannot be found
- **WHEN** the requested car does not exist or belongs to another account
- **THEN** the screen shows a localized not-found state and no tabs
