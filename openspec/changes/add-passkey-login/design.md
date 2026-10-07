# Design

## Context

See `proposal.md` for motivation and `specs/` for requirements.

Authentication lives in `backend/internal/auth`. `Service` registers the public
auth routes and wraps protected routes with `RequireSession`, which loads a
`Session` (account + expiry) by cookie digest. Every successful login funnels
through `establishSession`, which creates a `sessions` row (digest, account,
expiry, `created_at`) and sets the HttpOnly `SameSite=Lax` cookie. One-time
server-side state for OIDC and magic links is stored as digests with
`expires_at`/`consumed_at` and consumed by a conditional `UPDATE … RETURNING`.
`AUTH_BASE_URL` is validated to be a pure origin. The OpenAPI document exists
twice (`openapi/openapi.yaml`, `backend/openapi.yaml`) and is byte-synchronized
by a test; frontend types are generated from it. The shared `Error` schema
already carries a machine-readable `code`.

## Goals / Non-Goals

**Goals:**

- Reuse the existing session model and cookie; a passkey login is just another
  way to reach `establishSession`.
- Keep one-time ceremony state in the same digest/expiry/consumed pattern as
  OIDC and magic links.
- No browser token storage and no new configuration.

**Non-Goals:**

- Conditional-mediation (autofill) login, cross-device hybrid tuning, or
  attestation verification.
- Rate limiting and expired-row cleanup (follow-up `auth-rate-limit-and-cleanup`).
- Supporting the Vite dev origin or multiple origins.
- A post-login hint encouraging passkey creation.

## Decisions

### Use `github.com/go-webauthn/webauthn` on the backend

It is the maintained, widely used Go WebAuthn relying-party library, handles
CBOR/COSE parsing, signature verification, flags, and counters, and serializes
its options to the standard WebAuthn JSON shape. Hand-rolling WebAuthn
verification was rejected as security-sensitive and large.

Configuration: `RPID` = host of `AUTH_BASE_URL` (port stripped), `RPOrigins` =
`[AUTH_BASE_URL]`, `RPDisplayName` = the app name. Registration options use
`ResidentKey: required`, `UserVerification: required`, `Attestation: none`,
and `excludeCredentials` from the account's stored credentials. Login options
use an empty `allowCredentials` (discoverable flow) and
`UserVerification: required`; the account is resolved from the returned user
handle via the library's discoverable-login API, then cross-checked against the
credential's stored owner.

### WebAuthn user handle is the account UUID

The 16 bytes of `accounts.id` are opaque, stable, and contain no personal data,
so no extra column is needed. The user `name`/`displayName` shown by
authenticators is the account email (and full name when present).

### Schema: `webauthn_credentials`, `webauthn_challenges`, `sessions.credential_id`

```
webauthn_credentials
  id               UUID PK DEFAULT gen_random_uuid()  -- API identifier (passkeyId)
  credential_id    BYTEA NOT NULL UNIQUE              -- authenticator's raw ID
  account_id       UUID NOT NULL → accounts(id) ON DELETE RESTRICT
  public_key       BYTEA NOT NULL                     -- COSE key
  sign_count       BIGINT NOT NULL
  aaguid           BYTEA                              -- 16 bytes or NULL
  transports       TEXT[] NOT NULL DEFAULT '{}'
  backup_eligible  BOOLEAN NOT NULL
  backup_state     BOOLEAN NOT NULL
  name             TEXT NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 100)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  last_used_at     TIMESTAMPTZ

webauthn_challenges
  ceremony_digest  BYTEA PK CHECK (octet_length = 32)
  kind             TEXT NOT NULL CHECK (kind IN ('registration','login'))
  account_id       UUID → accounts(id)   -- NOT NULL iff kind = 'registration'
  session_data     JSONB NOT NULL         -- library SessionData (challenge etc.)
  expires_at       TIMESTAMPTZ NOT NULL
  consumed_at      TIMESTAMPTZ
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()

sessions
  + credential_id  UUID NULL → webauthn_credentials(id) ON DELETE SET NULL
```

A surrogate UUID is used in URLs instead of the raw credential ID (variable
length binary, awkward in paths). `ON DELETE SET NULL` is safe because the
delete operation revokes matching sessions in the same transaction before
removing the credential.

### Correlate ceremonies with a short-lived HttpOnly cookie

The options call creates a random ceremony token, stores only its digest with
the library's session data (5-minute expiry), and sets it in an HttpOnly,
Secure, `SameSite=Strict` cookie scoped to `/api/v1`. The finish call reads the
cookie, consumes the row with `UPDATE … SET consumed_at … WHERE consumed_at IS
NULL AND expires_at > now RETURNING`, and clears the cookie. Returning a
ceremony ID in JSON was rejected to keep all auth correlation out of
JavaScript-visible data, consistent with the session cookie. Separate cookie
names are used for registration and login so the two flows cannot collide.

### Fresh-login check uses `sessions.created_at`

`Store.Session` additionally returns the session's `created_at` and
`credential_id`, carried in the request context by `RequireSession`. Both
registration endpoints check `now - created_at <= 5m` before doing anything
else and otherwise write `403` with code `reauthentication_required`. Tracking
a separate "last authenticated at" timestamp was rejected: sessions are never
re-authenticated in place, so creation time is exactly the login time.

### Passkey login establishes the session in one transaction

`establishSession` gains an optional credential ID. The assertion handler
consumes the challenge, verifies the assertion, updates `sign_count` and
`last_used_at`, and creates the session row with `credential_id`. A
counter regression on a credential with a non-zero counter (clone warning) is
rejected; synced passkeys that always report 0 are accepted. The endpoint
returns `204` + cookie; the frontend navigates using its existing
`validReturnTo`, so no server-side return target is stored for passkey login.

### Deleting a credential revokes its sessions atomically

`DELETE /api/v1/passkeys/{passkeyId}` runs in one transaction:
`UPDATE sessions SET revoked_at = now WHERE credential_id = $1 AND revoked_at IS
NULL`, then deletes the credential scoped by `account_id`. If the caller's own
session was among those revoked, the response still is `204`; the cookie is
cleared in that case so the frontend's next session query yields `401`, which
it handles by navigating to login.

### Authenticator display name from a bundled AAGUID map

A trimmed copy of the community-maintained passkey AAGUID list (MIT licensed;
name only, no icons) is embedded in the backend and mapped at response time to
`authenticatorName`; unknown or zero AAGUIDs yield `null`. Fetching the list at
runtime was rejected (network dependency); FIDO MDS was rejected as
attestation-oriented and heavy.

### Frontend: small in-house base64url conversion, no new dependency

`navigator.credentials.create/get` need `ArrayBuffer`s while the API uses the
standard WebAuthn JSON shape. A small typed helper in `src/auth/passkeys.ts`
converts options from JSON and credentials to JSON (base64url ↔ ArrayBuffer).
Native `PublicKeyCredential.parse*OptionsFromJSON` was rejected because it is
missing in still-supported browser versions; `@simplewebauthn/browser` was
rejected as an extra dependency for ~50 lines of code. Support detection is
`window.PublicKeyCredential !== undefined`. A `NotAllowedError` from the browser
is treated as user cancellation.

### Registration naming

The finish request carries `{ name, credential }`. The frontend prefills the
name with a localized default (e.g. "Passkey" plus browser/OS hint), and the
user can change it inline after creation via rename. The backend trims and
validates `1..100` characters.

## Risks / Trade-offs

- [Passkeys do not work via the Vite dev server origin] → Documented known
  limitation; developers test through the backend origin (`AUTH_BASE_URL`).
- [Anonymous login-options calls insert rows] → Same exposure as magic-link
  requests today; addressed by the follow-up rate-limit/cleanup change.
- [Changing the deployment domain invalidates all passkeys (RP ID change)] →
  Magic link remains the recovery path; noted in backend README.
- [Stolen fresh session (< 5 min) can still add a passkey] → Window kept short;
  deleting the passkey revokes everything it created.
- [Clone-warning rejection could lock out a misbehaving authenticator] → Magic
  link remains available; the user can delete and re-register the passkey.
- [AAGUID map goes stale] → Purely cosmetic; unknown models show no name.

## Migration Plan

Additive migration `000006_passkeys` (new tables, nullable column); the down
migration drops the column and tables. No data backfill. Rollback of the binary
leaves unused tables in place harmlessly.
