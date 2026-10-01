import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import '#/i18n'

import { StackedBarChart } from './stacked-bar-chart'

const series = [
  {
    key: 'refuel',
    className: 'chart-refuel',
    label: 'Refuels',
    values: ['0.1', '0', '50'],
  },
  {
    key: 'ticket',
    className: 'chart-ticket',
    label: 'Tickets',
    values: ['0.2', '0', '0'],
  },
]

function renderChart(values = series) {
  return render(
    <StackedBarChart
      categories={['Jan', 'Feb', 'Mar']}
      series={values}
      formatValue={(value) => `€${value}`}
      label="Expenses"
      categoryLabel="Month"
      totalLabel="Total"
      empty={<p>Nothing</p>}
    />,
  )
}

describe('StackedBarChart', () => {
  it('draws one segment per non-zero value with a legend', () => {
    const { container } = renderChart()

    expect(screen.getByRole('slider', { name: 'Expenses' })).toBeInTheDocument()
    expect(container.querySelectorAll('rect')).toHaveLength(3)
    expect(container.querySelectorAll('rect.chart-ticket')).toHaveLength(1)
    const legend = container.querySelector('.chart-legend')
    expect(legend).toHaveTextContent('Refuels')
    expect(legend).toHaveTextContent('Tickets')
  })

  it('labels round value ticks without vertical gridlines or titles', () => {
    const { container } = renderChart()
    const ticks = [...container.querySelectorAll('.chart-y-axis > .chart-tick')]
    expect(ticks.map((tick) => tick.textContent)).toEqual([
      '€0',
      '€10',
      '€20',
      '€30',
      '€40',
      '€50',
    ])
    const lines = [...container.querySelectorAll('.chart-grid line')]
    expect(lines).toHaveLength(6)
    for (const line of lines) {
      expect(line.getAttribute('y1')).toBe(line.getAttribute('y2'))
    }
    expect(container.querySelector('title')).toBeNull()
  })

  it('stacks the first series at the bottom', () => {
    const { container } = renderChart()
    const [refuel, ticket] = container.querySelectorAll('rect')
    expect(Number(ticket.getAttribute('y'))).toBeLessThan(
      Number(refuel.getAttribute('y')),
    )
  })

  it('lists every category with exact values and totals in a table', () => {
    renderChart()
    const table = screen.getByRole('table', { name: 'Expenses' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(4)
    expect(rows[0]).toHaveTextContent('MonthRefuelsTicketsTotal')
    expect(rows[1]).toHaveTextContent('Jan€0.1€0.2€0.3')
    expect(rows[2]).toHaveTextContent('Feb€0€0€0')
    expect(rows[3]).toHaveTextContent('Mar€50€0€50')
  })

  it('renders the empty state when every value is zero', () => {
    const { container } = renderChart(
      series.map((s) => ({ ...s, values: ['0', '0.00', '0'] })),
    )
    expect(screen.getByText('Nothing')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('shows a whole column in a popover at a fixed height', async () => {
    const user = userEvent.setup()
    renderChart()
    const plot = screen.getByRole('slider', { name: 'Expenses' })
    vi.spyOn(plot, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 300,
      bottom: 200,
      width: 300,
      height: 200,
      toJSON: () => ({}),
    })
    const popover = () =>
      document.querySelector('.chart-popover') as HTMLElement

    // Far above January's tiny bar, whose ticket segment is not drawn tall
    // enough to hit.
    await user.pointer({ target: plot, coords: { clientX: 50, clientY: 5 } })
    expect(popover()).toHaveTextContent('JanRefuels€0.1Tickets€0.2Total€0.3')
    const y = popover().style.getPropertyValue('--y')

    await user.pointer({ target: plot, coords: { clientX: 250, clientY: 190 } })
    expect(popover()).toHaveTextContent('MarRefuels€50Tickets€0Total€50')
    expect(popover().style.getPropertyValue('--y')).toBe(y)
    expect(popover()).toHaveClass('chart-popover-top')
    expect(document.querySelector('.chart-column-active')).not.toBeNull()

    await user.pointer({ target: document.body })
    expect(popover()).toBeNull()
  })

  it('steps through the categories from the keyboard', async () => {
    const user = userEvent.setup()
    renderChart()
    const plot = screen.getByRole('slider', { name: 'Expenses' })
    await user.tab()
    expect(plot).toHaveFocus()
    expect(plot).toHaveAttribute(
      'aria-valuetext',
      'Jan: Refuels €0.1, Tickets €0.2, Total €0.3',
    )
    await user.keyboard('{End}')
    expect(document.querySelector('.chart-popover')).toHaveTextContent('Mar')
    await user.keyboard('{ArrowLeft}')
    expect(document.querySelector('.chart-popover')).toHaveTextContent('Feb')
    await user.keyboard('{Escape}')
    expect(document.querySelector('.chart-popover')).toBeNull()
  })
})
