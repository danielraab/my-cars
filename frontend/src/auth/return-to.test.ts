import { describe, expect, it } from 'vitest'

import { defaultReturnTo, oidcStartUrl, validReturnTo } from './return-to'

describe('validReturnTo', () => {
  it.each([
    'https://example.com/cars',
    '//example.com/cars',
    '/\\example.com',
    '/cars/%',
    '',
  ])('falls back for unsafe destination %s', (value) => {
    expect(validReturnTo(value)).toBe(defaultReturnTo)
  })

  it('preserves a local path, query, and fragment', () => {
    expect(validReturnTo('/cars?active=true#latest')).toBe(
      '/cars?active=true#latest',
    )
  })

  it('builds a backend OIDC URL with an encoded local destination', () => {
    expect(oidcStartUrl('/refuels?carId=one')).toBe(
      '/api/v1/auth/oidc/start?returnTo=%2Frefuels%3FcarId%3Done',
    )
  })
})
