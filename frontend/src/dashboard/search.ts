import { uuid } from '#/lib/list-search'

// The dashboard's search: the shown year and an optional car.
export type DashboardSearch = { year?: number; carId?: string }

// Malformed values fall back to the defaults (the current year, all cars).
// Every key is set, even to undefined, because the route's search is merged
// over the unvalidated search of its parents.
export function validateDashboardSearch(
  search: Record<string, unknown>,
): DashboardSearch {
  const year =
    typeof search.year === 'number' || typeof search.year === 'string'
      ? String(search.year)
      : ''
  return {
    year: /^\d{4}$/.test(year) ? Number(year) : undefined,
    carId:
      typeof search.carId === 'string' && uuid.test(search.carId)
        ? search.carId
        : undefined,
  }
}
