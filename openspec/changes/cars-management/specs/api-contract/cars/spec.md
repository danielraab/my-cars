# Spec Delta

## MODIFIED Requirements

### Requirement: Caller can manage owned cars
The system SHALL document paginated `GET /api/v1/cars`, `POST /api/v1/cars`, `GET /api/v1/cars/{carId}`, `PATCH /api/v1/cars/{carId}`, and `DELETE /api/v1/cars/{carId}` operations. Car representations SHALL cover the legacy parity fields: type, make, name, fuel, first registration, license plate, FIN, active state, purchase date, and purchase price. The car fuel field SHALL accept only the stable codes `other`, `diesel`, `gasoline`, and `electric`. `CarInput` and `CarUpdate` SHALL reject any request member outside their documented properties with `400` and the common validation error representation identifying the offending member. FIN, purchase date, and purchase price SHALL be optional and SHALL be clearable by an update that sets them to `null`. A car representation SHALL always contain every documented member, using `null` for an optional value that is not recorded.

#### Scenario: Caller creates a car
- **WHEN** an authenticated caller submits a valid car creation request
- **THEN** the response is `201` with a car owned by that caller

#### Scenario: Caller supplies an unsupported car fuel
- **WHEN** an authenticated caller submits a car creation or update request
  with a fuel value outside the documented codes
- **THEN** the response is `400` with the common validation error representation

#### Scenario: Caller supplies an undocumented field
- **WHEN** an authenticated caller submits a car creation or update request
  with a member outside `CarInput`/`CarUpdate`'s documented properties
- **THEN** the response is `400` with the common validation error
  representation identifying that member, and no car is created or changed

#### Scenario: Caller clears an optional car field
- **WHEN** an authenticated caller updates one of their cars with `fin`,
  `purchaseDate`, or `purchasePrice` set to `null`
- **THEN** the response is `200` and that member is `null` in the returned car

#### Scenario: Caller deletes a car
- **WHEN** an authenticated caller deletes one of their cars
- **THEN** the response is `204` and its associated expenses are no longer accessible

#### Scenario: Caller requests another caller's car
- **WHEN** an authenticated caller retrieves, updates, or deletes a car
  owned by a different account, or one that does not exist
- **THEN** the response is `404` with the common error representation, with
  no distinction between the two cases

### Requirement: Caller can retrieve a car's paginated expenses
The system SHALL document paginated, date-ordered `GET` operations for `/api/v1/cars/{carId}/refuels`, `/repairs`, and `/tickets`. Each operation SHALL accept the common cursor parameters and optional documented date-range filters.

#### Scenario: Caller views a car's recent refuels
- **WHEN** an authenticated caller requests a date range of an owned car's refuels
- **THEN** the response contains only matching refuels in deterministic date order
