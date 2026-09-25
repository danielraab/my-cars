# Proposal

## Why

The backend can now authenticate users through OIDC or magic links, but the
frontend is still the generated placeholder and offers no way to start a login,
observe the resulting session, or enter the application. A localized frontend
authentication shell is the smallest end-to-end slice that makes the completed
backend authentication usable and establishes conventions needed by every
later feature screen.

## What Changes

- Replace the generated placeholder with the public landing experience from
  `SCR-01`, adapted to the rewrite's passwordless authentication model.
- Add a login page that can initiate backend-owned OIDC login and request a
  magic link without disclosing whether an account already exists.
- Resolve the current backend session when the application starts, protect
  authenticated routes, preserve an application-local destination through
  login, and support logout.
- Add a responsive authenticated application shell with navigation placeholders
  for the parity areas without implementing their feature screens.
- Establish frontend API/error handling and session-state conventions using
  same-origin cookie requests; do not expose or persist authentication tokens.
- Establish internationalization with complete German and English messages,
  language selection, and a deterministic fallback locale.
- Add frontend tests for public navigation, authentication states, protected
  route redirects, magic-link feedback, OIDC initiation, language switching,
  and logout.
- Remove generated demo branding and production-visible development tooling.

## Capabilities

### New Capabilities

- `frontend/application-shell`: Public landing, authenticated layout,
  responsive navigation, and route-access behavior that frame later feature
  screens.
- `frontend/authentication`: Browser-side OIDC and magic-link initiation,
  current-session handling, protected-route return paths, and logout through
  the existing backend authentication API.
- `frontend/localization`: German and English message delivery, locale
  selection, persistence, and fallback behavior for the static frontend.

### Modified Capabilities

None. This change consumes the existing authentication and HTTP contracts
without changing their requirements.

## Impact

- **Frontend**: replaces the generated route and root layout; adds public and
  protected routes, reusable shell/auth/API/i18n modules, tests, and associated
  dependencies.
- **Backend/API**: no endpoint or schema changes; the frontend uses
  `/api/v1/auth/*` and `/api/v1/session` as already documented and implemented.
- **Parity**: covers the public landing behavior in `SCR-01`; legacy password
  login and registration remain excluded by `NG-01`, and browser token storage
  remains excluded by `NG-06`.
- **Follow-on work**: profile, dashboard, cars, refuels, repairs, and tickets
  remain separate vertical slices that plug into the authenticated shell.
