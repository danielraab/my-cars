# Tasks

## 1. Configuration

- [ ] 1.1 Add optional `ANALYTICS_SNIPPET` to `Config` (`AnalyticsSnippet`), `EnvKeys`, and `backend/.env.example` (empty value, comment with an Umami example and the note that every visitor is tracked), treating an all-whitespace value as empty; verify config tests cover unset, empty, whitespace-only and a set value, and the env-key sync test passes.
- [ ] 1.2 Pass `ANALYTICS_SNIPPET` through in `docker-compose.yml` as `${ANALYTICS_SNIPPET:-}`; verify `docker compose config` renders it.

## 2. Backend injection

- [ ] 2.1 Implement the pure index-preparation function (insert snippet before the first case-insensitive `</head>`; return input unchanged for an empty snippet; error naming `ANALYTICS_SNIPPET` and the missing `</head>` without the snippet text); verify unit tests cover empty snippet (byte-identical), insertion position, uppercase `</HEAD>`, multiple `</head>` occurrences, and the missing-tag error.
- [ ] 2.2 Make `staticHandler`/`NewMux` serve the prepared document for `/`, `/index.html` and the SPA fallback via `http.ServeContent` with a `bytes.Reader`; verify HTTP tests show each path returns the snippet exactly once with a matching `Content-Length`, other static files and `/api/` responses do not contain it, and with no snippet `GET /` equals the embedded file byte for byte (existing http-server tests still pass).
- [ ] 2.3 Wire preparation into `main.go` at startup: `log.Fatalf` on error and log `analytics snippet configured` (without contents) when one is set; verify by running the backend with a snippet and checking the startup log and `curl /` output.
- [ ] 2.4 Document `ANALYTICS_SNIPPET` in `backend/README.md` (purpose, Umami example with single-quoting, injected before `</head>` on every page, absent in the Vite dev server, every visitor tracked and consent is the operator's responsibility, startup failure when `</head>` is missing); verify the README names the variable and each of these points.

## 3. Integration

- [ ] 3.1 Run full backend tests, `go vet`, the frontend build plus the embedded-build smoke check used by CI, `openspec validate add-analytics-snippet --strict`, and `git diff --check`; verify all pass.
