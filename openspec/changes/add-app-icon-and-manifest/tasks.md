# Tasks

## 1. Icon source

- [ ] 1.1 Create `frontend/public/icon.svg` (lime tile with the brand-mark corner proportions, lucide `Gauge` paths in `#142721`) per design.md. Verify by opening it next to the running header at a matching size: same colors, shape and glyph.
- [ ] 1.2 Create `frontend/public/icon-maskable.svg` (full-bleed lime square, glyph inside the central 80 % circle). Verify by overlaying an 80 %-diameter circle: the whole glyph lies inside it.
- [ ] 1.3 Add a Vitest test asserting that `public/icon.svg` and `public/icon-maskable.svg` contain every path `d` of lucide-react's `Gauge`. Verify that `pnpm test` passes, and that it fails when one `d` value in the SVG is altered.

## 2. Raster renders

- [ ] 2.1 Render `icon-192.png`, `icon-512.png` (transparent corners), `icon-maskable-512.png` and `apple-touch-icon.png` (180 px, opaque) into `frontend/public/` with the preinstalled Chromium. Verify with `file frontend/public/*.png` that the dimensions are as declared, and that the apple-touch and maskable PNGs have no alpha in the corners.
- [ ] 2.2 Pack `frontend/public/favicon.ico` from 16 px and 32 px renders. Verify `file` reports an MS Windows icon resource with both sizes.
- [ ] 2.3 Add an "App icon" section to `frontend/README.md` with the exact render and pack steps. Verify by re-running them and checking that the output is byte-identical or visually indistinguishable.

## 3. Manifest and document head

- [ ] 3.1 Add `frontend/public/manifest.webmanifest` with the fields from design.md. Verify it parses as JSON and that each icon `src` exists in `frontend/public/`.
- [ ] 3.2 Update `frontend/index.html`: title "My cars", `theme-color` `#142721`, and links to the favicons, the apple-touch icon and the manifest. Verify that `pnpm build` copies all of them into `frontend/out/` and that the built `index.html` references them.
- [ ] 3.3 Add a Vitest test that reads `public/manifest.webmanifest` and asserts name, short_name, start_url, scope, display, colors and the three icon entries (spec "Manifest content"). Verify `pnpm test` passes.

## 4. Product rename

- [ ] 4.1 Change `brand.name` and every product-naming string in `frontend/src/i18n/resources.ts` (`en` and `de`) from "my-car" to "My cars". Verify with `grep -n "my-car" frontend/src/i18n/resources.ts`, which should show no product-name hits, and with the i18n coverage script passing.
- [ ] 4.2 Make `frontend/src/components/session-unavailable.tsx` render `t('brand.name')` instead of the literal. Verify its rendering test (add one if missing) shows "My cars".
- [ ] 4.3 Update tests that assert the old name (e.g. `routes/-app.test.tsx` "Sign in to my-car"). Verify `pnpm test`, `pnpm typecheck` and `pnpm check` pass, and that `grep -rn "my-car" frontend/src` only shows the localStorage key.
- [ ] 4.4 Change the magic-link email's subject and body in `backend/internal/auth/mailer.go` to "My cars", and update or add a mailer test asserting the subject. Verify `go test ./...` in `backend/` passes.

## 5. Backend media type

- [ ] 5.1 Register `.webmanifest` → `application/manifest+json` in an `init` in `backend/internal/httpserver/static.go`, and add a `static_test.go` case serving a `manifest.webmanifest` from `fstest.MapFS` that asserts that `Content-Type` (spec "Fetching the manifest"). Also add a case asserting that `/favicon.ico` from the map is served as the icon rather than `index.html`. Verify `go test ./internal/httpserver/...` passes.

## 6. Integration check

- [ ] 6.1 Build the Docker image, run it, and check in Chromium: the tab shows the icon and title "My cars"; `/favicon.ico` and `/manifest.webmanifest` return the expected `Content-Type`; DevTools → Application → Manifest shows no installability errors; no service worker is registered; installing the app opens `/home` in a standalone window with the brand icon.
- [ ] 6.2 Add an "Unreleased" entry to `CHANGELOG.md` (Added: app icon and installable manifest; Changed: product name "My cars"). Note the iOS magic-link limitation under the entry. Verify that the entry renders in the Keep a Changelog structure.

## Workflow follow-up

- Manually check on an iOS device that "Add to Home Screen" uses the apple-touch icon.
- Archive the change after review, and sync the delta specs into `openspec/specs/`.
