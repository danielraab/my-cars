# Proposal

## Why

The rewrite's charts show only their minimum and maximum on the axes, so
the exact value behind a point or bar can't be read. The line charts
(consumption, fuel price) have no way to reveal a value at all. The
dashboard's bar chart has native SVG `<title>` tooltips, which appear late
on desktop, never on touch devices, and are nearly impossible to hit on a
thin segment. Keyboard users can't reach any value in a line chart.

This is a new capability, not a parity item. The legacy Chart.js tooltips
are not in `docs/parity-checklist.md`, and this change goes beyond them:
touch scrubbing, keyboard access and gridlines.

## What Changes

- **Value popover on every chart.** It shows the exact numbers for the
  active point or month and sits over the chart:
  - **Line charts** (consumption on the car detail Consumption tab, fuel
    price on `/refuels`): the active point is the one nearest the pointer
    in on-screen distance. The popover shows its date, its series (when the
    chart has a legend) and its formatted value. The active point is
    highlighted.
  - **Stacked bar chart** (dashboard): the active month is the column under
    the pointer. The popover shows the month, every series' amount and the
    total. It stays at a fixed overlay position and does not follow the
    bar's height.
- **Pointer and touch input.**
  - A mouse or pen hover shows the popover; leaving the plot hides it.
  - Tapping shows it, and dragging a finger across the plot scrubs the
    active point. Vertical page scrolling keeps working.
  - Tapping outside the chart hides it.
- **Keyboard input.**
  - Each plot is one focusable tab stop. Focusing it activates the first
    point or month.
  - ←/→ step through points or months, and Home/End jump to the first or
    last.
  - Escape hides the popover, and so does leaving the plot.
  - The popover's text is announced to screen readers.
- **Popover stays on screen.** On narrow screens it never widens the page
  and is never cut off horizontally: it is clamped inside the plot's width.
- **Gridlines.**
  - The line chart gets horizontal gridlines at round value ticks, each
    labelled on the y-axis, and vertical gridlines at calendar boundaries
    (week, month, quarter or year, by range), labelled on the x-axis.
  - The bar chart gets horizontal gridlines at round value ticks from 0,
    labelled on the y-axis.
  - Gridlines are drawn in a light grey at reduced opacity behind the data.
- **Removed:** the bar segments' native `<title>` tooltips, which the
  popover replaces.
- **Localization.** The keyboard hint, popover dates, month and number
  formats, in German and English.

## Capabilities

### New Capabilities

- `frontend/charts`: shared behaviour for every chart in the frontend: the
  value popover and how pointer, touch and keyboard input select a value,
  and the gridlines with labelled ticks.

### Modified Capabilities

None. The dashboard, cars and refuels specs describe what each chart
plots, and that doesn't change. The new capability applies to all of them.

## Impact

- **Frontend:**
  - `components/line-chart.tsx` and `components/stacked-bar-chart.tsx`
    gain an active-value state, gridlines and tick labels.
  - A shared popover component and tick helpers are added beside them.
  - `refuels/consumption-chart.tsx` and `refuels/fuel-price-chart.tsx`
    pass tick formatters.
  - The dashboard route passes a bar-chart tick formatter.
  - Chart styles in `styles.css`, de/en messages, and tests for the charts
    and their routes.
- **Dependencies:** no new dependency. Popover positioning is plain CSS.
- **Backend / API contract:** none.
- **Parity:** none. This is a new capability, and `old/` is not touched.
