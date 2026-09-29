import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { dateRangeToInstants, defaultFrom, isCalendarDate } from './date-range'

// A zone with daylight-saving time, so local midnight differs from UTC and
// one day in March is only 23 hours long.
let previousZone: string | undefined
beforeEach(() => {
  previousZone = process.env.TZ
  process.env.TZ = 'Europe/Vienna'
})
afterEach(() => {
  process.env.TZ = previousZone
})

describe('isCalendarDate', () => {
  it('accepts real dates only', () => {
    expect(isCalendarDate('2026-02-28')).toBe(true)
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2026-2-3')).toBe(false)
    expect(isCalendarDate('2026-01-01T00:00:00Z')).toBe(false)
    expect(isCalendarDate(20260101)).toBe(false)
  })
})

describe('dateRangeToInstants', () => {
  it('starts at local midnight and leaves an open end open', () => {
    expect(dateRangeToInstants('2026-01-15')).toEqual({
      from: '2026-01-14T23:00:00.000Z',
    })
  })

  it('ends at the start of the day after "to"', () => {
    expect(dateRangeToInstants('2026-01-01', '2026-01-31')).toEqual({
      from: '2025-12-31T23:00:00.000Z',
      to: '2026-01-31T23:00:00.000Z',
    })
  })

  it('covers a daylight-saving transition day in full', () => {
    // Clocks go forward on 29 March 2026 in Vienna.
    expect(dateRangeToInstants('2026-03-29', '2026-03-29')).toEqual({
      from: '2026-03-28T23:00:00.000Z',
      to: '2026-03-29T22:00:00.000Z',
    })
  })

  it('rejects malformed dates', () => {
    expect(() => dateRangeToInstants('2026-02-30')).toThrow(RangeError)
    expect(() => dateRangeToInstants('2026-01-01', 'soon')).toThrow(RangeError)
  })
})

describe('defaultFrom', () => {
  it('is six months before today', () => {
    expect(defaultFrom(new Date(2026, 8, 29))).toBe('2026-03-29')
    expect(defaultFrom(new Date(2026, 2, 15))).toBe('2025-09-15')
  })

  it('clamps to the end of a shorter month', () => {
    expect(defaultFrom(new Date(2026, 7, 31))).toBe('2026-02-28')
  })
})
