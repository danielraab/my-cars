# Proposal

## Why

The car detail screen's Expenses and Consumption tabs have a from/to date
range, but the `/refuels` (`SCR-13`), `/repairs` (`SCR-16`) and `/tickets`
(`SCR-19`) overviews don't. Those overviews always load every record the caller has. Over a few
years, the fuel-price chart gets crowded and the tables need many "load
more" clicks just to reach recent months. The API already filters all three
collections and the refuel chart by `carId`, `from` and `to`, so the
overviews can use the same range the car detail screen already has.

## What Changes

- **Date range on `/refuels`.** A from/to range filters the refuel table,
  its running total and the fuel-price chart. It works like the car detail
  range:
  - calendar dates in `?from=` / `?to=`;
  - `from` defaults to six months before today and `to` is open;
  - both boundary days are included in full in local time;
  - the backend does the filtering;
  - malformed values are ignored.
- **The `/refuels` car filter moves into the URL (`?carId=`).** It is now
  React state, so a reload keeps the dates but loses the car. An unknown or
  malformed `carId` falls back to "all cars".
- **Car filter and date range on `/repairs` and `/tickets`.** Both get the
  same car filter (`?carId=`) and date range. The table and running total
  show only matching records.
- **Intentional difference from legacy:** legacy `SCR-13`, `SCR-16` and
  `SCR-19` showed the caller's full history. All three overviews now default to the last
  six months, and the range can be widened. On `/refuels` this changes what
  users currently see.
- **Shared date-range pieces (move, not copy).**
  - The calendar-date helpers (`cars/date-range.ts`) move to a shared
    module.
  - The `DateRangeControl` becomes a shared component, controlled through
    props.
  - The `cars.detail.range.*` messages become shared messages.
  - The car detail screen switches to the shared pieces. Nothing visible
    changes there.
- **Localization.** New messages are added in German and English: the
  `/repairs` and `/tickets` car-filter labels and the empty states for a range with no
  matching records.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `frontend/refuels`: the list requirement adds the date range and moves
  the car filter and range into the URL.
- `frontend/repairs`: the list requirement adds a car filter and a date
  range, both kept in the URL.
- `frontend/tickets`: the list requirement adds a car filter and a date
  range, both kept in the URL.

`frontend/cars` does not change. Its "Expenses and Consumption share a date
range" requirement stays as written; only its implementation moves to the
shared pieces.

## Impact

- **API contract / backend:** no change. `GET /refuels`,
  `GET /refuels/chart`, `GET /repairs` and `GET /tickets` already accept `carId`, `from` and
  `to`. When `from` is set, the chart already measures each refuel's
  consumption against its predecessor, even one dated before `from`.
- **Frontend:**
  - `cars/date-range.ts` and its test move to a shared module.
  - A new shared `DateRangeControl` component, pulled out of
    `routes/_authenticated/cars/$carId/index.tsx`.
  - `routes/_authenticated/refuels/index.tsx`,
    `routes/_authenticated/repairs/index.tsx` and
    `routes/_authenticated/tickets/index.tsx` gain `validateSearch` and the
    toolbar controls.
  - Messages in `i18n/resources.ts`, plus the route tests.
- **Parity:** extends `SCR-13`, `SCR-16` and `SCR-19` beyond legacy. This proposal
  covers the deviation.
