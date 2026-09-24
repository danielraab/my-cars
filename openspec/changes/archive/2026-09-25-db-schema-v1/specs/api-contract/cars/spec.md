# Spec Delta

## MODIFIED Requirements

### Requirement: Caller can manage owned cars
The system SHALL document paginated `GET /api/v1/cars`, `POST /api/v1/cars`, `GET /api/v1/cars/{carId}`, `PATCH /api/v1/cars/{carId}`, and `DELETE /api/v1/cars/{carId}` operations. Car representations SHALL cover the legacy parity fields: type, make, name, fuel, first registration, license plate, FIN, active state, purchase date, and purchase price. The car fuel field SHALL accept only the stable codes `other`, `diesel`, `gasoline`, and `electric`.

#### Scenario: Caller creates a car
- **WHEN** an authenticated caller submits a valid car creation request
- **THEN** the response is `201` with a car owned by that caller

#### Scenario: Caller supplies an unsupported car fuel
- **WHEN** an authenticated caller submits a car creation or update request
  with a fuel value outside the documented codes
- **THEN** the response is `400` with the common validation error representation

#### Scenario: Caller deletes a car
- **WHEN** an authenticated caller deletes one of their cars
- **THEN** the response is `204` and its associated expenses are no longer accessible
