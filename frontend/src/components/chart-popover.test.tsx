import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChartPopover } from './chart-popover'

describe('ChartPopover', () => {
  it('anchors at the given percentages with its placement', () => {
    const { container } = render(
      <ChartPopover x={97.5} y={20} placement="below">
        Value
      </ChartPopover>,
    )
    const popover = container.querySelector('.chart-popover') as HTMLElement
    expect(popover).toHaveClass('chart-popover-below')
    expect(popover.style.getPropertyValue('--x')).toBe('97.5%')
    expect(popover.style.getPropertyValue('--y')).toBe('20%')
    expect(popover).toHaveAttribute('aria-hidden', 'true')
    expect(popover).toHaveTextContent('Value')
  })
})
