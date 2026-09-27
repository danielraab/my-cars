import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getCar, getCars } from '#/api/client'

export const carsListQueryKey = ['cars', 'list'] as const

export function carQueryKey(carId: string) {
  return ['cars', 'detail', carId] as const
}

export const carsListQueryOptions = infiniteQueryOptions({
  queryKey: carsListQueryKey,
  queryFn: ({ pageParam }) => getCars({ cursor: pageParam }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

export function carQueryOptions(carId: string) {
  return queryOptions({
    queryKey: carQueryKey(carId),
    queryFn: () => getCar(carId),
  })
}
