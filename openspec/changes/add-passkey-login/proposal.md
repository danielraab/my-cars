# Proposal

## Why

Logging in currently requires either an OIDC provider round-trip or waiting
for a magic-link email. Passkeys (WebAuthn discoverable credentials) give
returning users a fast, phishing-resistant login bound to the application's
origin, without passwords and without changing the existing account model.
Passkeys are not part of the legacy app and not covered by
`docs/parity-checklist.md`, so they need their own proposal.

## What Changes

- An authenticated user can register one or more passkeys for their account
  from the profile screen, list them, rename them, and delete them.
- Registering a passkey requires a **fresh login**: the current session must
  have been established at most 5 minutes ago (by any login method). The
  profile screen states this requirement and offers a re-login path when the
  session is too old.
- Deleting a passkey is always allowed without a fresh login. Deleting it also
  ends every session that was established with that passkey.
- The login screen offers "Sign in with a passkey" using discoverable
  credentials (no email entry). A successful assertion establishes the same
  HttpOnly cookie session as OIDC and magic links.
- A passkey never creates an account and never resolves through email; it is
  bound to the account that registered it. The magic link remains available
  as a recovery path, so deleting the last passkey cannot lock a user out.
- `GET /api/v1/auth/methods` additionally reports `passkey`.
- Passkeys are always enabled; the relying-party ID and expected origin are
  derived from the existing `AUTH_BASE_URL`. No new configuration.
- Attestation is not requested (`none`); the authenticator model identifier
  (AAGUID) and backup flags are stored for display only.
- Known limitation: passkeys only work when the app is opened via the
  `AUTH_BASE_URL` origin, so they do not work through the Vite dev server.
- Out of scope (follow-up change `auth-rate-limit-and-cleanup`): per-IP rate
  limiting of all public authentication endpoints behind the reverse proxy and
  periodic cleanup of expired authentication rows. Also out of scope: any
  post-login hint nudging users to create a passkey.

## Capabilities

### New Capabilities

- `authentication/passkeys`: backend passkey behavior — registration and
  assertion ceremonies, challenge lifecycle, fresh-login requirement for
  registration, credential management, and session revocation on deletion.
- `frontend/passkeys`: passkey management section on the profile screen,
  localized in German and English.

### Modified Capabilities

- `api-contract/authentication`: document the passkey login and management
  operations, add `passkey` to the reported authentication methods, and widen
  the allowed authentication methods beyond OIDC and magic links.
- `authentication/passwordless-service`: browser sessions record which passkey
  (if any) established them, so that sessions can be revoked per credential.
- `frontend/authentication`: the login screen offers passkey sign-in when the
  backend reports `passkey` and the browser supports WebAuthn.

## Impact

- **Backend**: new dependency `github.com/go-webauthn/webauthn`; new passkey
  handlers in `internal/auth`; `establishSession` gains an optional credential
  reference; session freshness check.
- **Database**: new migration adding `webauthn_credentials`,
  `webauthn_challenges`, and a nullable `sessions.credential_id`.
- **API**: additive OpenAPI operations and schemas in both synchronized OpenAPI
  documents; `passkey` added to the method-code enum; generated frontend types
  regenerated.
- **Frontend**: profile screen passkey section, login button, WebAuthn JSON
  (de)serialization helper, de/en translations.
- **Security**: a stolen but older session cookie cannot be used to add a
  persistent passkey; anonymous ceremony starts add rows until the follow-up
  rate-limit/cleanup change lands (same exposure as magic-link requests today).
