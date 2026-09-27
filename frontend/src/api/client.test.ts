import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  createCar,
  deleteCar,
  getAuthenticationMethods,
  getCar,
  getCars,
  getMe,
  getSession,
  logout,
  requestMagicLink,
  UnauthorizedError,
  updateCar,
  updateMe,
} from './client'

const session = {
  profile: {
    id: '617c3d87-21b4-4cb9-96f3-e03510892296',
    email: 'driver@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('API client', () => {
  it('returns enabled authentication methods', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ methods: ['magic_link', 'oidc'] }), {
          status: 200,
        }),
      ),
    )

    await expect(getAuthenticationMethods()).resolves.toEqual({
      methods: ['magic_link', 'oidc'],
    })
  })

  it.each([
    {},
    { methods: [] },
    { methods: ['oidc'] },
    { methods: ['magic_link', 'password'] },
    { methods: ['magic_link', 'magic_link'] },
  ])('rejects malformed authentication methods %#', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
    )

    await expect(getAuthenticationMethods()).rejects.toMatchObject({
      status: 502,
      code: 'invalid_response',
    })
  })

  it('preserves authentication-method API failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: 'unavailable', message: 'Try later' }),
            { status: 503 },
          ),
        ),
    )

    await expect(getAuthenticationMethods()).rejects.toMatchObject({
      status: 503,
      code: 'unavailable',
    })
  })

  it('returns a valid current session using same-origin credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getSession()).resolves.toEqual(session)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/session',
      expect.objectContaining({ credentials: 'same-origin' }),
    )
  })

  it('distinguishes an anonymous session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    )
    await expect(getSession()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects malformed session JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ profile: { email: 4 } }), {
          status: 200,
        }),
      ),
    )
    await expect(getSession()).rejects.toMatchObject({
      status: 502,
      code: 'invalid_response',
    })
  })

  it('preserves documented API errors and field details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'validation_failed',
            message: 'Invalid email',
            fields: { email: 'invalid' },
          }),
          { status: 400 },
        ),
      ),
    )
    await expect(
      requestMagicLink({ email: 'not-an-email' }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'validation_failed',
      fields: { email: 'invalid' },
    })
  })

  it('accepts magic-link and logout empty success responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      requestMagicLink({ email: 'driver@example.com', returnTo: '/cars' }),
    ).resolves.toBeUndefined()
    await expect(logout()).resolves.toBeUndefined()
  })

  it('distinguishes logout with an already-invalid session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    )
    await expect(logout()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('normalizes transport failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(getSession()).rejects.toEqual(
      expect.objectContaining({ status: 0, code: 'network_error' }),
    )
    await expect(getSession()).rejects.toBeInstanceOf(ApiError)
    await expect(getAuthenticationMethods()).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })

  it('reads the current profile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(session.profile), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getMe()).resolves.toEqual(session.profile)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/me',
      expect.objectContaining({ credentials: 'same-origin' }),
    )
  })

  it('patches only the supplied name fields', async () => {
    const updated = { ...session.profile, firstName: 'Grace' }
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(updated), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateMe({ firstName: 'Grace' })).resolves.toEqual(updated)
    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/v1/me')
    expect(init).toMatchObject({ method: 'PATCH', credentials: 'same-origin' })
    expect(JSON.parse(init.body)).toEqual({ firstName: 'Grace' })
  })

  it('exposes profile validation field reasons', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'validation_failed',
            message: 'request validation failed',
            fields: { lastName: 'too_long' },
          }),
          { status: 400 },
        ),
      ),
    )

    await expect(updateMe({ lastName: 'x' })).rejects.toMatchObject({
      status: 400,
      code: 'validation_failed',
      fields: { lastName: 'too_long' },
    })
  })

  it('treats a profile 401 as unauthorized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    )

    await expect(getMe()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it.each([
    {},
    { ...session.profile, email: null },
    session,
  ])('rejects malformed profiles %#', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
    )

    await expect(getMe()).rejects.toMatchObject({
      status: 502,
      code: 'invalid_response',
    })
  })
})

describe('cars API client', () => {
  const car = {
    id: '9b0a5f0e-5d8f-4a55-9d59-0b8f1f3c2a10',
    type: 'Hatchback',
    make: 'VW',
    name: 'Golf',
    fuel: 'diesel',
    firstRegistration: '2019-03-01',
    licensePlate: 'W-123AB',
    fin: null,
    isActive: true,
    purchaseDate: null,
    purchasePrice: '18500.50',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-09-27T10:00:00Z',
  }

  function stub(status: number, body?: unknown) {
    const fetchMock = vi.fn(
      async (_path: string, _init?: RequestInit) =>
        new Response(body === undefined ? null : JSON.stringify(body), {
          status,
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('reads a page of cars and passes the cursor', async () => {
    const page = { items: [car], nextCursor: 'next' }
    const fetchMock = stub(200, page)

    await expect(getCars()).resolves.toEqual(page)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/cars')

    await getCars({ cursor: 'a/b', limit: 10 })
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/v1/cars?cursor=a%2Fb&limit=10',
    )
  })

  it('creates, reads, updates and deletes a car', async () => {
    let fetchMock = stub(201, car)
    await expect(
      createCar({
        type: 'Hatchback',
        make: 'VW',
        name: 'Golf',
        fuel: 'diesel',
        firstRegistration: '2019-03-01',
        licensePlate: 'W-123AB',
      }),
    ).resolves.toEqual(car)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })

    fetchMock = stub(200, car)
    await expect(getCar(car.id)).resolves.toEqual(car)
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/cars/${car.id}`)

    fetchMock = stub(200, { ...car, fin: 'ABC' })
    await expect(updateCar(car.id, { fin: 'ABC' })).resolves.toMatchObject({
      fin: 'ABC',
    })
    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe(`/api/v1/cars/${car.id}`)
    expect(init).toMatchObject({ method: 'PATCH' })
    expect(JSON.parse(String(init?.body))).toEqual({ fin: 'ABC' })

    fetchMock = stub(204)
    await expect(deleteCar(car.id)).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })

  it('exposes car validation field reasons', async () => {
    stub(400, {
      code: 'validation_failed',
      message: 'request validation failed',
      fields: { fuel: 'invalid_enum' },
    })

    await expect(updateCar(car.id, { name: 'x' })).rejects.toMatchObject({
      status: 400,
      fields: { fuel: 'invalid_enum' },
    })
  })

  it('treats a car 401 as unauthorized and keeps a 404', async () => {
    stub(401)
    await expect(getCars()).rejects.toBeInstanceOf(UnauthorizedError)

    stub(404, { code: 'not_found', message: 'resource not found' })
    await expect(getCar(car.id)).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    })
    stub(404, { code: 'not_found', message: 'resource not found' })
    await expect(deleteCar(car.id)).rejects.toMatchObject({ status: 404 })
  })

  it.each([
    { items: [{ ...car, fuel: 'petrol' }], nextCursor: null },
    { items: [{ ...car, fin: undefined }], nextCursor: null },
    { items: [car] },
    [car],
  ])('rejects malformed car pages %#', async (body) => {
    stub(200, body)

    await expect(getCars()).rejects.toMatchObject({
      status: 502,
      code: 'invalid_response',
    })
  })
})
