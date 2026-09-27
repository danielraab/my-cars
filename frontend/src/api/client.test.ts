import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  getAuthenticationMethods,
  getMe,
  getSession,
  logout,
  requestMagicLink,
  UnauthorizedError,
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
