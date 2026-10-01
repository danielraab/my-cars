# Tasks

## 1. Tick helpers

- [x] 1.1 Add `niceTicks(min, max, target)` in `src/lib/chart-ticks.ts` (1/2/5 × 10ⁿ steps, outward-rounded domain, equal-value widening, drift-free values). Verify with `src/lib/chart-ticks.test.ts`: 6.12–7.93 → 6…8 step 0.5; 0–530 → 0…600 step 200; 1.41–1.89 → 1.4…1.9 step 0.1; the single value 7; negative and sub-1 ranges.
- [x] 1.2 Add `timeTicks(minTime, maxTime)` to the same module (week/month/quarter/year by span, local boundaries strictly inside the range, `narrow` subset). Verify with unit tests for a 3-week, 6-month, 3-year and 10-year span, and for a single date (no ticks).

## 2. Shared popover and interaction plumbing

- [x] 2.1 Add `components/chart-popover.tsx` (absolutely positioned, `--x`/`--y` custom properties, `placement` above/below/top, `aria-hidden`) and its CSS in `styles.css` (`width: min(12rem, 100%)`, horizontal `clamp()`; no arrow, since the highlighted dot or column marks the anchor). Verify with a unit test asserting the custom properties and placement class, and `pnpm check`.
- [x] 2.2 Add the de/en messages for the keyboard hint (e.g. `charts.keyboardHint`) and the quarter tick label in `src/i18n/resources.ts`. Verify that the existing i18n tests (key parity between locales) pass.

## 3. Line chart

- [x] 3.1 Draw the grid in `components/line-chart.tsx`: y-domain from `niceTicks`, horizontal and vertical gridlines in a `.chart-grid` group behind the series, y-labels positioned per tick, and wide/narrow x-labels from `timeTicks`. Add a `formatTick` prop and pass step-based formatters from `consumption-chart.tsx` and `fuel-price-chart.tsx`. Verify with updated `consumption-chart.test.tsx` / `fuel-price-chart.test.tsx` asserting tick labels (e.g. 6, 6.5 … 8) and gridline counts.
- [x] 3.2 Add the active-index state, a focusable wrapper (`tabIndex=0`, `role="slider"`, label, `aria-describedby` hint), a pixel-space nearest-point hit test on pointer events (mouse hover/leave; touch down/move with `setPointerCapture`; `touch-action: pan-y`), outside-pointerdown dismissal, and keyboard handling (focus → first, ←/→ ordered by time across series, Home/End, Escape, blur). Verify with tests that stub `getBoundingClientRect` and use user-event for: hover-selects-nearest including the stretched-axis case, mouse leave hides, touch tap persists, outside tap hides, Tab → first point, ArrowRight/End/Escape.
- [x] 3.3 Render the popover (date, series label when `showLegend`, value), the highlighted active dot, and the slider's `aria-valuetext` (replaces the planned `aria-live` region, see design §5). Verify with tests asserting the popover and live-region text in en and de (a German date and a decimal comma for fuel price).

## 4. Stacked bar chart

- [x] 4.1 Draw horizontal gridlines from `niceTicks(0, max)` with y-labels per tick formatted by `formatValue`, and no vertical lines. Remove the per-segment `<title>` elements. Verify with an updated `stacked-bar-chart.test.tsx` (530 → labels 0/200/400/600, no `<title>`, hidden table unchanged).
- [x] 4.2 Add the active-category state, a column-slot hit test, the same pointer/touch/keyboard model and ARIA as the line chart, and a popover fixed at the top of the plot showing the category, per-series values and total. Verify with tests: hovering above a bar selects its month, a tiny ticket amount appears in the popover, moving between months keeps `--y` constant, Tab → January, End → December.
- [x] 4.3 Update `src/routes/-dashboard.test.tsx` as needed for the new axis labels and the removed `<title>`s, and verify the dashboard tests pass.

## 5. Integration checks

- [x] 5.1 Run `pnpm typecheck`, `pnpm check` and `pnpm test` in `frontend/` and verify they all pass.
- [x] 5.2 Manually check in the running app (Chromium at a 360 px and a desktop viewport) the dashboard, the `/refuels` fuel-price chart and the car Consumption tab: tap and scrub on the first and last points, confirm the popover stays inside the plot and `document.documentElement.scrollWidth` equals the viewport width, gridlines render faintly behind the data, and Tab/arrow navigation shows a focus ring.
