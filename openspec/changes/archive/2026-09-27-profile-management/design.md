# Design

## Context

- The backend serves only `auth/*` and `session`. Everything else under
  `/api/` currently falls through to `http.NotFound`
  (`backend/internal/httpserver/mux.go`).
- `auth.Service.RequireSession` already resolves the session cookie and
  stores the `Account` (id, email, first name, last name) in the request
  context. `auth.AccountFromContext` exposes it. The account is re-read from
  the database on every request.
- `auth.writeError` emits `code: http.StatusText(status)` (e.g. `"Bad
  Request"`) and never `fields`. That does not meet the stable-code and
  field-detail rule in `api-contract/common`. This is the first endpoint that
  needs field-level validation errors.
- The frontend already has an `ApiError` class carrying `status`, `code`, and
  `fields`, a react-query `['session']` query used by the shell, and a
  deferred `/profile` route.
- `openapi/openapi.yaml` is the source of truth. `backend/openapi.yaml` must
  be byte-identical (enforced by `openapi_sync_test.go`), and
  `frontend/src/api/schema.gen.ts` is generated from it (`pnpm check:api`).
- `accounts.first_name`/`last_name` are `TEXT NOT NULL DEFAULT ''`. There is
  no length constraint in the database.

## Goals / Non-Goals

**Goals:**

- A small, reusable backend pattern for session-scoped JSON resource handlers
  and validation errors, which the cars slice can copy.
- A frontend pattern for a data-backed form (query, mutation, field errors,
  cache updates) that later forms can copy.

**Non-Goals:**

- Migrating the auth handlers to the new error writer. They keep their
  current bodies. Aligning them is a separate small fix.
- Any email change flow, including a verified one. Recording it as future
  work is enough.
- A database constraint on name length. The limit is enforced by the API
  only.
- A form library dependency.

## Decisions

### D1. New `internal/profile` package, mounted behind `RequireSession`

`profile.Handler` holds a small `Repository` interface
(`UpdateAccountNames(ctx, accountID, first, last *string) (auth.Account,
error)`) with a pgx-backed implementation. `main.go` registers
`GET /api/v1/me` and `PATCH /api/v1/me` wrapped in
`authService.RequireSession`.

- `GET` returns the context account directly. There is no second query,
  because `RequireSession` just read it.
- `PATCH` runs a single
  `UPDATE accounts SET first_name = COALESCE($2, first_name), last_name =
  COALESCE($3, last_name), updated_at = now() WHERE id = $1 RETURNING …`.
  Nil pointers leave a column unchanged, and empty strings are written.

*Alternative considered*: putting the handlers inside `internal/auth`. That
was rejected because auth is about establishing identity, not about account
data, and cars and expenses will follow the one-package-per-resource shape.

### D2. Shared `internal/apierror` writer with stable codes and field reasons

Add `apierror.Write(w, status, code, message, fields map[string]string)` and
a `Validation(fields)` convenience. Stable codes used here:
`validation_failed`, `unauthorized`, and `internal_error`. Field values are
**machine-readable reason codes**, not prose, so the frontend can localize
them:

| Reason | Meaning |
|---|---|
| `read_only` | The field exists but cannot be changed (`email`) |
| `unknown` | The member is not part of the request schema |
| `invalid_type` | The member has the wrong JSON type (e.g. `null` or a number for a name) |
| `too_long` | The value exceeds the documented maximum length |
| `required` | The body has no documented member (reported on the key `_body`) |

The OpenAPI `Error.fields` description documents these reasons.

*Alternative considered*: English messages in `fields`. That was rejected
because the frontend must show German, and matching on prose is brittle.

### D3. Decode `PATCH` bodies into `map[string]json.RawMessage`

The body is capped with `http.MaxBytesReader` (16 KiB). Malformed JSON or a
non-object body returns `400 validation_failed` with no fields.

Each key is then classified. `email` is `read_only`, other unknown keys are
`unknown`, and `firstName`/`lastName` are strings, trimmed with
`strings.TrimSpace`, whose length is counted in runes (`utf8.RuneCountInString`,
at most 100). Every offending field is collected before responding, so the
client sees all errors at once. Nothing is written if any field is invalid.

*Alternative considered*: a struct with `DisallowUnknownFields`. That was
rejected because it stops at the first unknown key and cannot distinguish
`email` (read-only) from arbitrary unknown members, nor absent from `null`.

### D4. Contract edits

- `ProfileUpdate`: remove `email`. Add `additionalProperties: false`,
  `maxLength: 100` on both names, and keep `minProperties: 1`.
- `PATCH /me`: remove the `409` response. Describe the `email` rejection in
  the operation description.
- `Error.fields`: document the reason codes from D2.
- Regenerate `schema.gen.ts` and copy the file to `backend/openapi.yaml`.

The contract is changed in the same commit as the handler, so
`openapi_sync_test.go` and `check:api` stay green.

### D5. Frontend: `['me']` query plus a mutation that also updates the session cache

- New client functions `getMe()` and `updateMe(input)` in
  `src/api/client.ts`, following the existing shape-guard pattern
  (`isProfile`).
- `/profile` uses `useQuery({ queryKey: ['me'], queryFn: getMe })`.
- The form uses plain controlled inputs. On a successful `useMutation`, the
  returned profile is written with `setQueryData(['me'], profile)` and
  `setQueryData(['session'], s => s && { ...s, profile })`. The
  authenticated layout subscribes to the `['session']` query (falling back
  to its `beforeLoad` context value), so the shell updates without
  refetching.
- The form re-initializes from the saved profile. An `ApiError` with status
  `400` maps `fields.firstName`/`fields.lastName` reasons to localized
  messages (`profile.fieldErrors.too_long`, `invalid_type`, or a generic
  fallback), rendered with
  `aria-describedby`/`aria-invalid`. Any other error shows a form-level alert
  and leaves the inputs untouched. Success is announced through a
  `role="status"` region.
- The email is rendered as text in a description list, not a disabled input.
  A disabled input is skipped by some screen readers, and it invites people
  to try editing it. It carries a short hint (`profile.emailHint`).

*Alternative considered*: reading the profile from the `['session']` query.
That was rejected because the page should exercise its own documented
operation, and a later email-verification flow would diverge from session
data anyway.

### D6. Parity documentation

Add `NG-07` to `docs/parity-checklist.md`: *"Decoded token claims on the
profile screen."* `SCR-03` dumps the JWT's claims (`iat`/`exp`). The rewrite
has no browser-visible token (`NG-06`), so there is nothing to show. The
screen shows name and email only.

Also note on `EP-35` that email changes are deliberately not ported (see
`api-contract/profile`). This is recorded as part of `NG-07`'s rationale
rather than as a separate id.

## Risks / Trade-offs

- **Inconsistent error bodies between auth (`"Bad Request"` codes) and
  profile (`validation_failed`).** → The frontend already falls back
  gracefully on unknown codes. A follow-up fix migrates `auth.writeError` to
  `apierror`, and this is listed in the task list's follow-ups rather than
  done here.
- **Users with a mistyped or outdated email address have no self-service
  fix.** → Accepted for now (a product decision). Recovery is an operator
  database edit. A verified email-change flow can be proposed later without
  breaking this contract, because it would be a separate operation.
- **The length is counted in runes rather than grapheme clusters.** → This is
  good enough for a sanity bound. It is documented as "characters" in the
  contract.
- **Two caches (`['me']` and `['session']`) could drift.** → Both are written
  from the same mutation result, and the session query already refetches
  after its 30 s `staleTime`.

## Migration Plan

No data migration. The deploy is a single binary, as usual. Rollback means
reverting the commit. No existing client sends `email` to `PATCH /me`,
because the endpoint was never served.
