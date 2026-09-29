import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ExpenseRow } from '#/api/client'

import { monthlyExpenses } from './monthly-expenses'

// A zone ahead of UTC with daylight-saving time, so local month boundaries
// fall on the previous UTC day.
let previousZone: string | undefined
beforeEach(() => {
  previousZone = process.env.TZ
  process.env.TZ = 'Europe/Vienna'
})
afterEach(() => {
  process.env.TZ = previousZone
})

const row = (
  date: string,
  kind: ExpenseRow['kind'],
  amount: string,
): ExpenseRow => ({ date, kind, amount })

describe('monthlyExpenses', () => {
  it('counts an expense just after local midnight in its local month', () => {
    // 00:30 on 1 April in Vienna (summer time, UTC+2).
    const months = monthlyExpenses(
      [row('2026-03-31T22:30:00Z', 'refuel', '50.00')],
      2026,
    )
    expect(months[3].refuel).toBe('50.00')
    expect(months[2].refuel).toBe('0')
  })

  it('handles the day daylight-saving time starts', () => {
    // 23:30 on 29 March 2026 local time, the 23-hour day.
    const months = monthlyExpenses(
      [row('2026-03-29T21:30:00Z', 'repair', '10')],
      2026,
    )
    expect(months[2].repair).toBe('10')
  })

  it('sums each kind exactly', () => {
    const months = monthlyExpenses(
      [
        row('2026-05-03T10:00:00Z', 'refuel', '0.1'),
        row('2026-05-10T10:00:00Z', 'refuel', '0.2'),
        row('2026-05-11T10:00:00Z', 'ticket', '36.00'),
        row('2026-05-20T10:00:00Z', 'repair', '120.505'),
      ],
      2026,
    )
    expect(months[4]).toEqual({
      refuel: '0.3',
      repair: '120.505',
      ticket: '36.00',
    })
  })

  it('returns twelve months, zero where nothing was spent', () => {
    const months = monthlyExpenses([], 2026)
    expect(months).toHaveLength(12)
    expect(months.every((m) => m.refuel === '0' && m.ticket === '0')).toBe(true)
  })

  it('ignores rows outside the local year', () => {
    // Vienna is UTC+1 in winter: 23:30 UTC on 31 December is already the
    // next year locally, and 22:30 UTC is still the old one.
    const months = monthlyExpenses(
      [
        row('2025-12-31T22:30:00Z', 'ticket', '3'),
        row('2025-12-31T23:30:00Z', 'ticket', '5'),
        row('2026-12-31T22:30:00Z', 'ticket', '7'),
        row('2026-12-31T23:30:00Z', 'ticket', '9'),
      ],
      2026,
    )
    expect(months[0].ticket).toBe('5')
    expect(months[11].ticket).toBe('7')
  })
})
