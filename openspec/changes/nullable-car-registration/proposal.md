## Why

The legacy data that will be migrated contains a car with neither a first
registration date nor a license plate. The legacy app never required either
field: its Sequelize model and migration allow `NULL`, and its API stores
whatever is sent. The rewrite made both mandatory, so that car cannot be
represented, and `legacy-data-import` cannot proceed until these fields are
optional again. Making them optional also restores legacy behaviour for new
cars.

## What Changes

- `cars.first_registration` and `cars.license_plate` become nullable in a new
  migration. The license plate keeps its "not blank" rule, but only when a
  value is present, the same rule `fin` follows.
- **BREAKING (contract):** `Car.firstRegistration` and `Car.licensePlate`
  become `string | null`. Both are dropped from `CarInput.required` and
  accept `null` in `CarInput` and `CarUpdate`. An update that sets either to
  `null` clears it, like `fin`, `purchaseDate` and `purchasePrice`.
- The backend create/update validation treats both members as nullable
  optionals. A blank license plate is still rejected (`empty`).
- The frontend car form marks both fields optional. A blank field is sent as
  `null`. The cars list, the car detail screen and the detail header show the
  existing localized "not recorded" placeholder when a value is absent, and
  the response guard in `api/client.ts` accepts `null` for both members.
- `docs/parity-checklist.md` notes that both fields are optional, matching
  the legacy model.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `api-contract/cars`: first registration and license plate join the set of
  optional, clearable car members.
- `persistence/schema`: a car may be stored without a first registration date
  or a license plate. A license plate, when present, must not be blank.
- `frontend/cars`: the create and edit forms treat both fields as optional,
  and the list and detail screens show a placeholder for absent values.

## Impact

- **Database:** new migration `000005` (up: `DROP NOT NULL` plus a relaxed
  plate check; down: restores `NOT NULL`, which fails while null rows exist).
- **Contract:** `openapi/openapi.yaml` and its backend copy; regenerated
  `frontend/src/api/schema.gen.ts`.
- **Backend:** `internal/cars` (handler validation, `Car`/`Input` types,
  `Update` SQL), plus tests.
- **Frontend:** `cars/car-form.tsx`, the `cars` list and detail routes,
  `api/client.ts`, and the related tests. No new strings; `cars.notRecorded`
  already exists in en and de.
- **Unblocks:** `legacy-data-import`.
