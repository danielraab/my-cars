# Design

## Context

The frontend build is embedded with `//go:embed all:static/out` and served by
`staticHandler` (`backend/internal/httpserver/static.go`), which resolves a
request to a file, falls back to `index.html`, and streams the embed file
through `http.ServeContent`. `index.html` is reached three ways: `/`
(mapped to `index.html`), `/index.html` (an existing file), and the SPA
fallback. Configuration is loaded once by `config.Load()` from the
`EnvKeys` list, which `config_test.go` keeps in sync with
`backend/.env.example`. Motivation: see proposal.md.

## Goals / Non-Goals

**Goals:**
- One prepared `index.html` shared by all three paths, built once at startup.
- No behavioural or byte-level change when the variable is unset.

**Non-Goals:**
- Validating or sanitising the snippet's HTML.
- Structured, provider-specific settings (script URL, website id).
- A Content-Security-Policy, consent handling, or per-user opt-out.
- Injecting into the Vite dev server's page.

## Decisions

### Raw HTML snippet over structured settings
`ANALYTICS_SNIPPET` holds the provider's embed code verbatim. It works for
Umami, Plausible, Matomo or anything else with no code changes per provider.
*Alternative:* `ANALYTICS_SCRIPT_SRC` + attributes would be validatable and
CSP-friendly but restricts the snippet to a single external `<script>`; it
can be added beside this later if a CSP is introduced.

### Server-side injection over a runtime config endpoint
The backend rewrites `index.html` rather than exposing `/api/config` for the
frontend to load the script after boot. Injection needs no OpenAPI or
frontend change and the tracker loads from `<head>` before the bundle.
*Alternative:* a config endpoint adds a contract entry, frontend code, and
delays the tracker until after the app has booted.

### Build once at startup, serve from memory
At startup, `httpserver.WithAnalyticsSnippet(staticFS, snippet)` reads
`index.html` from the embedded FS, inserts the snippet before the first
`</head>` (case-insensitive match), and returns an `fs.FS` overlay that
serves the prepared bytes as `index.html` and delegates every other name.
`staticHandler` and `NewMux` stay unchanged: all three paths already resolve
to the name `index.html`, and the overlay's file is an `io.ReadSeeker`, so
`http.ServeContent` keeps `Content-Length`, conditional and Range handling
correct. With no snippet the original FS is returned untouched.
*Alternatives:* passing the prepared bytes through `NewMux` would change a
signature used by every handler package's tests for no behavioural gain;
rewriting on every request costs work per page load for a value that cannot
change at runtime.

### Fail fast when `index.html` or `</head>` is missing
A missing document or head end tag means the build is broken or unexpected
(the committed `static/out/placeholder` build has no `index.html` at all).
Exiting at startup surfaces it immediately. *Alternative:* appending before `</body>`
or at the end would hide the problem and place trackers inconsistently.

### Configuration handling
`ANALYTICS_SNIPPET` is optional, added to `EnvKeys`, `Config`
(`AnalyticsSnippet string`), `.env.example` (empty, with an Umami example
in the comment), and `docker-compose.yml` (`${ANALYTICS_SNIPPET:-}`).
The value is used as-is apart from treating an all-whitespace value as
empty. `main.go` logs `analytics snippet configured` when it is non-empty,
never the value.

## Risks / Trade-offs

- [Malformed snippet breaks the page's `<head>`] → Operator-controlled and
  visible on first load; documented in the README with a working example.
- [Future CSP blocks inline or third-party scripts] → Documented as a
  constraint; structured settings can be added when a CSP lands.
- [Privacy obligations depend on the chosen tool] → README states that
  every visitor is tracked and that choosing a consent-free tool is the
  operator's responsibility.
- [Multi-line values are awkward in `.env`/compose] → Typical embed codes
  are a single line; README recommends single-quoting the value.

## Migration Plan

Additive and off by default: deployments without the variable are unchanged.
Rollback is unsetting the variable and restarting.
