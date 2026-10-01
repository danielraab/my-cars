// Round axis ticks for the charts: value ticks at 1, 2 or 5 times a power of
// ten, and time ticks at local calendar boundaries.

export type ValueTicks = {
  start: number
  end: number
  step: number
  values: number[]
}

// Values within this fraction of a step count as lying on it, so that
// 1.4 / 0.1 = 13.999… still floors to 14.
const epsilon = 1e-9

function decimalsOf(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + epsilon))
}

// The smallest round step that covers min..max with at most maxTicks ticks,
// and the outermost ticks enclosing both. Equal values are widened by one
// unit of their magnitude on each side first.
export function niceTicks(min: number, max: number, maxTicks = 6): ValueTicks {
  let low = Math.min(min, max)
  let high = Math.max(min, max)
  if (low === high) {
    const unit =
      low === 0 ? 1 : 10 ** Math.floor(Math.log10(Math.abs(low)) + epsilon)
    low -= unit
    high += unit
  }
  const magnitude = Math.floor(Math.log10(high - low) + epsilon)
  for (let power = magnitude - 1; ; power++) {
    for (const multiple of [1, 2, 5]) {
      const step = multiple * 10 ** power
      const first = Math.floor(low / step + epsilon)
      const last = Math.ceil(high / step - epsilon)
      if (last - first + 1 > maxTicks) continue
      const decimals = decimalsOf(step)
      const round = (value: number) => Number(value.toFixed(decimals))
      const values = Array.from({ length: last - first + 1 }, (_, i) =>
        round((first + i) * step),
      )
      return {
        start: values[0],
        end: values[values.length - 1],
        step: round(step),
        values,
      }
    }
  }
}

// The number of fraction digits a tick label needs for this step.
export function stepDecimals(step: number): number {
  return decimalsOf(step)
}

export type TimeUnit = 'week' | 'month' | 'quarter' | 'year'
export type TimeTick = {
  time: number
  // Whether the tick is labelled on wide and on narrow screens.
  wide: boolean
  narrow: boolean
}

const day = 24 * 60 * 60 * 1000
// Most labels that fit under a wide and under a narrow plot.
const wideLabels = 10
const narrowLabels = 5

function unitFor(span: number): TimeUnit {
  if (span <= 63 * day) return 'week'
  if (span <= 400 * day) return 'month'
  if (span <= 1461 * day) return 'quarter'
  return 'year'
}

// Every local unit boundary from `from` up to but excluding `to`.
function boundaries(unit: TimeUnit, from: number, to: number): number[] {
  const start = new Date(from)
  const times: number[] = []
  if (unit === 'week') {
    // Mondays at local midnight.
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + ((8 - start.getDay()) % 7),
    )
    while (date.getTime() < to) {
      times.push(date.getTime())
      date.setDate(date.getDate() + 7)
    }
    return times
  }
  const months = unit === 'month' ? 1 : unit === 'quarter' ? 3 : 12
  // Month index counted from year 0, so stepping never needs normalising.
  let index =
    start.getFullYear() * 12 + Math.floor(start.getMonth() / months) * months
  for (; ; index += months) {
    const time = new Date(Math.floor(index / 12), index % 12, 1).getTime()
    if (time >= to) return times
    if (time >= from) times.push(time)
  }
}

// Boundaries strictly inside the open range (minTime, maxTime), with label
// visibility thinned so wide and narrow axes stay readable. Years are
// stepped by 1, 2, 5 or 10 so that very long ranges keep few gridlines.
export function timeTicks(
  minTime: number,
  maxTime: number,
): { unit: TimeUnit; ticks: TimeTick[] } {
  const unit = unitFor(maxTime - minTime)
  let times = boundaries(unit, minTime, maxTime).filter(
    (time) => time > minTime && time < maxTime,
  )
  if (unit === 'year') {
    const every =
      [1, 2, 5, 10].find((n) => times.length / n <= wideLabels) ??
      Math.ceil(times.length / wideLabels)
    times = times.filter((time) => new Date(time).getFullYear() % every === 0)
  }
  const wideEvery = Math.max(1, Math.ceil(times.length / wideLabels))
  const narrowEvery = Math.max(1, Math.ceil(times.length / narrowLabels))
  return {
    unit,
    ticks: times.map((time, i) => ({
      time,
      wide: i % wideEvery === 0,
      narrow: i % narrowEvery === 0,
    })),
  }
}

// Formats value ticks with exactly the fraction digits their step needs, so
// a step of 0.1 reads 1.4 rather than 1.400.
export function formatValueTick(
  value: number,
  step: number,
  locale: string,
): string {
  const digits = stepDecimals(step)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}
