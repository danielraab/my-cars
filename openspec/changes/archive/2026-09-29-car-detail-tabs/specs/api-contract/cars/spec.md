# Spec Delta

## REMOVED Requirements

### Requirement: Caller can retrieve a car's paginated expenses
**Reason**: The per-car paths `/api/v1/cars/{carId}/refuels`, `/repairs`
and `/tickets` were placeholders that were never implemented and have no
typed response. The car-filtered, date-bounded collection operations
already cover everything they would have served.
**Migration**: Request `GET /api/v1/refuels`, `GET /api/v1/repairs` or
`GET /api/v1/tickets` with the `carId` query parameter and the optional
`from`/`to` range. For consumption charts use `GET /api/v1/refuels/chart`
with the same parameters.
