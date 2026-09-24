# Spec Delta

## Purpose

Defines ownership-scoped car management and per-car expense collections needed by the car list, detail, edit, and create frontend screens.

## ADDED Requirements

### Requirement: Caller can manage owned cars
The system SHALL document paginated `GET /api/v1/cars`, `POST /api/v1/cars`, `GET /api/v1/cars/{carId}`, `PATCH /api/v1/cars/{carId}`, and `DELETE /api/v1/cars/{carId}` operations. Car representations SHALL cover the legacy parity fields: type, make, name, fuel, first registration, license plate, FIN, active state, purchase date, and purchase price.

#### Scenario: Caller creates a car
- **WHEN** an authenticated caller submits a valid car creation request
- **THEN** the response is `201` with a car owned by that caller

#### Scenario: Caller deletes a car
- **WHEN** an authenticated caller deletes one of their cars
- **THEN** the response is `204` and its associated expenses are no longer accessible

### Requirement: Caller can retrieve a car's paginated expenses
The system SHALL document paginated, date-ordered `GET` operations for `/api/v1/cars/{carId}/refuels`, `/repairs`, and `/tickets`. Each operation SHALL accept the common cursor parameters and optional documented date-range filters.

#### Scenario: Caller views a car's recent refuels
- **WHEN** an authenticated caller requests a date range of an owned car's refuels
- **THEN** the response contains only matching refuels in deterministic date order
