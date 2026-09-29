import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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

    expect(screen.getByRole('img', { name: 'Expenses' })).toBeInTheDocument()
    expect(container.querySelectorAll('rect')).toHaveLength(3)
    expect(container.querySelectorAll('rect.chart-ticket')).toHaveLength(1)
    const legend = container.querySelector('.chart-legend')
    expect(legend).toHaveTextContent('Refuels')
    expect(legend).toHaveTextContent('Tickets')
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
})
