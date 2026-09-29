import { describe, expect, it } from 'vitest'

import { validateListSearch } from './list-search'

const carId = '22222222-2222-2222-2222-222222222222'

describe('validateListSearch', () => {
  it('keeps a well-formed car and range', () => {
    expect(
      validateListSearch({ carId, from: '2026-01-01', to: '2026-01-31' }),
    ).toEqual({ carId, from: '2026-01-01', to: '2026-01-31' })
  })

  it('drops malformed values', () => {
    expect(
      validateListSearch({ carId: 'golf', from: '2026-02-30', to: 20260131 }),
    ).toEqual({ carId: undefined, from: undefined, to: undefined })
  })

  it('sets every key when the search is empty', () => {
    const search = validateListSearch({})
    expect(Object.keys(search).sort()).toEqual(['carId', 'from', 'to'])
    expect(search).toEqual({})
  })
})
