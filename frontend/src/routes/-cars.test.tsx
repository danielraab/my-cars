import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Car } from '#/api/client'
import { i18n } from '#/i18n'
import { renderApp } from '#/test/render-app'

const profile = {
  id: '617c3d87-21b4-4cb9-96f3-e03510892296',
  email: 'driver@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
}

const golf: Car = {
  id: '9b0a5f0e-5d8f-4a55-9d59-0b8f1f3c2a10',
  type: 'Hatchback',
  make: 'VW',
  name: 'Golf',
  fuel: 'diesel',
  firstRegistration: '2019-03-01',
  licensePlate: 'W-123AB',
  fin: null,
  isActive: true,
  purchaseDate: '2019-04-15',
  purchasePrice: '18500.50',
  createdAt: '2026-09-27T10:00:00Z',
  updatedAt: '2026-09-27T10:00:00Z',
}

const zoe: Car = {
  ...golf,
  id: '3f1e8a52-7c2b-4d0e-9a61-5b4c3d2e1f00',
  make: 'Renault',
  name: 'Zoe',
  fuel: 'electric',
  licensePlate: 'W-777EV',
  purchasePrice: null,
}

const ka: Car = {
  ...golf,
  id: 'c7d2e0a4-1b3f-4e5a-8c6d-7e8f9a0b1c2d',
  make: 'Ford',
  name: 'Ka',
  firstRegistration: null,
  licensePlate: null,
}

function response(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
}

type Handler = (init?: RequestInit) => Response | Promise<Response>

// Routes fetch calls by "METHOD path"; the session is always valid.
function backend(routes: Record<string, Handler | Handler[]>) {
  const calls: { key: string; init?: RequestInit }[] = []
  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${path}`
    calls.push({ key, init })
    if (key === 'GET /api/v1/session') return response(200, { profile })
    const route = routes[key]
    const handler = Array.isArray(route) ? route.shift() : route
    if (!handler) throw new Error(`unexpected request ${key}`)
    return handler(init)
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

function bodyOf(calls: ReturnType<typeof backend>, key: string) {
  const call = calls.find((candidate) => candidate.key === key)
  return JSON.parse(String(call?.init?.body))
}

const carPath = `/api/v1/cars/${golf.id}`

beforeEach(async () => {
  await i18n.changeLanguage('en')
  document.documentElement.lang = 'en'
  vi.unstubAllGlobals()
})

describe('cars list', () => {
  it('shows the documented columns and links to create and detail', async () => {
    backend({
      'GET /api/v1/cars': () =>
        response(200, { items: [golf, zoe], nextCursor: null }),
    })
    renderApp('/cars')

    const table = await screen.findByRole('table', { name: 'Your cars' })
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers).toEqual([
      'Type',
      'Make',
      'Name',
      'Fuel',
      'First registration',
      'License plate',
      'Purchase price',
    ])
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]).getByRole('link', { name: 'Golf' })).toHaveAttribute(
      'href',
      `/cars/${golf.id}`,
    )
    expect(rows[1]).toHaveTextContent('Diesel')
    expect(rows[1]).toHaveTextContent('Mar 1, 2019')
    expect(rows[1]).toHaveTextContent('18,500.50')
    expect(rows[2]).toHaveTextContent('Electric')
    expect(rows[2]).toHaveTextContent('Not recorded')
    expect(screen.getByRole('link', { name: 'Add car' })).toHaveAttribute(
      'href',
      '/cars/create',
    )
    expect(
      screen.queryByRole('button', { name: 'Load more cars' }),
    ).not.toBeInTheDocument()
  })

  it('shows a placeholder for absent registration details', async () => {
    backend({
      'GET /api/v1/cars': () =>
        response(200, { items: [ka], nextCursor: null }),
    })
    renderApp('/cars')

    const table = await screen.findByRole('table', { name: 'Your cars' })
    const cells = within(within(table).getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
    expect(cells.slice(4, 6)).toEqual(['Not recorded', 'Not recorded'])
  })

  it('appends a further page when asked', async () => {
    const calls = backend({
      'GET /api/v1/cars': () =>
        response(200, { items: [golf], nextCursor: 'c1' }),
      'GET /api/v1/cars?cursor=c1': () =>
        response(200, { items: [zoe], nextCursor: null }),
    })
    const user = userEvent.setup()
    renderApp('/cars')

    await screen.findByRole('link', { name: 'Golf' })
    await user.click(screen.getByRole('button', { name: 'Load more cars' }))

    expect(await screen.findByRole('link', { name: 'Zoe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Golf' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Load more cars' }),
    ).not.toBeInTheDocument()
    expect(calls.map((call) => call.key)).toContain(
      'GET /api/v1/cars?cursor=c1',
    )
  })

  it('shows a retryable error when the cars cannot be loaded', async () => {
    backend({
      'GET /api/v1/cars': [
        () => response(503, { code: 'unavailable', message: 'down' }),
        () => response(200, { items: [golf], nextCursor: null }),
      ],
    })
    const user = userEvent.setup()
    renderApp('/cars')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Cars unavailable')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('link', { name: 'Golf' }),
    ).toBeInTheDocument()
  })

  it('follows a switch to German', async () => {
    backend({
      'GET /api/v1/cars': () =>
        response(200, {
          items: [{ ...golf, fuel: 'gasoline' }],
          nextCursor: null,
        }),
    })
    const user = userEvent.setup()
    renderApp('/cars')

    await screen.findByRole('link', { name: 'Golf' })
    await user.selectOptions(
      screen.getAllByRole('combobox', { name: 'Language' })[0],
      'de',
    )

    expect(
      await screen.findByRole('heading', { name: 'Autos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Erstzulassung' }),
    ).toBeInTheDocument()
    const row = screen.getAllByRole('row')[1]
    expect(row).toHaveTextContent('Benzin')
    expect(row).toHaveTextContent('01.03.2019')
    expect(row).toHaveTextContent('18.500,50')
    expect(
      screen.getByRole('link', { name: 'Auto hinzufügen' }),
    ).toBeInTheDocument()
  })
})

describe('car creation', () => {
  async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
      await screen.findByRole('textbox', { name: 'Type' }),
      'Hatchback',
    )
    await user.type(screen.getByRole('textbox', { name: 'Make' }), 'VW')
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Golf')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Fuel' }),
      'diesel',
    )
    fireEvent.change(screen.getByLabelText(/First registration/), {
      target: { value: '2019-03-01' },
    })
    await user.type(
      screen.getByRole('textbox', { name: /License plate/ }),
      'W-123AB',
    )
  }

  it('creates a car and opens its detail screen', async () => {
    const calls = backend({
      'POST /api/v1/cars': () => response(201, golf),
      [`GET ${carPath}`]: () => response(200, golf),
    })
    const user = userEvent.setup()
    const { router } = renderApp('/cars/create')

    await fillRequired(user)
    await user.type(
      screen.getByRole('textbox', { name: /Purchase price/ }),
      '18500,50',
    )
    await user.click(screen.getByRole('button', { name: 'Add car' }))

    expect(
      await screen.findByRole('heading', { name: 'Golf' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/cars/${golf.id}`)
    expect(bodyOf(calls, 'POST /api/v1/cars')).toEqual({
      type: 'Hatchback',
      make: 'VW',
      name: 'Golf',
      fuel: 'diesel',
      firstRegistration: '2019-03-01',
      licensePlate: 'W-123AB',
      fin: null,
      purchaseDate: null,
      purchasePrice: '18500.50',
    })
    expect(screen.queryByLabelText(/Active/)).not.toBeInTheDocument()
  })

  it('sends absent registration details as null', async () => {
    const calls = backend({
      'POST /api/v1/cars': () => response(201, ka),
      [`GET /api/v1/cars/${ka.id}`]: () => response(200, ka),
    })
    const user = userEvent.setup()
    renderApp('/cars/create')

    await user.type(
      await screen.findByRole('textbox', { name: 'Type' }),
      'Hatchback',
    )
    await user.type(screen.getByRole('textbox', { name: 'Make' }), 'Ford')
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ka')
    expect(screen.getByLabelText(/First registration/)).not.toBeRequired()
    expect(
      screen.getByRole('textbox', { name: /License plate/ }),
    ).not.toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Add car' }))

    expect(
      await screen.findByRole('heading', { name: 'Ka' }),
    ).toBeInTheDocument()
    expect(bodyOf(calls, 'POST /api/v1/cars')).toMatchObject({
      firstRegistration: null,
      licensePlate: null,
    })
  })

  it('shows a backend rejection on the affected field and keeps the input', async () => {
    backend({
      'POST /api/v1/cars': () =>
        response(400, {
          code: 'validation_failed',
          message: 'request validation failed',
          fields: { licensePlate: 'empty' },
        }),
    })
    const user = userEvent.setup()
    const { router } = renderApp('/cars/create')

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: 'Add car' }))

    const plate = screen.getByRole('textbox', { name: /License plate/ })
    expect(await screen.findByText('Fill in this field.')).toHaveAttribute(
      'id',
      'car-licensePlate-error',
    )
    expect(plate).toHaveAttribute('aria-invalid', 'true')
    expect(plate).toHaveAttribute('aria-describedby', 'car-licensePlate-error')
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Golf')
    expect(router.state.location.pathname).toBe('/cars/create')
  })
})

describe('car detail', () => {
  it("shows the car's fields and an edit action", async () => {
    backend({ [`GET ${carPath}`]: () => response(200, golf) })
    renderApp(`/cars/${golf.id}`)

    expect(
      await screen.findByRole('heading', { name: 'Golf' }),
    ).toBeInTheDocument()
    const details = screen.getByText('Hatchback').closest('dl') as HTMLElement
    const pairs = Array.from(details.querySelectorAll('div')).map((pair) => [
      pair.querySelector('dt')?.textContent,
      pair.querySelector('dd')?.textContent,
    ])
    expect(pairs).toEqual([
      ['Type', 'Hatchback'],
      ['Make', 'VW'],
      ['Name', 'Golf'],
      ['Fuel', 'Diesel'],
      ['First registration', 'Mar 1, 2019'],
      ['License plate', 'W-123AB'],
      ['Vehicle identification number (FIN)', 'Not recorded'],
      ['Purchase date', 'Apr 15, 2019'],
      ['Purchase price', '18,500.50'],
    ])
    expect(screen.getByRole('link', { name: 'Edit car' })).toHaveAttribute(
      'href',
      `/cars/${golf.id}/edit`,
    )
  })

  it('shows a placeholder for absent registration details', async () => {
    backend({ [`GET /api/v1/cars/${ka.id}`]: () => response(200, ka) })
    renderApp(`/cars/${ka.id}`)

    const heading = await screen.findByRole('heading', { name: 'Ka' })
    expect(heading.nextElementSibling).toHaveTextContent(/^Ford$/)
    const details = screen.getByText('Hatchback').closest('dl') as HTMLElement
    const value = (field: string) =>
      within(details).getByText(field).nextElementSibling?.textContent
    expect(value('First registration')).toBe('Not recorded')
    expect(value('License plate')).toBe('Not recorded')
  })

  it('shows a not-found state for a missing or unowned car', async () => {
    backend({
      [`GET ${carPath}`]: () =>
        response(404, { code: 'not_found', message: 'resource not found' }),
    })
    renderApp(`/cars/${golf.id}`)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Car not found')
    expect(
      within(alert).getByRole('link', { name: 'Back to cars' }),
    ).toHaveAttribute('href', '/cars')
    expect(
      screen.queryByRole('link', { name: 'Edit car' }),
    ).not.toBeInTheDocument()
  })
})

describe('car editing', () => {
  it('saves a change and shows it on the detail screen', async () => {
    const saved = { ...golf, name: 'Golf GTD', fin: 'WVWZZZ1KZ' }
    const calls = backend({
      [`GET ${carPath}`]: [
        () => response(200, golf),
        () => response(200, saved),
      ],
      [`PATCH ${carPath}`]: () => response(200, saved),
    })
    const user = userEvent.setup()
    const { router } = renderApp(`/cars/${golf.id}/edit`)

    const name = await screen.findByRole('textbox', { name: 'Name' })
    expect(name).toHaveValue('Golf')
    expect(screen.getByRole('combobox', { name: 'Fuel' })).toHaveValue('diesel')
    await user.clear(name)
    await user.type(name, 'Golf GTD')
    await user.type(screen.getByRole('textbox', { name: /FIN/ }), 'WVWZZZ1KZ')
    await user.clear(screen.getByRole('textbox', { name: /Purchase price/ }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByRole('heading', { name: 'Golf GTD' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/cars/${golf.id}`)
    expect(screen.getByText('WVWZZZ1KZ')).toBeInTheDocument()
    expect(bodyOf(calls, `PATCH ${carPath}`)).toMatchObject({
      name: 'Golf GTD',
      fin: 'WVWZZZ1KZ',
      purchaseDate: '2019-04-15',
      purchasePrice: null,
    })
  })

  it('clears the license plate', async () => {
    const saved = { ...golf, licensePlate: null }
    const calls = backend({
      [`GET ${carPath}`]: [
        () => response(200, golf),
        () => response(200, saved),
      ],
      [`PATCH ${carPath}`]: () => response(200, saved),
    })
    const user = userEvent.setup()
    renderApp(`/cars/${golf.id}/edit`)

    const plate = await screen.findByRole('textbox', { name: /License plate/ })
    expect(plate).toHaveValue('W-123AB')
    await user.clear(plate)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByRole('heading', { name: 'Golf' }),
    ).toBeInTheDocument()
    expect(bodyOf(calls, `PATCH ${carPath}`)).toMatchObject({
      licensePlate: null,
      firstRegistration: '2019-03-01',
    })
  })

  it('keeps the car when a delete is not confirmed', async () => {
    const calls = backend({ [`GET ${carPath}`]: () => response(200, golf) })
    const user = userEvent.setup()
    renderApp(`/cars/${golf.id}/edit`)

    await user.click(await screen.findByRole('button', { name: 'Delete car' }))
    expect(
      screen.getByRole('group', { name: /Delete this car/ }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep car' }))

    expect(
      screen.getByRole('button', { name: 'Delete car' }),
    ).toBeInTheDocument()
    expect(calls.some((call) => call.key.startsWith('DELETE'))).toBe(false)
  })

  it('deletes the car after confirmation and returns to the list', async () => {
    const calls = backend({
      [`GET ${carPath}`]: () => response(200, golf),
      [`DELETE ${carPath}`]: () => response(204),
      'GET /api/v1/cars': () => response(200, { items: [], nextCursor: null }),
    })
    const user = userEvent.setup()
    const { router } = renderApp(`/cars/${golf.id}/edit`)

    await user.click(await screen.findByRole('button', { name: 'Delete car' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete car' }))

    expect(
      await screen.findByText('You have not added a car yet.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/cars'))
    expect(
      calls.filter((call) => call.key === `DELETE ${carPath}`),
    ).toHaveLength(1)
  })
})
