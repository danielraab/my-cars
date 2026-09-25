# Tasks

## 1. Frontend tooling and API boundary

- [x] 1.1 Run the frontend's required TanStack Intent skill discovery, load every directly applicable frontend skill, and verify the selected guidance is recorded in the implementation notes before editing application code. (`intent list` found no intent-enabled packages, so no additional skill applied.)
- [x] 1.2 Add TanStack Query, i18next/react-i18next, OpenAPI type generation, Vitest, jsdom, and Testing Library dependencies and scripts; configure the Vite test environment and `/api` development proxy, and verify `pnpm install --frozen-lockfile`, an empty test run, and the production build succeed.
- [x] 1.3 Generate and commit TypeScript types from `openapi/openapi.yaml`, add a deterministic synchronization check, and verify regeneration produces no diff.
- [x] 1.4 Implement the small same-origin typed fetch/error boundary for current session, magic-link request, and logout; verify unit tests cover success JSON, `202`/`204`, documented API errors, `401`, malformed responses, and transport failures.

## 2. Localization foundation

- [x] 2.1 Add the i18next initialization and complete English/German resources for every string introduced by this change; verify tests cover saved-locale precedence, German browser detection, English fallback, and missing-key fallback.
- [x] 2.2 Add the shared language control and document-language synchronization, persisting only an allowlisted locale value; verify interaction tests switch visible text and `<html lang>` without reloading.

## 3. Session and route access

- [x] 3.1 Add the shared TanStack Query client, current-session query, and explicit authenticated/anonymous/unavailable states to router context; verify tests distinguish `200`, `401`, and retryable server/transport failures.
- [x] 3.2 Implement and test application-local return-path validation, including fallback to `/home` for absolute, protocol-relative, backslash-containing, malformed, or empty invalid destinations.
- [x] 3.3 Add the protected route layout guard and retryable session-error view; verify route integration tests retain an anonymous user's requested path, avoid protected-content flashes, allow a valid session, and retry unavailable session resolution.

## 4. Public landing and login

- [x] 4.1 Replace the generated index route with the localized `SCR-01` landing experience and four product-area cards; verify anonymous links retain login destinations and authenticated links target the corresponding protected routes.
- [x] 4.2 Add the localized `/auth/login` magic-link form with accessible pending, validation, accepted, and unexpected-error states; verify tests prove the request includes the validated return path and accepted feedback is account-neutral.
- [x] 4.3 Add OIDC initiation through a full-page backend navigation and verify tests prove it targets `/api/v1/auth/oidc/start`, carries only a validated local return path, and never invokes an identity-provider URL directly.

## 5. Authenticated application shell

- [x] 5.1 Build the responsive authenticated shell with product identity, profile context, language control, wide and narrow navigation, keyboard-operable HeadlessUI behavior, and lucide icons with text labels; verify component tests cover navigation and mobile-menu semantics.
- [x] 5.2 Add protected `/home`, `/cars`, `/refuels`, `/repairs`, `/tickets`, and `/profile` route entries with localized unavailable placeholders; regenerate the route tree and verify every route works through client navigation and a production-build SPA fallback test.
- [x] 5.3 Implement logout with query/router invalidation and public-landing navigation; verify tests cover successful logout, already-invalid `401`, and retention of session state plus an error message for other failures.
- [x] 5.4 Remove generated starter content and production-visible TanStack development controls, then verify the production bundle and rendered route tests contain no starter branding or developer UI.

## 6. Documentation and validation

- [x] 6.1 Replace the generated frontend README with project-specific development, backend proxy, API type-generation, localization, test, and secure-cookie guidance; verify every documented command and environment name matches package and Vite configuration.
- [x] 6.2 Run route generation, API-type synchronization, frontend tests, type checking, Biome checks, OpenAPI linting, and the production build; run `openspec validate frontend-auth-shell --strict` and `git diff --check`, and verify all pass with no changes under `old/`.
