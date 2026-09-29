import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Refuel } from '#/api/client'
import { i18n } from '#/i18n'

import { ConsumptionChart } from './consumption-chart'

const first: Refuel = {
  id: '33333333-3333-3333-3333-333333333331',
  carId: '22222222-2222-2222-2222-222222222222',
  date: '2026-01-10T10:00:00Z',
  station: 'Fuel',
  odometerReading: 1000,
  fuel: 'normal',
  liters: '40',
  amount: '60',
  perLiter: '1.5',
  distance: null,
  consumption: null,
}
const items: Refuel[] = [
  first,
  {
    ...first,
    id: '33333333-3333-3333-3333-333333333332',
    date: '2026-02-10T10:00:00Z',
    odometerReading: 1500,
    distance: 500,
    consumption: '8',
  },
  {
    ...first,
    id: '33333333-3333-3333-3333-333333333333',
    date: '2026-03-10T10:00:00Z',
    odometerReading: 2100,
    distance: 600,
    consumption: '6.67',
  },
]

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('ConsumptionChart', () => {
  it('plots only refuels with a consumption', () => {
    const { container } = render(
      <ConsumptionChart items={items} label="Consumption" />,
    )
    expect(screen.getByRole('img', { name: 'Consumption' })).toBeInTheDocument()
    expect(container.querySelectorAll('.chart-dot')).toHaveLength(2)
    expect(container.querySelectorAll('polyline')).toHaveLength(1)
    expect(screen.getByText('8 l/100 km')).toBeInTheDocument()
    expect(screen.getByText('6.67 l/100 km')).toBeInTheDocument()
    expect(screen.getByText('Feb 10, 2026')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the empty state when no refuel has a consumption', () => {
    render(<ConsumptionChart items={[first]} label="Consumption" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Not enough refuels with odometer readings in this range.',
      ),
    ).toBeInTheDocument()
  })

  it('formats values and dates in German', async () => {
    await i18n.changeLanguage('de')
    render(<ConsumptionChart items={items} label="Verbrauch" />)
    expect(screen.getByText('6,67 l/100 km')).toBeInTheDocument()
    expect(screen.getByText('10.02.2026')).toBeInTheDocument()
  })
})
