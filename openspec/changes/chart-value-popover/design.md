# Design

## Context

There are two chart primitives. `components/line-chart.tsx` is used by
`refuels/consumption-chart.tsx` and `refuels/fuel-price-chart.tsx`.
`components/stacked-bar-chart.tsx` is used by the dashboard route. Both:

- draw into an SVG with `viewBox="0 0 100 100"` and
  `preserveAspectRatio="none"`, stretched to the `.chart-plot` grid cell,
  which is 14rem tall and as wide as the card;
- put their axis labels in HTML beside the SVG (`.chart-y-axis`,
  `.chart-x-axis`). These currently show only the minimum and maximum;
- have `vectorEffect="non-scaling-stroke"` strokes, so line widths survive
  the stretch.

No ancestor of the charts sets `overflow: hidden` (checked in
`styles.css`), so nothing clips a popover. The only horizontal risk is
widening the page. The requirements are in
`specs/frontend/charts/spec.md`; the motivation is in `proposal.md`.

## Goals / Non-Goals

**Goals:**
- One interaction model (an active index) shared by both chart primitives.
- Popover placement that stays in bounds without measuring the popover and
  without lagging while scrubbing.
- Tick generation that works for every chart, including fuel prices with
  three decimals and a value axis starting at 0 for bars.

**Non-Goals:**
- Zooming, panning, or choosing a range on the chart.
- Interactive content in the popover (links, buttons).
- ↑/↓ to switch series in the multi-series line chart.
- A visually hidden data table for the line chart. The keyboard stepping
  and live announcements cover screen-reader access.
- Changing what any chart plots or how its data is loaded.

## Decisions

### 1. No popover or chart library; a small in-house `ChartPopover`

The popover is an absolutely positioned `div` inside a
`position: relative` wrapper around the SVG. The wrapper's box is exactly
the SVG's 0–100 box, so a point at viewBox `(x, y)` sits at
`left: x%; top: y%`. The chart sets `--x` and `--y` on the popover, and
CSS does the rest:

```css
.chart-popover {
  --w: min(12rem, 100%);
  position: absolute;
  width: var(--w);
  left: clamp(0px, calc(var(--x) - var(--w) / 2), calc(100% - var(--w)));
}
```

It is placed synchronously in the same render as the active index, so it
doesn't lag behind scrubbing. In jsdom, tests only check the CSS custom
properties.

Alternatives considered:
- **HeadlessUI `Popover`** (already a dependency): a button-driven
  disclosure with its own focus and open state. Our popover is a read-only
  readout with no trigger button, so it would fight that model.
- **Floating UI** (in the lockfile via HeadlessUI): virtual references and
  `shift()` would work, but `computePosition` is async, a frame late while
  scrubbing, and would become a direct dependency to solve a problem CSS
  `clamp()` already solves here.
- **Popover API + CSS anchor positioning:** anchor positioning isn't
  reliable across all target browsers yet, and it needs a DOM element as
  the anchor, but our points are SVG shapes in a stretched viewBox.
- **A chart library (Recharts, visx, …):** reverses the hand-rolled chart
  approach for one feature, and costs bundle size and control over i18n
  and the bar chart's hidden table.

All positioning stays inside `ChartPopover`. If a popover ever has to
escape its card (a scroll container, a modal) or hold interactive content,
that one component can switch to Floating UI.

### 2. Vertical placement

- **Line chart:** the popover goes above the point when `y ≥ 50`, below it
  otherwise, with a small gap. It may extend past the plot's top or
  bottom: vertical overflow can't cause horizontal scroll, and the card has
  padding and a heading above the plot.
- **Bar chart:** the popover is fixed near the top of the plot (`top: 0`,
  overlaying the chart), for every category, and moves horizontally only.
  Its `--x` is the centre of the column slot.

### 3. One active index; every input writes to it

```
mouse/pen pointermove ─┐
touch pointerdown/move ┼─▶ hitTest(px) ─▶ active ─▶ popover, highlight, live text
focus → 0 ─────────────┤
←/→ Home/End ──────────┘
mouse pointerleave · Escape · blur · pointerdown outside ─▶ active = null
```

- **Where state and events live.** State is `useState<number | null>` in
  each chart component. Pointer events are on the plot wrapper.
- **Ordering.** Line-chart values are indexed in one list across all
  series, ordered by time (and by series order for equal times). This is
  the order for keyboard stepping, and "first" is its index 0. Bar-chart
  values are indexed by category.
- **Touch scrubbing.** The wrapper sets `touch-action: pan-y`, so the
  browser keeps vertical scrolling and hands horizontal drags to our
  `pointermove`. `setPointerCapture` on `pointerdown` keeps scrubbing when
  the finger drifts outside the plot. Leaving the plot with a touch
  pointer doesn't clear the active value; a `pointerdown` listener on the
  document outside the chart does, and it is only registered while a
  value is active.
- **Mouse vs touch** is decided by `event.pointerType`, never by user
  agent or media query, so hybrid devices behave per input.

### 4. Hit testing in pixels

The viewBox is stretched unevenly, so a distance in viewBox units would
favour one axis. On each pointer event, the chart:
1. reads the wrapper's `getBoundingClientRect()`;
2. converts each point's viewBox coordinates to pixels
   (`x / 100 * width`, `y / 100 * height`);
3. picks the smallest squared Euclidean distance.

This is linear in the number of points, which is at most a few hundred
refuels, so no spatial index is needed. The bar chart only needs
`floor((px / width) * categories.length)`, clamped. Tests stub
`getBoundingClientRect` on the wrapper.

### 5. Focus and ARIA

- The plot area is the WAI-ARIA **slider** pattern: `role="slider"`,
  `tabIndex={0}`, `aria-label` set to the chart label, and
  `aria-describedby` pointing to a visually hidden, localized keyboard
  hint.
  - ←/→ and Home/End are exactly the slider's keyboard contract.
  - `aria-valuemin`/`aria-valuemax`/`aria-valuenow` are the 1-based value
    index.
  - `aria-valuetext` is the popover's text, so screen readers announce it
    whenever it changes, with no separate live region.
- **Why slider and not group.** The first idea, a focusable
  `role="group"` with an `aria-live` region, is rejected by Biome's a11y
  rules (`noNoninteractiveTabindex`, `useSemanticElements`). The repo has
  no lint suppressions. A slider is also the closer semantic match for
  "one control stepping through ordered values".
- The SVG is `aria-hidden`, and so is the visible popover. The bar chart's
  visually hidden table stays.
- The focus ring copies the existing `:focus-visible` outline.
- `onFocus` sets index 0 only when focus didn't come from a pointer press
  and no value is active yet, so a click keeps the value it picked.

### 6. Ticks

Add a pure helper, `niceTicks(min, max, target = 5)`, which returns
`{ start, end, step, values }`:

- `step` is the smallest of 1, 2, 5 × 10ⁿ that gives at most ~6 ticks;
- `start` is `floor(min / step) * step` and `end` is
  `ceil(max / step) * step`;
- when `min === max`, it widens to `min - step` .. `max + step`, with the
  step computed from the magnitude of the value.

Sample outputs:
- consumption 6.12–7.93 → step 0.5 → 6, 6.5, 7, 7.5, 8;
- bar totals 0–530 → step 200 → 0, 200, 400, 600;
- fuel price 1.41–1.89 → step 0.1 → 1.4 … 1.9.

The bar chart calls it with `min = 0`. Values are computed with integer
multiples of `step` (`start + i * step`), rounded to the step's decimals,
so they don't accumulate floating-point drift.

**Tick formatting.**
- `LineChart` takes a `formatTick(value, step)`; the charts derive the
  decimal places from `step`. For example, fuel price prints `1.4`, not
  `1.400`, while the popover keeps three decimals.
- `StackedBarChart` formats ticks with its existing `formatValue`, passing
  the tick as a string.

**Time ticks.** A second pure helper, `timeTicks(minTime, maxTime)`:
- picks the unit by span: ≤ ~9 weeks → weeks (Mondays); ≤ ~18 months →
  months; ≤ ~5 years → quarters; longer → years;
- returns the local boundary instants strictly inside the range, plus a
  `narrow` subset for small screens (every other tick);
- formats each label with `Intl.DateTimeFormat` for its unit: day+month,
  month, "Q2 2026" through a localized message, or year.

The x-axis labels become absolutely positioned at each tick's `%`. The
wide and narrow sets toggle with the same CSS media query the bar chart
uses for `axis-label-wide` / `axis-label-narrow`.

The y-axis column changes from `space-between` to labels positioned at
each tick's `%`, translated by −50% vertically so each label centres on
its line.

### 7. Grid rendering

- Gridlines are `<line>`s in a `<g className="chart-grid">` drawn before
  the series and bars, with `vectorEffect="non-scaling-stroke"`.
- Styling is `stroke: var(--muted); stroke-opacity: 0.25; stroke-width: 1px`.
- There is no dark theme in `styles.css`, so one token is enough.
- The existing bottom and left borders of the plot stay as the axes.

### 8. Removing `<title>` from bar segments

The popover replaces them. Leaving them in would show both on desktop.
The bar chart's visually hidden table stays unchanged.

## Risks / Trade-offs

- [`touch-action: pan-y` blocks horizontal pinch and pan over the plot] →
  The page never scrolls horizontally, and pinch-zoom of the page still
  works outside the plot. Acceptable for a 14rem-tall area.
- [jsdom doesn't lay out, so hit testing and clamping can't be verified
  visually in unit tests] → Stub `getBoundingClientRect` for hit tests and
  assert `--x`/`--y` for placement. A manual browser check at a 360 px
  viewport is part of the task list (task 5.2).
- [Padding the y-domain to round ticks changes how existing charts look:
  points no longer touch the edges] → Intended by the spec. Chart tests
  that assert extreme y positions may need updating.
- [A tall bar popover (5 lines) at the top of the plot hides the top of
  tall bars] → It only appears on interaction and is dismissed by leaving
  the plot, pressing Escape or tapping outside. This is what the user chose
  over a popover that follows the bar.
- [Hundreds of points × pointermove re-renders] → The hit test is O(n)
  with n ≤ a few hundred. Only `active` changes, so React reconciles just
  the dot and the popover. Revisit only if profiling shows jank.
- [Multi-series ordering with equal dates] → Ties are broken by series
  order so keyboard stepping stays deterministic.

## Migration Plan

Frontend only, with no data or API changes. It ships with the next static
build. Rollback is reverting the change.
