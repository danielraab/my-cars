# Design

## Context

See `proposal.md` for motivation. The frontend is currently a single generated
TanStack Router route with Tailwind and development tooling. It has no data
client, tests, localization, session state, or product layout. The backend now
serves the static SPA, owns OIDC and magic-link flows, and exposes cookie-based
session operations under `/api/v1`; the browser must stay same-origin in
production and must never manage authentication credentials itself.

This slice must create reusable frontend foundations without pulling the
profile or domain APIs forward. It also needs useful destinations after login,
even though the later dashboard and feature screens do not exist yet.

## Goals / Non-Goals

**Goals:**

- Make both completed backend login methods usable from the browser.
- Give route guards one authoritative, explicitly modeled session state.
- Establish generated API types, localized messages, accessible responsive
  layout patterns, and a frontend test harness for later slices.
- Keep the deployed result a static SPA making same-origin REST requests.

**Non-Goals:**

- Implement profile editing, dashboard data, cars, expenses, charts, or
  autocomplete behavior.
- Change backend authentication, OpenAPI operations, cookies, or database
  state.
- Reproduce password login, registration, password reset, JWT display, or
  browser token persistence from the legacy application.
- Introduce SSR, server functions, a Node production runtime, or direct
  identity-provider integration.

## Decisions

### Generate API types from the checked-in OpenAPI source

Add `openapi-typescript` as a development dependency and generate a committed
type-only module from `openapi/openapi.yaml`. A small handwritten fetch wrapper
uses those operation shapes, same-origin URLs, JSON/error parsing, and
`credentials: "same-origin"`. CI regenerates or otherwise verifies that the
committed output is current.

Handwriting response interfaces was rejected because `/session` immediately
becomes a second source of truth. Adding a full runtime client generator was
rejected because this slice needs only two JSON operations plus redirects and
the generated runtime would add more policy than value.

All browser calls use relative `/api/v1/...` URLs. Production is naturally
same-origin because Go serves the bundle; Vite development proxies `/api` to a
configurable backend origin that defaults to `http://localhost:8080`. Hardcoded
cross-origin URLs and frontend CORS configuration were rejected because they
would create a development-only request model and weaken cookie assumptions.

### Model session resolution as a shared query used by route guards

Use TanStack Query for the current-session query and mutations, with its client
provided through TanStack Router context. Protected layout `beforeLoad` waits
for the session query: a successful profile proceeds, a typed anonymous result
redirects to `/auth/login`, and an unavailable result reaches a retryable error
view. Login callback completion needs no frontend callback route because the
backend establishes the cookie and redirects to the stored path.

The current session remains memory/cache state only. After logout, invalidate
or replace that query state and router state before navigating to `/`.

A component-only auth context was rejected because protected route content can
briefly render before an effect redirects. Fetching independently in every
route was rejected because it duplicates requests and creates inconsistent
logout behavior.

### Keep authentication redirects as full browser navigations

OIDC starts with `window.location.assign` to
`/api/v1/auth/oidc/start?returnTo=...`; magic-link consumption also remains a
backend navigation from the email. The frontend validates return targets as a
single-slash local path, rejecting schemes, hosts, protocol-relative values,
backslashes, and malformed encodings, with `/home` as fallback. It supplies the
same validated value in the magic-link JSON body.

Embedding an OIDC SDK was rejected because the backend owns discovery, PKCE,
token validation, and the client secret. SPA callback processing was rejected
because it would split session establishment across layers.

### Use explicit placeholder routes for deferred protected features

Create the authenticated route layout and route entries for `/home`, `/cars`,
`/refuels`, `/repairs`, `/tickets`, and `/profile`. Each currently renders the
same clearly labeled localized unavailable state inside the shell. This makes
landing cards, navigation, return paths, and hard refreshes real and testable
without pretending the corresponding parity screen is implemented. Later
vertical changes replace one placeholder at a time without changing the shell.

Broken links were rejected because they undermine the first usable flow.
Implementing a partial dashboard was rejected because it would blur acceptance
with `SCR-02` and require domain endpoints not in this change.

### Use i18next resources bundled with the SPA

Add `i18next` and `react-i18next` with complete static `de` and `en` resource
files and English fallback. Startup chooses a strictly allowlisted saved
locale, then German for a browser language beginning with `de`, otherwise
English. The selector updates i18next, `<html lang>`, and a namespaced
`localStorage` locale value. No profile or server persistence is introduced.

Ad-hoc translation objects were rejected because interpolation, fallback, and
missing-key behavior would have to be recreated as more screens arrive.
Automatic language-detection plugins were rejected because the precedence and
stored data are simple enough to keep explicit and testable.

### Test behavior at route and user-interaction boundaries

Add Vitest, jsdom, React Testing Library, and user-event. Tests render the real
router with mocked same-origin fetch responses and cover session loading,
anonymous redirects, retryable failures, login requests and redirects, logout,
responsive-menu semantics, language changes, and translated content. Route
generation, type checking, Biome checks, API-type synchronization, and the
production build remain separate verification gates.

Browser end-to-end automation is deferred until domain screens provide a
broader workflow; unit-only tests were rejected because route redirects and
provider composition are the main integration risks here.

### Build an accessible product shell from existing UI primitives

Use Tailwind for layout and visual states, HeadlessUI for the narrow-screen
navigation/dialog behavior, and lucide-react for decorative icons with text
labels retained. Public and authenticated layouts share brand and locale
controls but not navigation. Remove starter copy and production-visible
TanStack devtools rather than conditionally shipping them.

## Risks / Trade-offs

- [Secure cookies make plain-HTTP non-localhost testing unreliable] → document
  HTTPS/localhost expectations and mock session HTTP behavior in frontend tests.
- [Placeholder routes could be mistaken for completed parity screens] → label
  them unavailable and cite only `SCR-01` as completed by this change.
- [A cached session can become invalid outside the frontend] → treat a `401`
  from authenticated API work in later slices as a signal to invalidate the
  shared session query; this slice verifies `/session` on initial protected
  navigation and after explicit auth actions.
- [Committed generated API types can drift] → add a deterministic generation
  command and CI verification against the checked-in OpenAPI document.
- [Local storage is used for locale preference] → store only the allowlisted
  `de`/`en` value; authentication and profile data remain excluded.

## Migration Plan

1. Add API generation, localization, test, and session-query foundations while
   retaining a buildable root route.
2. Replace the generated root UI with the public landing and login routes.
3. Add the protected layout and explicit deferred-feature routes, then verify
   direct navigation and hard-refresh behavior through the existing SPA
   fallback.
4. Deploy the static bundle with the existing backend. Rollback is a frontend
   bundle rollback; no database or API migration is involved.
