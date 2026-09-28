import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Car, Refuel } from '#/api/client'
import { i18n } from '#/i18n'
import { renderApp } from '#/test/render-app'

const profile = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'driver@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
}
const car: Car = {
  id: '22222222-2222-2222-2222-222222222222',
  type: 'Car',
  make: 'VW',
  name: 'Golf',
  fuel: 'diesel',
  firstRegistration: '2020-01-01',
  licensePlate: 'W-1',
  fin: null,
  isActive: true,
  purchaseDate: null,
  purchasePrice: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
const refuel: Refuel = {
  id: '33333333-3333-3333-3333-333333333333',
  carId: car.id,
  date: '2026-01-02T10:00:00Z',
  station: 'Fuel',
  odometerReading: 1000,
  fuel: 'normal',
  liters: '40',
  amount: '60',
  perLiter: '1.5',
  distance: null,
  consumption: null,
}
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
function backend() {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const call = `${init?.method ?? 'GET'} ${path}`
      calls.push(call)
      if (path === '/api/v1/session') return response({ profile })
      if (path === '/api/v1/cars?limit=100')
        return response({ items: [car], nextCursor: null })
      if (path === '/api/v1/refuels/stations') return response([])
      if (path.startsWith('/api/v1/refuels/chart'))
        return response({ items: [refuel] })
      if (
        call === 'POST /api/v1/refuels' ||
        call.startsWith('PATCH /api/v1/refuels/')
      )
        return response(refuel, call.startsWith('POST') ? 201 : 200)
      if (call.startsWith('DELETE /api/v1/refuels/'))
        return new Response(null, { status: 204 })
      if (path === `/api/v1/refuels/${refuel.id}`) return response(refuel)
      if (path.startsWith('/api/v1/refuels'))
        return response({ items: [refuel], nextCursor: null })
      throw new Error(path)
    }),
  )
  return calls
}
beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.unstubAllGlobals()
})
describe('refuels', () => {
  it('shows the complete chart, table and total and filters both queries', async () => {
    const calls = backend()
    const user = userEvent.setup()
    renderApp('/refuels')
    const table = await screen.findByRole('table', { name: 'Your refuels' })
    expect(
      within(table).getByRole('columnheader', { name: 'Fuel' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Fuel price history' }),
    ).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Filter by car'), car.id)
    await screen.findByRole('table', { name: 'Your refuels' })
    expect(calls).toContain(`GET /api/v1/refuels?carId=${car.id}`)
    expect(calls).toContain(`GET /api/v1/refuels/chart?carId=${car.id}`)
  })
  it('preselects a car on creation', async () => {
    backend()
    renderApp(`/refuels/create?carId=${car.id}`)
    expect(await screen.findByLabelText('Car')).toHaveValue(car.id)
  })
  it('creates a refuel and returns to the list', async () => {
    const calls = backend()
    const user = userEvent.setup()
    renderApp('/refuels/create')
    await user.selectOptions(await screen.findByLabelText('Car'), car.id)
    await user.type(screen.getByLabelText('Station'), 'Fuel')
    await user.type(screen.getByLabelText('Litres'), '40')
    await user.type(screen.getByLabelText('Amount'), '60')
    await user.click(screen.getByRole('button', { name: 'Add refuel' }))
    expect(
      await screen.findByRole('heading', { name: 'Refuels' }),
    ).toBeInTheDocument()
    expect(calls).toContain('POST /api/v1/refuels')
  })
  it('deletes a refuel only after confirmation', async () => {
    const calls = backend()
    const user = userEvent.setup()
    renderApp(`/refuels/${refuel.id}/edit`)
    await user.click(
      await screen.findByRole('button', { name: 'Delete refuel' }),
    )
    await user.click(screen.getByRole('button', { name: 'Yes, delete refuel' }))
    expect(
      await screen.findByRole('heading', { name: 'Refuels' }),
    ).toBeInTheDocument()
    expect(calls).toContain(`DELETE /api/v1/refuels/${refuel.id}`)
  })
  it('switches refuel labels to German', async () => {
    backend()
    const user = userEvent.setup()
    renderApp('/refuels')
    await screen.findByRole('heading', { name: 'Refuels' })
    await user.selectOptions(screen.getByLabelText('Language'), 'de')
    expect(
      await screen.findByRole('heading', { name: 'Tankvorgänge' }),
    ).toBeInTheDocument()
  })
})
