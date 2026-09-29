import type { ExpenseKind, ExpenseRow } from '#/api/client'
import { sumDecimals } from '#/lib/decimal'

export type MonthTotals = Record<ExpenseKind, string>

// Groups a year's expense rows into its twelve local months, January first.
// The month is taken in the viewer's time zone, which is why the API returns
// rows rather than totals. Rows outside the local year are ignored.
export function monthlyExpenses(
  items: readonly ExpenseRow[],
  year: number,
): MonthTotals[] {
  const amounts = Array.from({ length: 12 }, () => ({
    refuel: [] as string[],
    repair: [] as string[],
    ticket: [] as string[],
  }))
  for (const item of items) {
    const date = new Date(item.date)
    if (date.getFullYear() !== year) continue
    amounts[date.getMonth()][item.kind].push(item.amount)
  }
  return amounts.map((month) => ({
    refuel: sumDecimals(month.refuel),
    repair: sumDecimals(month.repair),
    ticket: sumDecimals(month.ticket),
  }))
}
