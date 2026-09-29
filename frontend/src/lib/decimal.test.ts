import { describe, expect, it } from 'vitest'

import { sumDecimals } from './decimal'

describe('sumDecimals', () => {
  it('adds without floating-point drift', () => {
    expect(sumDecimals(['0.1', '0.2'])).toBe('0.3')
  })

  it('aligns mixed scales', () => {
    expect(sumDecimals(['1.5', '2.25', '3'])).toBe('6.75')
  })

  it('keeps three fraction digits', () => {
    expect(sumDecimals(['61.234', '0.001'])).toBe('61.235')
  })

  it('handles values below one and negative values', () => {
    expect(sumDecimals(['0.05', '0.04'])).toBe('0.09')
    expect(sumDecimals(['1.00', '-2.50'])).toBe('-1.50')
  })

  it('sums an empty list to zero', () => {
    expect(sumDecimals([])).toBe('0')
  })

  it('rejects malformed values', () => {
    expect(() => sumDecimals(['1,5'])).toThrow(RangeError)
  })
})
