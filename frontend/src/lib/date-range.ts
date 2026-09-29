// Screens that filter by a date range keep it in the URL as calendar dates
// (YYYY-MM-DD) in the viewer's time zone, and turn it into the instants the
// API filters by only when a request is made.

const calendarDate = /^(\d{4})-(\d{2})-(\d{2})$/

function parts(value: string): [number, number, number] | undefined {
  const match = calendarDate.exec(value)
  if (!match) return undefined
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ]
  const date = new Date(year, month, day)
  // Rejects dates that roll over, such as 2026-02-30.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return undefined
  }
  return [year, month, day]
}

export function isCalendarDate(value: unknown): value is string {
  return typeof value === 'string' && parts(value) !== undefined
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

export function toCalendarDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// The default start of the range: the same day six months before today,
// clamped to the end of a shorter month (31 August gives 28 February).
export function defaultFrom(today: Date = new Date()): string {
  const month = today.getMonth() - 6
  const lastDay = new Date(today.getFullYear(), month + 1, 0).getDate()
  return toCalendarDate(
    new Date(today.getFullYear(), month, Math.min(today.getDate(), lastDay)),
  )
}

// Both boundary days are included in full: `from` is the start of its day
// and `to` the start of the following day, which the API treats as
// exclusive. Building each through the local Date constructor keeps days
// that change daylight-saving time correct.
export function dateRangeToInstants(
  from: string,
  to?: string,
): { from: string; to?: string } {
  const start = parts(from)
  if (!start) throw new RangeError(`Invalid calendar date: ${from}`)
  const result: { from: string; to?: string } = {
    from: new Date(...start).toISOString(),
  }
  if (to !== undefined) {
    const end = parts(to)
    if (!end) throw new RangeError(`Invalid calendar date: ${to}`)
    result.to = new Date(end[0], end[1], end[2] + 1).toISOString()
  }
  return result
}

// A whole local calendar year: from the start of 1 January to the start of
// the following 1 January, which the API treats as exclusive.
export function yearToInstants(year: number): { from: string; to: string } {
  return {
    from: new Date(year, 0, 1).toISOString(),
    to: new Date(year + 1, 0, 1).toISOString(),
  }
}
