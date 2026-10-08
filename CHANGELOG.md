# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.1.0] - 2026-10-08

### Added

- **Passkey sign-in**: users can sign in with a passkey (WebAuthn
  discoverable credential) and add, rename and remove passkeys on the profile
  page. Adding one requires a sign-in within the last 5 minutes; removing one
  also ends every session established with it. A passkey belongs to the
  account that registered it and never creates an account. The relying party
  is derived from `AUTH_BASE_URL`, so changing the deployment's domain
  invalidates registered passkeys. Database migration `000006` adds the
  passkey tables.
- **Sign-in rate limiting**: the public sign-in endpoints (magic-link request
  and navigation, OIDC, passkey login) are rate-limited per client address,
  and each email address receives at most 3 magic links per 15 minutes.
  Limited requests get `429` with `Retry-After` (JSON) or a localized message
  on the login page. Behind a reverse proxy, set `TRUSTED_PROXIES` so the
  client address is taken from `X-Forwarded-For`; `RATE_LIMIT_PER_IP=false`
  turns per-client limiting off. See the backend README for a Traefik setup.
- **App icon**: the header's gauge brand mark is the favicon and the icon of
  the installed app.
- **Installable app**: a web app manifest lets browsers install the app to a
  home screen or dock (standalone window, opening at `/home`). There is no
  service worker and no offline support. Known limitation: on iOS an installed
  app keeps its own cookies, so a magic link opened from the mail app signs in
  Safari rather than the installed app; sign in with OIDC there instead.
- **Analytics snippet**: the optional `ANALYTICS_SNIPPET` environment variable
  holds raw HTML (for example an Umami tracker tag) that the backend inserts
  before `</head>` on every page. Unset, pages are unchanged.
- **GitHub link**: the landing page footer and the app sidebar link to the
  GitHub repository.

### Changed

- The product is now called "My cars" in the tab title, header, localized
  texts and the magic-link email.
- CI: bumped the Docker build actions; image builds no longer fail when the
  GitHub Actions cache export is refused.

## [2.0.0] - 2026-10-06

First release of the ground-up rewrite of the legacy Next.js app: a Go
backend with a REST API and a statically built React frontend. The legacy
app is kept in `old/` as reference only.

### Added

- **Backend** (Go): REST API under `/api/v1` documented by an OpenAPI 3.1
  spec, PostgreSQL persistence with the initial domain schema, health check,
  and serving of the frontend's static build in production.
- **Authentication**: passwordless sign-in by magic link and by OIDC, both
  resolving to the same account when the email address matches. OIDC and
  SMTP authentication are optional. Sessions are cookie-based.
- **Profile**: view and manage the caller's profile (`/api/v1/me`).
- **Cars**: list, create, edit and delete cars, with a detail view and
  Expenses and Consumption tabs.
- **Refuels, repairs and tickets**: full management screens and endpoints,
  with car filter and date-range filtering on each list.
- **Dashboard**: monthly expense chart with value popover, keyboard access
  and gridlines.
- **Legacy data import**: import of data from the legacy app (see
  [docs/legacy-import.md](docs/legacy-import.md)); car registration fields
  are nullable to accommodate legacy data.
- **Seed command**: CLI command to generate multi-year test data.
- **Tooling**: Docker image and compose setup, CI with selective jobs per
  changed path, and OpenSpec-driven specs under `openspec/`.
- **Parity checklist**: [docs/parity-checklist.md](docs/parity-checklist.md)
  inventories every legacy screen, endpoint and derived value as the
  acceptance criterion for the rewrite.

[Unreleased]: https://github.com/danielraab/my-cars/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/danielraab/my-cars/releases/tag/v2.1.0
[2.0.0]: https://github.com/danielraab/my-cars/releases/tag/v2.0.0
