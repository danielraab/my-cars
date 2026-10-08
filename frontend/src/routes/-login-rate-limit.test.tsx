import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '#/i18n'
import { renderApp } from '#/test/render-app'

function response(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
}

const rateLimited = () =>
  response(429, { code: 'rate_limited', message: 'too many requests' })

function backend(routes: Record<string, () => Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const key = `${init?.method ?? 'GET'} ${path}`
      if (routes[key]) return routes[key]()
      if (key === 'GET /api/v1/auth/methods') {
        return response(200, { methods: ['magic_link', 'passkey'] })
      }
      if (key === 'GET /api/v1/session') return response(401)
      throw new Error(`unexpected request ${key}`)
    }),
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  document.documentElement.lang = 'en'
  vi.unstubAllGlobals()
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'credentials')
})

describe('rate-limited sign-in', () => {
  it('keeps the email and reports a rate-limited magic-link request', async () => {
    backend({ 'POST /api/v1/auth/magic-links': rateLimited })
    const user = userEvent.setup()
    renderApp('/auth/login')

    const input = await screen.findByRole('textbox', { name: 'Email address' })
    await user.type(input, 'driver@example.com')
    await user.click(
      screen.getByRole('button', { name: 'Email me a sign-in link' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts. Please wait a few minutes and try again.',
    )
    expect(input).toHaveValue('driver@example.com')
    expect(screen.queryByText('Check your inbox')).not.toBeInTheDocument()
  })

  it('reports a rate-limited passkey sign-in', async () => {
    vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {})
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { create: vi.fn(), get: vi.fn() },
    })
    backend({ 'POST /api/v1/auth/passkey/options': rateLimited })
    const user = userEvent.setup()
    renderApp('/auth/login')

    await user.click(
      await screen.findByRole('button', { name: 'Sign in with a passkey' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts',
    )
    expect(navigator.credentials.get).not.toHaveBeenCalled()
  })

  it('explains a throttled redirect next to the sign-in methods', async () => {
    backend({})
    renderApp('/auth/login?error=rate_limited&returnTo=%2Fcars')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts',
    )
    expect(
      screen.getByRole('button', { name: 'Email me a sign-in link' }),
    ).toBeInTheDocument()
  })

  it('ignores unknown error values', async () => {
    backend({})
    renderApp('/auth/login?error=something_else')

    expect(
      await screen.findByRole('button', { name: 'Email me a sign-in link' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('is localized in German', async () => {
    await i18n.changeLanguage('de')
    backend({})
    renderApp('/auth/login?error=rate_limited')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Zu viele Anmeldeversuche.',
    )
  })
})
