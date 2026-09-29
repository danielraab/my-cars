## MODIFIED Requirements

### Requirement: Tickets list shows the caller's tickets, paginated, with a running total
The frontend SHALL render the `/tickets` route inside the authenticated
application shell and SHALL load the caller's tickets from the documented
paginated tickets operation. Each row SHALL show date, car (linked to that
car's detail screen), type (localized), location, and amount, and the
screen SHALL show a running sum of the amount of every row loaded so far.
The screen SHALL provide a localized caller-car filter and a localized
date-range control with a "from" date and an optional "to" date, and SHALL
apply both to the tickets operation. While the first page loads it SHALL
show a localized loading state, a load failure SHALL show a localized
error with a retry action, and when the selected car and range match no
tickets it SHALL show a localized empty state. When a further page is
available the screen SHALL offer a localized action to load it, appending
the results to the visible list and updating the running sum without
discarding what is already shown. Each row SHALL link to that ticket's
edit screen, and the screen SHALL offer a localized action to create a new
ticket.

The car filter and range SHALL be reflected in the URL's `carId`, `from`,
and `to` search parameters, with `from` and `to` as calendar dates
(`YYYY-MM-DD`). When `carId` is absent or malformed, all of the caller's
cars SHALL be shown. When `from` is absent, it SHALL default to the date
six months before today in the user's local time zone; when `to` is
absent, the range SHALL be open-ended. Both boundary days SHALL be
included in full in the user's local time zone. A malformed `from` or
`to` value SHALL be treated as absent. The filter and range SHALL be
applied by the backend query, not by filtering already-loaded rows.

#### Scenario: User opens the tickets list
- **WHEN** an authenticated user navigates to `/tickets` without search
  parameters
- **THEN** the screen shows the documented columns for each of the
  caller's tickets dated from six months ago onward, across all cars, a
  running sum of their amounts, and a link to create a new ticket

#### Scenario: User filters by car
- **WHEN** the user selects one of their cars
- **THEN** the URL carries that car's `carId`, and the list and running
  sum contain only that car's tickets within the selected range

#### Scenario: User narrows the range
- **WHEN** the user sets "from" to 2026-01-01 and "to" to 2026-01-31
- **THEN** the URL carries `from=2026-01-01&to=2026-01-31`, and the
  tickets operation is requested from the start of 2026-01-01 up to but
  excluding the start of 2026-02-01 in local time

#### Scenario: Filter survives a reload
- **WHEN** the user reloads `/tickets?carId=<id>&from=2025-01-01`
- **THEN** the car filter shows that car, the range starts at 2025-01-01,
  and the tickets operation uses both

#### Scenario: No tickets in the range
- **WHEN** the selected car and range match no tickets
- **THEN** the screen shows a localized empty state for the range

#### Scenario: User loads a further page
- **WHEN** the selected tickets have more rows than the first page
  returned and the user activates the load-more action
- **THEN** the additional tickets are appended to the visible list and the
  running sum includes them

#### Scenario: Tickets list cannot be loaded
- **WHEN** the tickets operation fails with a transport or server error
- **THEN** the screen shows a localized error with a retry action
