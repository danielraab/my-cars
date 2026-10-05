## Context

The legacy app (Sequelize on MariaDB 10.6) is being replaced. Its data
arrives as a `mysqldump` file. Its content profile at proposal time:

| Legacy table   | Rows | Target            |
|----------------|------|-------------------|
| Users          | 2    | `accounts`        |
| Cars           | 3    | `cars`            |
| Refuels        | 142  | `refuels`         |
| Repairs        | 7    | `repairs`         |
| Tickets        | 9    | `tickets`         |
| RefreshTokens  | 0    | dropped           |
| SequelizeMeta  | 6    | dropped           |

Observed in this dump:
- the session time zone is `+00:00`;
- calendar-date columns are at midnight UTC;
- float literals have at most 2 decimals;
- every category label is in the legacy enum (`old/lib/types/*.ts`);
- one car has neither a first registration nor a plate (handled by
  `nullable-car-registration`), and one has purchase price `0`.

The v1 schema uses UUID keys, Postgres enums for categories, `NUMERIC`
amounts and `NOT NULL` constraints on most expense columns
(`000002_domain_schema.up.sql`). `seed` is the existing precedent for a
data-writing subcommand: it runs migrations, opens a pool, and works in one
transaction.

## Goals / Non-Goals

**Goals:**
- A deterministic, reviewable, all-or-nothing import of this dump.
- Every transformation is written down (spec) and nothing is guessed.
- No MariaDB dependency at import time.

**Non-Goals:**
- Incremental, repeated or merging imports. It runs once, into a fresh
  database.
- Importing credentials, sessions or legacy auth state.
- A general-purpose SQL parser. It only needs to handle `mysqldump` output
  for these tables.
- Any UI or HTTP endpoint for the import.

## Decisions

### D1. Subcommand in the server binary
`main.go` dispatches `import-legacy` the same way it dispatches `seed`:
`server import-legacy <path> [--dry-run]`. Without `--dry-run`, it requires
`DATABASE_URL` and runs `db.RunMigrations` first. Dry run needs no database.
This keeps the import in the same image and config as the app.

*Alternative:* a separate `cmd/` binary. Rejected because it needs extra build
and Dockerfile wiring for a command that runs once.

### D2. Parse the dump directly (`internal/legacyimport/dump.go`)
The parser is a line-oriented scanner over the file:
- It reads `CREATE TABLE \`T\` (` blocks and collects backticked column names
  until the first `PRIMARY KEY`/`KEY`/`CONSTRAINT` line, giving the column
  order for each table.
- It tokenizes `INSERT INTO \`T\` VALUES (...),(...);` statements with a small
  state machine. Values are `NULL`, a bare numeric literal (kept as its
  literal text), or a single-quoted string with MySQL escapes (`\\ \' \" \n
  \r \t \0 \Z` and `''`). A statement may span several lines.
- It checks the `SET TIME_ZONE='+00:00'` header.

Each row becomes `map[column]Value`, where `Value` holds the literal text and
an `IsNull` flag. Rows from tables that are not imported are skipped.

*Alternative:* load the dump into a temporary MariaDB and read it with a
driver. Rejected because it needs a container and a new dependency for about
160 rows, and the dump format is stable and simple.

### D3. Two phases: validate everything, then write
`Map(dump) (Plan, []Problem)` is a pure function. It builds the insert plan
for every table and collects all problems; it does not stop at the first
one. Each problem is `{Table, LegacyID, Column, Value, Reason}`. The dry run
prints problems, or the "no problems" line. The real run prints the problems
and exits non-zero if there are any; otherwise it writes the plan. Because
`Map` has no I/O, the mapping rules can be unit-tested with table-driven
cases and no database.

`hashedPassword` and `specialToken` are never read into a `Problem`, because
the Users mapper does not touch them.

### D4. In-memory id mapping, generated UUIDs
`Map` assigns UUIDs in Go (`crypto/rand` v4, the same shape as
`gen_random_uuid()`) and keeps `users map[uint64]uuid` and
`cars map[uint64]uuid` for resolving `UserId`/`CarId`. Because ids are known
before writing, inserts are plain `INSERT`s with explicit ids and no
`RETURNING` round trips, and the maps are discarded when the process exits.

### D5. Fresh-database guard and transaction
In one transaction:
1. `LOCK TABLE accounts, cars, refuels, repairs, tickets IN SHARE ROW
   EXCLUSIVE MODE`;
2. check every table with `SELECT EXISTS (...)`, and abort with "database is
   not fresh: <table> has rows" if any has rows;
3. `COPY` (`pgx.CopyFrom`) accounts, then cars, refuels, repairs and tickets,
   in foreign-key order;
4. commit.

The lock closes the gap between the check and the insert. It matters little
for a one-off run, but costs nothing. `created_at`/`updated_at` are supplied
explicitly; the `set_updated_at` triggers are `BEFORE UPDATE` only, so they
don't fire.

Sessions, OIDC identities and login attempts are not checked. They can't
exist without accounts (FK `RESTRICT`), and the attempt tables carry no
data that the import affects.

*Alternative:* a marker table recording that the import ran. Rejected
because the user wants nothing about the import persisted, and an empty
database is the actual precondition.

### D6. Value conversion
- Timestamps: `YYYY-MM-DD HH:MM:SS` parsed as UTC → `time.Time`.
- Dates: the same, then they must be at `00:00:00` and become
  `YYYY-MM-DD`. A non-midnight value is a problem instead of being truncated,
  because truncating could hide a time-zone shift.
- Decimals: the literal must match `^-?\d+(\.\d+)?$` and is passed as text
  to `::numeric`, so binary float rounding is never involved. Purchase price
  `0` (any form, for example `0`, `0.0`) → `NULL`.
- Booleans: `0`/`1`, with `NULL` → default.
- Text: trimmed only for blank checks and email normalization. Other text is
  stored as is.

## Risks / Trade-offs

- [A future dump uses `mysqldump` features the parser doesn't handle, such
  as extended hex literals or `_binary` prefixes] → anything unrecognized is
  a parse problem, never a silent skip. Tests run the parser against a
  checked-in synthetic fixture shaped like the real dump. The real file stays
  out of git.
- [The dump is regenerated later with different data] → the dry run is meant
  to be repeated just before the real run. Mapping rules are strict, so new
  edge cases show up as problems.
- [Personal data in console output] → problem lines show only the offending
  column's value. Credentials are never read into problems (D3).
- [Unverified legacy users (`isVerified = 0`) become regular accounts] →
  accepted. Login still requires controlling the email (magic link or OIDC),
  so an imported account confers no access by itself. Both users in the
  current dump are verified.

## Migration Plan

1. Land `nullable-car-registration`.
2. Deploy the new image against an empty database. The app may be running,
   but nobody should log in before the import, since logging in creates an
   account and the database is then no longer fresh.
3. `server import-legacy /path/dump.sql --dry-run` → must print "no
   problems".
4. `server import-legacy /path/dump.sql` → check the printed counts (2/3/142/7/9).
5. Log in as each legacy user and spot-check the cars list and the
   dashboard.
6. Delete `dump.sql` from the host.

Rollback: before anyone uses the app, the import can be undone by truncating
the domain and account tables, or by running `seed`-style truncation, and
then re-running it.
