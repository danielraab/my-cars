# Design

## Context

The Go binary currently runs the server by default and has a `healthcheck` subcommand. Postgres has account, car, expense, and authentication tables with foreign keys; `schema_migrations` tracks applied versions. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** Isolate the seed command from server-only configuration; provide a complete, atomic reset and realistic per-car chronology.

**Non-Goals:** Login credentials or sessions for seeded users; deterministic fixtures for assertions; changing the API or schema.

## Decisions

- Use `backend seed <email> [email...]` with positional addresses; validate all before connection. Read only `DATABASE_URL` for this mode and apply embedded migrations before starting. This avoids requiring SMTP or HTTP configuration for a database utility. Alternatives: a separate binary or all server configuration, both add friction.
- `TRUNCATE` the explicit application tables (including authentication state) in dependency-aware Postgres transaction with `RESTART IDENTITY` unnecessary for UUID IDs. Keep `schema_migrations` intact. Transaction rollback covers insert failures; a broad `public` truncation could accidentally erase future unrelated tables.
- Generate cars and records in Go using a local RNG, with time offsets spread evenly across five years plus small jitter. Allocate each record round-robin across the account's cars, derive increasing odometer per car from elapsed time, and use varied station, amounts, and enum values. Use parameterized inserts via pgx; roughly 3,000 rows per five accounts are manageable without bulk-loading infrastructure.

## Risks / Trade-offs

- [Destructive command pointed at the wrong database] → Make the reset behavior prominent in help and docs, print the target database name and final counts; require explicit `seed` and emails.
- [Future application tables are omitted] → Maintain an explicit table list and integration test covering the current schema; update alongside migrations.
- [Long-running concurrent requests during truncate] → Transaction takes table locks until commit; run on a development/test database while the app is idle.
