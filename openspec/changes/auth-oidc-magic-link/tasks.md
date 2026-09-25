# Tasks

## 1. Configuration and persistence

- [x] 1.1 Add and validate OIDC issuer, client ID, and client-secret configuration alongside the existing SMTP and auth-base URL settings; verify config unit tests cover missing and valid OIDC settings and `.env.example` remains synchronized.
- [x] 1.2 Add an embedded additive migration and rollback for OIDC identities, short-lived OIDC attempts, magic-link challenges, and server sessions with digest, expiry, consumption/revocation, foreign-key, uniqueness, and cleanup-query indexes; verify migration integration tests apply, inspect, and rerun the schema successfully.
- [ ] 1.3 Add repository operations that atomically create and consume OIDC attempts, magic-link challenges, and sessions and resolve/create normalized-email accounts; verify Postgres integration tests reject replay and converge both authentication methods on one account.

## 2. Shared session and cookie support

- [x] 2.1 Implement cryptographically random opaque credential generation and SHA-256 digest lookup without logging or serializing raw values; verify unit tests cover distinct values, digest matching, and absent raw values from persistence models.
- [ ] 2.2 Implement secure HttpOnly SameSite=Lax session-cookie creation, active-session lookup middleware, expiry handling, and logout revocation/clearing; verify HTTP tests cover authenticated `/api/session`, expired/revoked session rejection, and cookie attributes.
- [ ] 2.3 Register the authenticated current-session and logout handlers at their OpenAPI paths while preserving the existing health, OpenAPI, static, and API-404 routing behavior; verify mux tests and `go test ./backend/...` pass.

## 3. Magic-link authentication

- [ ] 3.1 Implement syntactic email validation, normalization, opaque expiring challenge creation, and SMTP delivery using the configured absolute backend base URL; verify unit tests cover valid link content, send failure cleanup, and no usable token persisted.
- [ ] 3.2 Implement `POST /api/auth/magic-links` with the contract's uniform accepted response for valid new and existing emails; verify HTTP tests prove responses do not enumerate account existence.
- [ ] 3.3 Implement atomic magic-link consumption, account resolution/creation, session establishment, and validated redirect; verify HTTP and database tests cover success, expiry, replay, and existing-account sign-in.

## 4. OIDC authentication

- [ ] 4.1 Add a standards-compliant OIDC client using issuer discovery and authorization-code exchange with state, nonce, and PKCE; verify tests assert the generated authorization redirect contains required correlation and PKCE parameters.
- [ ] 4.2 Implement OIDC initiation with persisted one-time state, a validated application-local return path, and the documented `/api/auth/oidc/start` route; verify HTTP tests reject external/protocol-relative return targets and retain valid local targets.
- [ ] 4.3 Implement callback state consumption, code exchange, ID-token signature and claim validation, verified-email account resolution, identity association, session creation, and redirect at `/api/auth/oidc/callback`; verify tests cover successful login, invalid/replayed/expired state, invalid token claims, and magic-link/OIDC account convergence.

## 5. Hardening and verification

- [ ] 5.1 Add expiry pruning for consumed/expired OIDC attempts and magic links and expired/revoked sessions; verify repository tests show pruning cannot remove active state.
- [ ] 5.2 Update backend documentation for required OIDC setup, SMTP/Mailpit development flow, cookie behavior, and the passwordless-only boundary; verify documented commands and environment names match configuration tests.
- [ ] 5.3 Run `go test ./backend/...`, `cd frontend && pnpm lint:openapi`, `openspec validate auth-oidc-magic-link --strict`, and `git diff --check`; verify all pass with no `old/` changes.
