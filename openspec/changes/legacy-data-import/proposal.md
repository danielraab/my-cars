## Why

The rewrite is going to replace the legacy deployment, and the legacy
MariaDB holds the real data: 2 users, 3 cars, 142 refuels, 7 repairs and
9 tickets, exported as a `mysqldump` file (`dump.sql`, git-ignored). The
persistence spec already requires a separate, reviewable one-time import that
validates before writing and never silently invents values. This change
builds it.

## What Changes

- New backend subcommand `import-legacy <dump.sql> [--dry-run]` in the
  existing server binary, next to `seed`.
- It parses the `mysqldump` file directly. No MariaDB instance or MySQL
  driver is needed.
- Every row is validated and mapped to the v1 schema before anything is
  written. Any problem aborts the run.
- `--dry-run` runs only that validation and prints **only the problems**,
  one line per offending row and column. It prints a single "no problems"
  line when there are none.
- **One-time:** the command refuses to run unless the target database is
  fresh (no accounts, cars or expenses). The import writes everything in one
  transaction, so a successful run makes every later run refuse.
- Legacy numeric ids are mapped to new UUIDs through an **in-memory** lookup
  table that exists only while the command runs. Nothing about the legacy ids
  is stored.
- Explicit transformations:
  - a purchase price of `0` becomes empty (`null`);
  - a missing first registration date or license plate stays empty;
  - email addresses are lowercased and trimmed;
  - legacy category labels map to the stable codes;
  - `createdAt`/`updatedAt` are preserved.
- Legacy password hashes, verification/reset tokens and refresh tokens are
  dropped. Users log in afterwards with magic link or OIDC using the same
  email, which resolves to the imported account.

## Capabilities

### New Capabilities

- `platform/legacy-data-import`: the `import-legacy` command, including its
  fresh-database precondition, dump parsing, mapping rules, problem report,
  dry-run mode and atomic write.

### Modified Capabilities

_None._ This change implements the existing `persistence/schema` requirement
"Legacy import remains a separate, reviewable operation" without changing it.

## Impact

- **Depends on:** `nullable-car-registration`. Legacy car 3 has neither a
  registration date nor a plate, and the import cannot run until that change
  has landed.
- **Backend:** new package `internal/legacyimport` (dump parser, mapper,
  writer) and subcommand wiring in `main.go`. No new dependencies.
- **Database:** no schema change.
- **API / frontend:** none.
- **Operations:** the dump file has to be readable by the binary (in Docker,
  a bind mount). It contains personal data, so it stays out of git and should
  be deleted after the import.
