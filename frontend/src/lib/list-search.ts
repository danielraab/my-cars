import { isCalendarDate } from '#/lib/date-range'

// The search of an expense overview: an optional car and date range.
export type ListSearch = { carId?: string; from?: string; to?: string }

export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Malformed values fall back to the defaults rather than breaking the
// screen. Every key is set, even to undefined, because the route's search
// is merged over the unvalidated search of its parents.
export function validateListSearch(
  search: Record<string, unknown>,
): ListSearch {
  return {
    carId:
      typeof search.carId === 'string' && uuid.test(search.carId)
        ? search.carId
        : undefined,
    from: isCalendarDate(search.from) ? search.from : undefined,
    to: isCalendarDate(search.to) ? search.to : undefined,
  }
}
