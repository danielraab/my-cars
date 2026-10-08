# Proposal

## Why

Operators want to measure how the app is used with a self-chosen analytics
tool such as Umami, without rebuilding the image per deployment. The frontend
is a static build embedded in the backend binary, so a build-time variable
cannot carry a per-deployment value; only the backend can inject one at
runtime.

This is new scope: the legacy app had no analytics, so no parity item covers
it.

## What Changes

- New optional `ANALYTICS_SNIPPET` environment variable holding raw HTML
  (typically a single `<script>` tag, e.g. Umami's tracker).
- When set, the backend serves the frontend's `index.html` with the snippet
  inserted immediately before `</head>`, on every response that serves
  `index.html` (`/`, `/index.html`, and the SPA fallback). Because the app
  is a single-page app and trackers like Umami follow History API
  navigations, this covers every page.
- When unset or empty, `index.html` is served byte for byte as built.
- If a snippet is set but the embedded `index.html` has no `</head>`, the
  backend fails at startup instead of silently serving pages without it.
- Every visitor is tracked the same way, anonymous or signed in; there is no
  consent banner and no per-user opt-out. Choosing a tool that needs no
  consent (such as cookieless Umami) is the operator's responsibility.
- The snippet never appears in `/api/` responses, and the startup log notes
  that a snippet is configured without printing its contents.
- The Vite dev server does not go through the backend, so the snippet is
  absent during frontend development.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/http-server`: adds a requirement that the served `index.html`
  carries the configured analytics snippet, and that its absence leaves the
  document unchanged.

## Impact

- **Configuration**: new optional `ANALYTICS_SNIPPET` in config, `EnvKeys`,
  `backend/.env.example`, `docker-compose.yml`, and `backend/README.md`.
- **Backend**: the static handler serves a prepared `index.html` built once
  at startup; startup fails when a snippet is set and `</head>` is missing.
- **API / OpenAPI**: none. **Frontend source**: none.
- **Security**: the snippet is trusted operator input with the same trust as
  the deployment itself; it is not user-controllable. A future strict
  Content-Security-Policy would need to allow the snippet's sources.
