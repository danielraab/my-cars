## Why

The app has no icon. Browser tabs show a generic placeholder, and because the
SPA fallback answers every unknown path with `index.html`, a browser's probe
for `/favicon.ico` gets an HTML page back. The app also cannot be installed
to a home screen or dock, which matters for something used on the go (logging
a refuel at the pump). Finally, the product is still called by its repository
slug, "my-car", where the user sees it.

## What Changes

- The header brand mark (the lucide `Gauge` glyph in navy on the lime,
  asymmetric-cornered tile) becomes the app icon: one hand-authored SVG, plus
  PNG renders committed to the repository (no build-time generation).
- The browser tab shows that icon as its favicon (SVG with a raster fallback).
- A web app manifest makes the app installable: name "My cars",
  `display: standalone`, `start_url: /home`, scope `/`, brand-navy theme and
  background color, and 192 px, 512 px and 512 px maskable icons. iOS gets an
  `apple-touch-icon`.
- The leftover starter `theme-color` (`#0f172a`) is replaced by the brand navy
  (`#142721`).
- The product name changes from "my-car" to "My cars" wherever a user sees it:
  the tab title, the header brand, every localized string that names the
  product (in both `en` and `de`, where it stays untranslated as a brand
  name), the hardcoded name on the session-unavailable screen, and the
  magic-link email's subject and body.
- The backend serves the manifest with a manifest media type, rather than one
  that depends on the runtime image's MIME tables.

Non-goals:

- No service worker, offline support, caching, or background sync.
- No in-app install prompt or banner; installing uses the browser's own UI.
- No fix for the iOS installed-app cookie separation (see Impact).
- Internal identifiers keep the old slug: the Go module path, the
  `my-car.locale` localStorage key (renaming it would reset every user's saved
  language), the OIDC client id, and the OpenAPI document title.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `frontend/application-shell`: adds requirements for the product name, the
  favicon, and installability (manifest and icon set).
- `platform/http-server`: adds a requirement that the web app manifest is
  served with a manifest media type.

## Impact

- **Frontend**: new `frontend/public/` with the icon SVG, PNGs and manifest;
  `frontend/index.html` (title, theme color, icon and manifest links);
  `frontend/src/i18n/resources.ts` (product name in `en` and `de`);
  `frontend/src/components/session-unavailable.tsx`; tests that assert the
  old name.
- **Backend**: `backend/internal/httpserver` (manifest media type);
  `backend/internal/auth/mailer.go` (email subject and body).
- **Auth, known limitation**: on iOS an installed (standalone) web app has its
  own cookie storage, separate from Safari's. A magic link opened from the
  mail app signs the user in to Safari, not the installed app, so on iOS the
  installed app must be signed in via OIDC, or by using the app in Safari.
  Android and desktop browsers share cookies with the installed app.
- **Parity**: outside `docs/parity-checklist.md`. The legacy app only had the
  framework's default `favicon.ico`.
- No API contract, schema or dependency changes.
