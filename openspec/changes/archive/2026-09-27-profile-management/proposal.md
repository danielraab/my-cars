# Proposal

## Why

The authenticated shell links to `/profile`, but the route is still the
deferred placeholder and the backend does not serve the documented
`/api/v1/me` operations. Profile is the smallest vertical slice that turns
the existing account data into a working screen (`SCR-03`, `EP-34`,
`EP-35`). It also has to settle one security question before any later slice
builds on accounts: whether the email address can change. The email address
is the key that OIDC and magic-link logins use to find an account.

## What Changes

- Implement `GET /api/v1/me` and `PATCH /api/v1/me` in the backend, behind the
  existing cookie session.
- **BREAKING (contract only, not yet implemented anywhere):** the email
  address becomes read-only. `ProfileUpdate` in `openapi/openapi.yaml` no
  longer accepts `email`. A request that supplies it is rejected with `400`
  and a field-level validation error instead of being applied or silently
  ignored. The `409` occupied-email case is removed from `PATCH /me`.
- Constrain profile name updates: `firstName` and `lastName` are trimmed,
  may be empty, and are bounded in length. Unknown request fields are
  rejected.
- Replace the `/profile` placeholder with a localized (de/en) profile screen.
  It shows the email as read-only with an explanation, and offers a form for
  first and last name that reports field errors and success accessibly.
- Keep the shell's session state consistent with a saved profile.
- Drop the legacy decoded-token display from `SCR-03`, and record the drop as
  non-goal `NG-07` in `docs/parity-checklist.md`. There are no browser-visible
  tokens in the rewrite (`NG-06`).

## Capabilities

### New Capabilities

- `frontend/profile`: The authenticated profile screen. It displays the
  caller's email read-only and lets the caller edit their first and last name.

### Modified Capabilities

- `api-contract/profile`: The update operation no longer changes the email
  address. It rejects an `email` field and unknown fields with `400`, and
  defines trimming and length limits for names.

## Impact

- **API contract**: `openapi/openapi.yaml` (and its embedded copy
  `backend/openapi.yaml`) changes `ProfileUpdate` and the `PATCH /me`
  responses. The frontend's generated `schema.gen.ts` is regenerated.
- **Backend**: a new profile handler and account update query, mounted
  behind `RequireSession`. A shared JSON error writer is introduced that
  emits stable `code` values and `fields`. The existing auth handlers are
  not migrated in this change.
- **Frontend**: the `/profile` route, new API client functions, de/en
  messages, and tests. The placeholder remains for the other deferred
  feature routes.
- **Docs**: `docs/parity-checklist.md` gains `NG-07`.
- **Database**: no migration. `accounts.first_name`/`last_name` already exist.
- **Parity**: covers `SCR-03` (minus the claims dump, `NG-07`), `EP-34`,
  and `EP-35` (minus the email change).
