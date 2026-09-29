import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import {
  type ExpenseFilter,
  getRefuel,
  getRefuelChart,
  getRefuelStations,
  getRefuels,
} from '#/api/client'
export const refuelsQueryKey = ['refuels'] as const
export const refuelQueryKey = (id: string) =>
  [...refuelsQueryKey, 'detail', id] as const
export const refuelsListQueryOptions = (filter: ExpenseFilter = {}) =>
  infiniteQueryOptions({
    queryKey: [...refuelsQueryKey, 'list', filter],
    queryFn: ({ pageParam }) => getRefuels({ cursor: pageParam, ...filter }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  })
export const refuelQueryOptions = (id: string) =>
  queryOptions({ queryKey: refuelQueryKey(id), queryFn: () => getRefuel(id) })
export const refuelStationsQueryOptions = queryOptions({
  queryKey: [...refuelsQueryKey, 'stations'],
  queryFn: getRefuelStations,
})
export const refuelChartQueryOptions = (filter: ExpenseFilter = {}) =>
  queryOptions({
    queryKey: [...refuelsQueryKey, 'chart', filter],
    queryFn: () => getRefuelChart(filter),
  })
