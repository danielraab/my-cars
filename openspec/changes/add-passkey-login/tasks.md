# Tasks

## 1. Contract and schema

- [ ] 1.1 Add the passkey login, management, and registration operations, the `PasskeySummary` and request schemas, the `reauthentication_required` 403 response, and `passkey` in the method-code enum to both synchronized OpenAPI documents; verify `pnpm lint:openapi` and the backend OpenAPI sync test pass.
- [ ] 1.2 Add migration `000006_passkeys` creating `webauthn_credentials`, `webauthn_challenges`, and nullable `sessions.credential_id` with the constraints from design.md, plus its down migration; verify migration up/down tests pass against Postgres.

## 2. Backend passkey core

- [ ] 2.1 Add `github.com/go-webauthn/webauthn` and construct the relying party from `AUTH_BASE_URL` (RP ID = host, single origin); verify unit tests cover RP ID/origin derivation with and without a port.
- [ ] 2.2 Implement store methods for ceremony challenges (create, consume once before expiry, account binding) and credentials (create, list by account, find by credential ID, update counter/last use, rename and delete scoped by account); verify store tests cover replay, expiry, wrong-account, duplicate credential ID, and foreign-account access.
- [ ] 2.3 Extend `Store.Session`/`RequireSession` to carry session `created_at` and `credential_id`, and let `establishSession` record an optional credential; verify existing auth tests still pass and new tests assert OIDC/magic-link sessions have no credential.
- [ ] 2.4 Embed the trimmed AAGUID → authenticator-name map and expose a lookup returning nil for unknown/zero AAGUIDs; verify a unit test resolves a known AAGUID and rejects unknown ones.
- [ ] 2.5 Extend `Store.Prune` to delete expired `webauthn_challenges`; verify the prune test covers expired and unexpired challenges.

## 3. Backend endpoints

- [ ] 3.1 Implement `POST /api/v1/passkeys/registration-options` and `POST /api/v1/passkeys` with the 5-minute fresh-login check on both, ceremony cookie handling, `excludeCredentials`, name validation, and `201` summary; verify handler tests cover fresh success, stale session on options and on finish (403 `reauthentication_required`), replay, expiry, and invalid name.
- [ ] 3.2 Implement `GET /api/v1/passkeys`, `PATCH /api/v1/passkeys/{passkeyId}`, and `DELETE /api/v1/passkeys/{passkeyId}` with transactional revocation of sessions created by the deleted passkey and cookie clearing when the caller's own session is revoked; verify tests cover listing without key material, rename, foreign 404, revocation of only matching sessions, and deleting the last passkey.
- [ ] 3.3 Implement `POST /api/v1/auth/passkey/options` and `POST /api/v1/auth/passkey` (discoverable flow, user verification required, owner cross-check, clone-warning rejection, counter/last-use update, session with credential, `204` + cookie, `401` on failure) and add `passkey` to `GET /api/v1/auth/methods`; verify tests with a software authenticator cover success, unknown credential, bad signature, wrong origin, replay, and the method list.
- [ ] 3.4 Document passkeys in `backend/README.md` (RP derived from `AUTH_BASE_URL`, no dev-server support, domain change invalidates passkeys); verify the README states each limitation.

## 4. Frontend

- [ ] 4.1 Regenerate OpenAPI types and add typed client functions plus `src/auth/passkeys.ts` (support detection, base64url JSON ↔ ArrayBuffer conversion, create/get wrappers, cancellation detection); verify unit tests cover conversion round-trips, unsupported browsers, and `NotAllowedError` mapping; `pnpm check:api` passes.
- [ ] 4.2 Add passkey sign-in to `/auth/login` shown only when `passkey` is reported and WebAuthn is supported, navigating to the validated return path on success; verify route tests cover shown/hidden states, success navigation, backend rejection, and cancellation in de and en.
- [ ] 4.3 Add the passkey section to `/profile` (list with details, empty/loading/error states, fresh-login note, add flow with reauthentication link to `/auth/login?returnTo=/profile`, unsupported-browser notice, rename, delete with confirmation dialog, redirect to login when the current session is revoked); verify route tests cover each spec scenario in de and en.
- [ ] 4.4 Add all new de/en translation keys; verify the localization key-parity test passes.

## 5. Integration

- [ ] 5.1 Run frontend `check:api`, tests, typecheck, Biome, OpenAPI lint, and build; run full backend tests, `openspec validate add-passkey-login --strict`, and `git diff --check`; verify all pass.
- [ ] 5.2 Manually exercise register → logout → passkey login → delete in a browser against the backend origin (e.g. Chromium virtual authenticator); verify the session created by the passkey is revoked after deletion.
