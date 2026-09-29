import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Refuel } from '#/api/client'
import '#/i18n'
import { renderInRouter } from '#/test/render-in-router'

import { RefuelTable } from './refuel-table'

const refuel: Refuel = {
  id: '33333333-3333-3333-3333-333333333333',
  carId: '22222222-2222-2222-2222-222222222222',
  date: '2026-09-28T10:00:00Z',
  station: 'Fuel',
  odometerReading: 1500,
  fuel: 'normal',
  liters: '40',
  amount: '60',
  perLiter: '1.5',
  distance: null,
  consumption: null,
}

describe('RefuelTable', () => {
  it('shows the car column and total when given', async () => {
    await renderInRouter(
      <RefuelTable
        items={[refuel]}
        derived={new Map([[refuel.id, { ...refuel, consumption: '8' }]])}
        carNames={new Map([[refuel.carId, 'VW Golf']])}
        total={60}
      />,
    )
    expect(
      await screen.findByRole('columnheader', { name: 'Car' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'VW Golf' })).toBeInTheDocument()
    expect(screen.getByText('Total of the refuels shown')).toHaveAttribute(
      'colspan',
      '7',
    )
    expect(screen.getByText('8 l/100 km')).toBeInTheDocument()
  })

  it('hides the car column and total when left out', async () => {
    await renderInRouter(<RefuelTable items={[refuel]} derived={new Map()} />)
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: 'Car' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(8)
    expect(
      screen.queryByText('Total of the refuels shown'),
    ).not.toBeInTheDocument()
  })
})
