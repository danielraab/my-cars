# Spec Delta

## Purpose

Defines authenticated, localized refuel management and fuel-price views.

## ADDED Requirements

### Requirement: Refuels list is filterable, paginated, and charted
The frontend SHALL render `/refuels` in the authenticated shell with a paginated table of the caller's refuels showing date, car, station, odometer reading, fuel subtype, litres, per-litre price, amount, and consumption when available. It SHALL provide a localized caller-car filter, use its selection for both the collection and chart queries, show a fuel-price chart from the complete chart series rather than table pages, and show a running amount total for loaded table rows. The screen SHALL provide localized loading, retryable-error, load-more, edit, and create states.

#### Scenario: User filters by car
- **WHEN** an authenticated user selects one of their cars
- **THEN** the table, running total, and fuel-price chart contain only that car's refuels

#### Scenario: User loads another page
- **WHEN** the selected refuel collection has another page and the user selects load more
- **THEN** its rows append to the table and its amounts join the running total without truncating the chart

#### Scenario: Refuels fail to load
- **WHEN** the collection or chart operation fails
- **THEN** the screen shows a localized retryable error

### Requirement: User can create a refuel
The frontend SHALL render `/refuels/create` with fields for car, date/time, station, optional odometer reading, fuel subtype, litres, and amount. It SHALL offer caller-owned cars, accept `carId` to preselect one, offer caller-owned station suggestions, and localize fuel choices. A valid submission SHALL create the refuel and navigate to the list; a field validation error SHALL remain on the form with its values preserved.

#### Scenario: User creates from a car context
- **WHEN** the user visits `/refuels/create?carId=<id>` for their car
- **THEN** that car is preselected

#### Scenario: A field is rejected
- **WHEN** creation returns a field validation error
- **THEN** the form localizes it at that field and preserves entered values

### Requirement: User can edit or delete a refuel
The frontend SHALL render `/refuels/{refuelId}/edit` with the current values and creation fields except a fixed car. It SHALL provide two-step deletion. A saved edit or confirmed deletion SHALL return the user to the refuels list. A missing or non-owned refuel SHALL render a localized not-found or error state.

#### Scenario: User edits a refuel
- **WHEN** the user saves a changed refuel
- **THEN** the list reflects the saved value

#### Scenario: User confirms deletion
- **WHEN** the user explicitly confirms deletion
- **THEN** the refuel is deleted and the user returns to the list

### Requirement: Refuel screens are fully localized
Every refuel screen string, including subtype labels, chart labels, validation, and errors, SHALL be available in German and English.

#### Scenario: User switches language
- **WHEN** the user changes from English to German on a refuel screen
- **THEN** all its labels, chart labels, hints, and messages are German
