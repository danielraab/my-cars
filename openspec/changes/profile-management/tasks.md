# Tasks

## 1. API contract

- [x] 1.1 In `openapi/openapi.yaml`, remove `email` from `ProfileUpdate`, add `additionalProperties: false` and `maxLength: 100` to `firstName`/`lastName`, drop the `409` response from `PATCH /me`, document the email rejection in the operation description, and document the `fields` reason codes (`read_only`, `unknown`, `invalid_type`, `too_long`, `required`) on `Error.fields`; verify with `pnpm lint:openapi` in `frontend/`
- [x] 1.2 Copy the source to `backend/openapi.yaml` and regenerate `frontend/src/api/schema.gen.ts` (`pnpm generate:api`); verify `go test ./...` (the `openapi_sync_test.go` check) and `pnpm check:api` pass

## 2. Backend error writer

- [x] 2.1 Add `backend/internal/apierror` with `Write(w, status, code, message, fields)` and a `Validation(w, fields)` helper that emit the common error representation with stable codes; verify with unit tests asserting status, `Content-Type`, `code`, and `fields` JSON

## 3. Backend profile endpoints

- [x] 3.1 Add `backend/internal/profile` with a `Repository` interface and a pgx store whose `UpdateAccountNames` updates only the supplied names (plus `updated_at`) and returns the account; verify with a store test against `DATABASE_URL` (skipped when unset, as in `db_test.go`) covering a partial update and an empty-string update
- [x] 3.2 Implement the `GET /api/v1/me` handler, which returns the context account as `Profile`; verify with a handler test using a fake session context
- [x] 3.3 Implement the `PATCH /api/v1/me` body validation per design D3 (16 KiB cap, map decoding, `email`→`read_only`, other keys→`unknown`, non-string→`invalid_type`, trimmed length over 100 runes→`too_long`, no documented member→`required`, all errors collected, no write on failure); verify with table-driven handler tests for every scenario in `specs/api-contract/profile/spec.md`, including that the fake repository is never called on `400`
- [x] 3.4 Register both routes in `main.go` behind `authService.RequireSession`; verify with a mux/integration test that an unauthenticated `GET` and `PATCH /api/v1/me` return `401`, and that `/api/v1/me` no longer falls through to `404`

## 4. Frontend API client

- [ ] 4.1 Add `Profile`/`ProfileUpdate` types plus `getMe()` and `updateMe()` to `src/api/client.ts` with an `isProfile` response guard (reuse it inside `isSession`); verify with `client.test.ts` cases for success, a `400` with `fields`, a `401` → `UnauthorizedError`, and an invalid response shape

## 5. Frontend profile screen

- [ ] 5.1 Add de and en messages under `profile.*` (title, email label, email hint, name labels, save, saving, saved, load error, retry, save error, and the field reasons `too_long`, `invalid_type`, `read_only`, `unknown`, `required`); verify with the existing i18n completeness test (`src/i18n/index.test.ts`) passing for both locales
- [ ] 5.2 Replace `_authenticated.profile.tsx` with the profile screen per design D5: `['me']` query with loading and retryable error states, read-only email with hint, a controlled name form, a mutation that writes `['me']` and `['session']`, field-level `aria-invalid`/`aria-describedby` errors, a form-level error that preserves input, and a `role="status"` success message; verify with `pnpm typecheck` and `pnpm check`
- [ ] 5.3 Add route tests covering each `specs/frontend/profile/spec.md` scenario: prefilled form with read-only email and no token details, load failure with retry, a successful save that sends only name fields and updates the shell's session data, a `400` field error on `lastName`, a server error keeping the input, and switching the locale to German; verify with `pnpm test`
- [ ] 5.4 Confirm the other deferred routes still render the placeholder and that `DeferredPage`'s `profile` feature entry is removed if no longer used; verify with the existing `-app.test.tsx` passing

## 6. Parity documentation

- [ ] 6.1 Add `NG-07` (decoded token claims on the profile screen are not ported; no browser-visible token under `NG-06`; email change from `EP-35` deliberately not ported) to `docs/parity-checklist.md`; verify the id is unique and referenced from the `SCR-03` entry

## 7. Integration check

- [ ] 7.1 Run `go test ./...` in `backend/` and `pnpm check && pnpm typecheck && pnpm test && pnpm build` in `frontend/`, then log in locally, open `/profile`, change a name, and confirm the change survives a reload; verify all commands pass and the manual flow behaves as specified
