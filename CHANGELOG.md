# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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

### Changed

- The product is now called "My cars" in the tab title, header, localized
  texts and the magic-link email.

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

[Unreleased]: https://github.com/danielraab/my-cars/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/danielraab/my-cars/releases/tag/v2.0.0
