# my-car frontend

Static React frontend for my-car. Vite builds the app into `out/`; the Go
backend embeds and serves that directory in production. There is no frontend
server or SSR runtime after the build.

## Development

Install dependencies and start Vite:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite listens on `http://localhost:3000` and proxies relative `/api` requests to
`http://localhost:8080`. Set `VITE_BACKEND_ORIGIN` to use another local backend:

```bash
VITE_BACKEND_ORIGIN=http://localhost:9090 pnpm dev
```

Production remains same-origin: the Go process serves both the API and static
bundle. Do not add CORS-dependent browser calls or absolute API origins.

## Authentication

The frontend starts OIDC and magic-link authentication through backend routes
only. It reads the current account from `/api/v1/session`; the opaque session
credential remains in the backend-issued `Secure`, `HttpOnly`, `SameSite=Lax`
cookie. Authentication credentials and profile data must never be written to
`localStorage`.

Because the cookie is `Secure`, browser testing requires HTTPS or browser
localhost handling. Mailpit from the root compose development profile displays
local magic links.

## API types

[`src/api/schema.gen.ts`](src/api/schema.gen.ts) is generated from the root
OpenAPI source of truth:

```bash
pnpm generate:api
pnpm check:api
pnpm lint:openapi
```

Commit generated type changes with the OpenAPI change that caused them. Keep
runtime policy in the small handwritten API client rather than editing the
generated file.

## Localization

English and German resources live in
[`src/i18n/resources.ts`](src/i18n/resources.ts). Every user-facing message must
be added to both locales. The selected `de` or `en` preference is the only
frontend state persisted in `localStorage`; English is the translation fallback.

## Verification

```bash
pnpm generate-routes
pnpm check:api
pnpm test
pnpm typecheck
pnpm check
pnpm lint:openapi
pnpm build
```

Tests use Vitest, jsdom, and Testing Library. The production build writes to
`out/`, which is copied into `backend/static/out/` by the root Docker build.
