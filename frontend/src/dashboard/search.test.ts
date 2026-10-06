import { describe, expect, it } from 'vitest'

import { validateDashboardSearch } from './search'

const carId = '9b0a5f0e-5d8f-4a55-9d59-0b8f1f3c2a10'

describe('validateDashboardSearch', () => {
  it('accepts a four-digit year as a number or a string', () => {
    expect(validateDashboardSearch({ year: 2024, carId })).toEqual({
      year: 2024,
      carId,
    })
    expect(validateDashboardSearch({ year: '2024' }).year).toBe(2024)
  })

  it.each(['abc', '20245', '24', 2024.5, '', null])(
    'drops a malformed year %j',
    (year) => {
      expect(validateDashboardSearch({ year }).year).toBeUndefined()
    },
  )

  it('drops a malformed car', () => {
    expect(validateDashboardSearch({ carId: 'car-1' }).carId).toBeUndefined()
  })

  it('always sets every key', () => {
    const search = validateDashboardSearch({})
    expect(Object.keys(search).sort()).toEqual(['carId', 'year'])
    expect(search).toEqual({ year: undefined, carId: undefined })
  })
})
