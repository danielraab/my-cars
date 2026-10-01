import { describe, expect, it } from 'vitest'

import { niceTicks, stepDecimals, timeTicks } from './chart-ticks'

describe('niceTicks', () => {
  it('rounds consumption values out to half-litre steps', () => {
    expect(niceTicks(6.12, 7.93)).toEqual({
      start: 6,
      end: 8,
      step: 0.5,
      values: [6, 6.5, 7, 7.5, 8],
    })
  })

  it('starts bar totals at zero with a round step', () => {
    expect(niceTicks(0, 530)).toEqual({
      start: 0,
      end: 600,
      step: 200,
      values: [0, 200, 400, 600],
    })
  })

  it('keeps per-litre prices free of floating-point drift', () => {
    const ticks = niceTicks(1.41, 1.89)
    expect(ticks.step).toBe(0.1)
    expect(ticks.values).toEqual([1.4, 1.5, 1.6, 1.7, 1.8, 1.9])
  })

  it('treats values lying on a tick as on it', () => {
    expect(niceTicks(1.4, 1.9).values).toEqual([1.4, 1.5, 1.6, 1.7, 1.8, 1.9])
  })

  it('widens a single value to a step on each side', () => {
    const ticks = niceTicks(7, 7)
    expect(ticks.start).toBeLessThan(7)
    expect(ticks.end).toBeGreaterThan(7)
    expect(ticks.values).toContain(7)
    expect(niceTicks(0, 0).values).toEqual([-1, -0.5, 0, 0.5, 1])
  })

  it('handles negative and sub-one ranges', () => {
    expect(niceTicks(-3.2, 4.1).values).toEqual([-4, -2, 0, 2, 4, 6])
    expect(niceTicks(0.012, 0.048).values).toEqual([
      0.01, 0.02, 0.03, 0.04, 0.05,
    ])
  })

  it('never returns more than six ticks', () => {
    for (const [min, max] of [
      [0, 1],
      [0, 7],
      [3, 97],
      [0.1, 0.35],
      [12, 13],
    ]) {
      const { values } = niceTicks(min, max)
      expect(values.length).toBeLessThanOrEqual(6)
      expect(values[0]).toBeLessThanOrEqual(min)
      expect(values.at(-1)).toBeGreaterThanOrEqual(max)
    }
  })
})

describe('stepDecimals', () => {
  it('counts the fraction digits a step needs', () => {
    expect(stepDecimals(200)).toBe(0)
    expect(stepDecimals(1)).toBe(0)
    expect(stepDecimals(0.5)).toBe(1)
    expect(stepDecimals(0.1)).toBe(1)
    expect(stepDecimals(0.02)).toBe(2)
  })
})

const local = (year: number, month: number, date = 1) =>
  new Date(year, month - 1, date).getTime()

describe('timeTicks', () => {
  it('uses Mondays for a few weeks', () => {
    const { unit, ticks } = timeTicks(local(2026, 3, 4), local(2026, 3, 25))
    expect(unit).toBe('week')
    expect(ticks.map((tick) => new Date(tick.time).getDay())).toEqual([1, 1, 1])
    expect(ticks.map((tick) => new Date(tick.time).getDate())).toEqual([
      9, 16, 23,
    ])
  })

  it('uses month starts for half a year', () => {
    const { unit, ticks } = timeTicks(local(2026, 1, 10), local(2026, 7, 10))
    expect(unit).toBe('month')
    expect(ticks.map((tick) => tick.time)).toEqual([
      local(2026, 2),
      local(2026, 3),
      local(2026, 4),
      local(2026, 5),
      local(2026, 6),
      local(2026, 7),
    ])
    expect(ticks.every((tick) => tick.wide)).toBe(true)
    expect(ticks.map((tick) => tick.narrow)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ])
  })

  it('uses quarters for a few years', () => {
    const { unit, ticks } = timeTicks(local(2024, 2, 15), local(2027, 1, 15))
    expect(unit).toBe('quarter')
    expect(ticks[0].time).toBe(local(2024, 4))
    expect(ticks.at(-1)?.time).toBe(local(2027, 1))
    expect(
      ticks.every((tick) =>
        [0, 3, 6, 9].includes(new Date(tick.time).getMonth()),
      ),
    ).toBe(true)
  })

  it('steps years so a decade stays readable', () => {
    const { unit, ticks } = timeTicks(local(2010, 6), local(2026, 6))
    expect(unit).toBe('year')
    expect(ticks.map((tick) => new Date(tick.time).getFullYear())).toEqual([
      2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026,
    ])
    expect(ticks.filter((tick) => tick.wide).length).toBeLessThanOrEqual(10)
    expect(ticks.filter((tick) => tick.narrow).length).toBeLessThanOrEqual(5)
  })

  it('excludes boundaries on the range ends and has none for one date', () => {
    const { ticks } = timeTicks(local(2026, 1), local(2026, 4))
    expect(ticks.map((tick) => tick.time)).toEqual([
      local(2026, 2),
      local(2026, 3),
    ])
    expect(timeTicks(local(2026, 1, 5), local(2026, 1, 5)).ticks).toEqual([])
  })
})
