# Tasks

Prerequisite: `nullable-car-registration` is applied.

## 1. Dump parser

- [ ] 1.1 Add `backend/internal/legacyimport/dump.go` (D2): parse the
  `CREATE TABLE` column lists, multi-row `INSERT INTO ... VALUES` statements
  (MySQL string escapes, `NULL`, numeric literals kept as text) and the
  `TIME_ZONE` header into `map[table][]Row`. Unrecognized syntax inside an
  imported table's `INSERT` is returned as an error with its line number.
- [ ] 1.2 Add a synthetic fixture `internal/legacyimport/testdata/dump.sql`
  in real `mysqldump` 10.6 format (all five tables plus `RefreshTokens` and
  `SequelizeMeta`, fake data only). Write parser tests covering escapes,
  multi-line statements, reordered columns, a missing table and a bad
  time-zone header.

## 2. Mapping and validation

- [ ] 2.1 Add `mapper.go` (D3, D4, D6): `Map(Dump) (Plan, []Problem)` with
  the category tables, the conversions and the in-memory `users`/`cars` id
  maps. The UUIDs are generated in Go.
- [ ] 2.2 Write table-driven tests for every rule in the spec. These include
  the unknown category, the blank required text, the missing or unknown
  `UserId`/`CarId`, the duplicate normalized email, the non-midnight date,
  the non-plain decimal, `liters <= 0`, purchase price `0`→`null`, the missing
  plate and registration, and blank description→`null`. Also assert that
  problems collect across all rows (no early exit) and that no `Problem`
  ever contains `hashedPassword`/`specialToken` values.

## 3. Writer

- [ ] 3.1 Add `writer.go` (D5): one transaction with a table lock, the
  fresh-database check across `accounts, cars, refuels, repairs, tickets`, and
  `CopyFrom` per table in foreign-key order with explicit `id`,
  `created_at`, `updated_at`. Return the per-table counts.
- [ ] 3.2 Write integration tests against the test Postgres (same harness as
  `seed_test.go`): a fresh DB imports the fixture with the expected counts and
  ownership; a non-fresh DB is refused with nothing written; a second run is
  refused; a forced mid-copy failure leaves no rows; an imported email logs
  in to the same account through the auth store's upsert.

## 4. Command

- [ ] 4.1 Wire `import-legacy <path> [--dry-run]` in `backend/main.go` next to
  `seed`. Print usage on a missing path. Dry run: no `DATABASE_URL` needed,
  print problems or a single "no problems" line, and exit non-zero on
  problems. Real run: migrate, map, print problems and exit non-zero, or
  write and print counts.
- [ ] 4.2 Add a `main_test.go` case for argument handling. Verify that
  `go test ./...` and `go vet ./...` pass.

## 5. Docs and dry run on real data

- [ ] 5.1 Document the command and the migration plan steps in
  `backend/README.md`, including the Docker bind-mount example and the "no
  logins before import" warning.
- [ ] 5.2 Run `import-legacy dump.sql --dry-run` against the real (ignored)
  dump and confirm "no problems". Then run the real import against a local
  fresh database and confirm 2/3/142/7/9 rows and correct ownership. Do not
  commit the dump or any output containing its data.
