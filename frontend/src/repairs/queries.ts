import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getRepair, getRepairStations, getRepairs } from '#/api/client'

export const repairsQueryKey = ['repairs'] as const
export const repairsListQueryKey = [...repairsQueryKey, 'list'] as const

export function repairQueryKey(repairId: string) {
  return [...repairsQueryKey, 'detail', repairId] as const
}

export const repairsListQueryOptions = infiniteQueryOptions({
  queryKey: repairsListQueryKey,
  queryFn: ({ pageParam }) => getRepairs({ cursor: pageParam }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

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
