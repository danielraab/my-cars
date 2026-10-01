import type { CSSProperties, ReactNode } from 'react'

export type PopoverPlacement = 'above' | 'below' | 'top'

// The exact numbers behind a chart's active point or category, laid over the
// plot. x and y are the anchor in the plot's 0–100 box, which maps onto the
// plot area in percent; CSS clamps the popover horizontally inside the plot
// so it never widens the page, while it may spill above or below. Assistive
// technology reads the plot's aria-valuetext instead, so this is hidden.
export function ChartPopover({
  x,
  y,
  placement,
  children,
}: {
  x: number
  y: number
  placement: PopoverPlacement
  children: ReactNode
}) {
  return (
    <div
      className={`chart-popover chart-popover-${placement}`}
      style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
