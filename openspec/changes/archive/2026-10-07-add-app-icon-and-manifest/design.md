## Context

- The brand mark exists only at runtime: `PublicHeader` and `AppShell` render
  lucide-react's `Gauge` inside `.brand-mark` (`frontend/src/styles.css`):
  lime `--accent` `#b9f227` background, navy `--navy` `#142721` stroke,
  border radius `0.7rem 0.7rem 0.15rem 0.7rem` on a `2.35rem` tile (the
  bottom-right corner is nearly square). No image file exists.
- The frontend has no `public/` directory. Vite copies `frontend/public/`
  verbatim into the build output (`frontend/out/`), which the backend embeds
  and serves through `staticHandler` (`backend/internal/httpserver/static.go`).
- `serveFile` uses `http.ServeContent`, which takes the `Content-Type` from
  `mime.TypeByExtension`. Go has no built-in entry for `.webmanifest`. The
  host's `/etc/mime.types` has none either, and the runtime image is distroless,
  so the type would be sniffed (`text/plain`). `.svg`, `.png` and `.ico` are
  covered by Go's built-in table.
- The document title is static (`<title>` in `index.html`); no route sets
  `document.title`.
- Unauthenticated access to a protected route already redirects to
  `/auth/login?returnTo=<path>` (`routes/_authenticated/route.tsx`), so
  `start_url: /home` needs no new handling.

## Goals / Non-Goals

**Goals:**

- One icon source file that both the favicon and the installed-app icons
  derive from, and that visibly matches the header.
- Static files only: nothing new at build time or at runtime in the frontend.

**Non-Goals:**

- Replacing the runtime-rendered lucide icon in the header with the image
  file. The header keeps using `<Gauge>` so it follows the theme and stays
  crisp. Only the colors and shape need to match.
- Dark-mode variants of the favicon.

## Decisions

### Icon source: one hand-written SVG built from lucide's path data

`frontend/public/icon.svg` uses a `0 0 24 24` grid like lucide. A lime
rounded rectangle uses the brand-mark corner proportions (radius ≈ 30 % of
the tile, bottom-right ≈ 6 %). On top sits the `Gauge` glyph's two paths,
copied from lucide (ISC license), with `stroke="#142721"`,
`stroke-width="2"`, round caps and joins, and `fill="none"`. The glyph is
scaled to about 60 % of the tile, which is what the header tile shows
(22 px glyph in a ~37.6 px tile).

*Alternative:* render `<Gauge>` to static markup in a script. Rejected
because the user asked for no generation step. The glyph is two short
paths, and a test guards against drift (below).

**Drift guard:** a Vitest test (`src/app-icon.test.tsx`) renders lucide-react's
`<Gauge>` and asserts that both icon SVGs contain each of its `path` `d`
attributes. lucide-react doesn't publicly export the node data, so the test
renders the icon instead. A lucide upgrade that redraws the gauge then fails CI instead of silently diverging.

### Raster files: committed PNGs and one ICO, produced once

| File | Size | Background | Purpose |
|---|---|---|---|
| `icon.svg` | scalable | transparent corners | favicon (modern browsers) |
| `favicon.ico` | 32×32 (+16×16) | transparent corners | legacy `/favicon.ico` probe, raster fallback |
| `apple-touch-icon.png` | 180×180 | **opaque**, full-bleed lime, square | iOS home screen (iOS draws its own rounding; transparency turns black) |
| `icon-192.png` | 192×192 | transparent corners | manifest, `any` |
| `icon-512.png` | 512×512 | transparent corners | manifest, `any` |
| `icon-maskable-512.png` | 512×512 | opaque full-bleed lime | manifest, `maskable` |

The maskable and apple-touch variants share one layout (`icon-maskable.svg`,
also committed): a full-bleed lime square with the glyph scaled so its
bounds fit within the central 80 % circle (glyph ≈ 50 % of the width). The
asymmetric corner can't survive OS masking, so these variants drop it.

The PNGs and ICO are produced by `frontend/scripts/render-app-icons.mjs`, a
dependency-free script run by hand. It screenshots each SVG with
`chrome-headless-shell` at the target size (transparent default background),
and packs the 16 and 32 px renders into a PNG-embedded ICO. The regular Chrome
binary isn't usable for this: its new headless mode subtracts window
decorations from `--window-size` and crops the render. The steps are in an
"App icon" section of `frontend/README.md`, not in `public/`, where Vite would
ship them with the build. Re-running the script gives byte-identical output.

*Alternative:* `@vite-pwa/assets-generator` at build time. Rejected by the
user: the icon changes rarely, and committed files keep the build simple.

### Manifest: `frontend/public/manifest.webmanifest`

```json
{
  "name": "My cars",
  "short_name": "My cars",
  "start_url": "/home",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#142721",
  "background_color": "#142721",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

There is no `lang` or `description`: the manifest isn't localized, and the
name is the same in both locales. `background_color` is navy to match the
shell header the user first sees after launch, rather than white.

*Alternative:* `manifest.json` (Go would serve it as `application/json`
with no backend change). Rejected in favor of the standard extension plus an
explicit media type, which the http-server spec now requires.

### `index.html` head

```html
<title>My cars</title>
<meta name="theme-color" content="#142721" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

Root-absolute paths are used because the app is always served at `/` and
the SPA fallback serves `index.html` under deep paths. Vite leaves
`public/` URLs untouched.

### Backend media type

An `init` in `backend/internal/httpserver/static.go` calls
`mime.AddExtensionType(".webmanifest", "application/manifest+json")`.
`serveFile` stays unchanged. Registering it in the package that serves the
files, rather than in `main.go`, means a `static_test.go` case can serve a
fake `manifest.webmanifest` from an `fstest.MapFS` and assert the header on
the same code path as production.

### Product rename

- `brand.name` changes to `My cars` in both locales, and the other strings
  that embed the name are updated in place. German keeps the brand
  untranslated ("Bei My cars anmelden").
- `session-unavailable.tsx` switches from the literal `my-car` to
  `t('brand.name')`, so the name lives in one place per locale.
- `mailer.go` changes the subject to "Your My cars sign-in link" and the
  body to "Sign in to My cars:". The email stays English-only, as today.
- The localStorage key, Go module path, OIDC client id and OpenAPI title
  are unchanged (see proposal non-goals).

## Risks / Trade-offs

- [iOS standalone apps have their own cookie jar, so a magic link signs the
  user in to Safari, not the installed app] → Documented as a known limitation
  in the proposal. OIDC works inside the installed app. A later change could
  add a typed one-time code.
- [Chromium install criteria change over time] → The manifest meets the
  current criteria without a service worker (name, icons at 192 and 512,
  `start_url`, `display`). Verified manually in the Application panel of
  Chrome DevTools, not in CI.
- [Committed PNGs drift from the SVG after an icon edit] → The README records
  the render command. The drift test covers the glyph but not the PNGs, which
  is acceptable for an icon that rarely changes.
- [Browsers cache favicons aggressively] → No mitigation needed for a first
  icon. A later icon change may need a query-string bump in `index.html`.

## Migration Plan

This is a static-asset and text change. It deploys with the next image and
rolls back by redeploying the previous image. Existing users keep their
saved language because the localStorage key is unchanged.
