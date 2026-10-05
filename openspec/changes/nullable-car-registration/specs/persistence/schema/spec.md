# Spec Delta

## ADDED Requirements

### Requirement: Car registration details are optional
The system SHALL persist a car without a first registration date, without a
license plate, or without both. A stored license plate SHALL NOT be blank.

#### Scenario: A car without registration details is stored
- **WHEN** a car is persisted with no first registration date and no license
  plate
- **THEN** the car is stored and both values are absent

#### Scenario: A blank license plate is stored
- **WHEN** a car is persisted with a license plate consisting only of
  whitespace
- **THEN** the write is rejected and no car is stored or changed
