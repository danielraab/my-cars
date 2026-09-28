import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import {
  getRefuel,
  getRefuelChart,
  getRefuelStations,
  getRefuels,
} from '#/api/client'
export const refuelsQueryKey = ['refuels'] as const
export const refuelQueryKey = (id: string) =>
  [...refuelsQueryKey, 'detail', id] as const
export const refuelsListQueryOptions = (carId?: string) =>
  infiniteQueryOptions({
    queryKey: [...refuelsQueryKey, 'list', carId ?? 'all'],
    queryFn: ({ pageParam }) => getRefuels({ cursor: pageParam, carId }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  })
export const refuelQueryOptions = (id: string) =>
  queryOptions({ queryKey: refuelQueryKey(id), queryFn: () => getRefuel(id) })
export const refuelStationsQueryOptions = queryOptions({
  queryKey: [...refuelsQueryKey, 'stations'],
  queryFn: getRefuelStations,
})
export const refuelChartQueryOptions = (carId?: string) =>
  queryOptions({
    queryKey: [...refuelsQueryKey, 'chart', carId ?? 'all'],
    queryFn: () => getRefuelChart(carId),
  })
