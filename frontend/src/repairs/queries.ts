import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  type ExpenseFilter,
  getRepair,
  getRepairStations,
  getRepairs,
} from '#/api/client'

export const repairsQueryKey = ['repairs'] as const

export function repairQueryKey(repairId: string) {
  return [...repairsQueryKey, 'detail', repairId] as const
}

export function repairsListQueryOptions(filter: ExpenseFilter = {}) {
  return infiniteQueryOptions({
    queryKey: [...repairsQueryKey, 'list', filter],
    queryFn: ({ pageParam }) => getRepairs({ cursor: pageParam, ...filter }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function repairQueryOptions(repairId: string) {
  return queryOptions({
    queryKey: repairQueryKey(repairId),
    queryFn: () => getRepair(repairId),
  })
}

export const repairStationsQueryOptions = queryOptions({
  queryKey: [...repairsQueryKey, 'stations'],
  queryFn: getRepairStations,
})
