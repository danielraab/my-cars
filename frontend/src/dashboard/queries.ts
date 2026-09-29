import { queryOptions } from '@tanstack/react-query'

import { type ExpenseFilter, getExpenseStatistics } from '#/api/client'

export const expenseStatisticsQueryOptions = (
  filter: ExpenseFilter & { from: string; to: string },
) =>
  queryOptions({
    queryKey: ['stats', 'expenses', filter],
    queryFn: () => getExpenseStatistics(filter),
  })
