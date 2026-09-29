import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getTicket, getTicketLocations, getTickets } from '#/api/client'

export const ticketsQueryKey = ['tickets'] as const
export const ticketsListQueryKey = [...ticketsQueryKey, 'list'] as const

export function ticketQueryKey(ticketId: string) {
  return [...ticketsQueryKey, 'detail', ticketId] as const
}

export const ticketsListQueryOptions = infiniteQueryOptions({
  queryKey: ticketsListQueryKey,
  queryFn: ({ pageParam }) => getTickets({ cursor: pageParam }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

export function ticketQueryOptions(ticketId: string) {
  return queryOptions({
    queryKey: ticketQueryKey(ticketId),
    queryFn: () => getTicket(ticketId),
  })
}

// Under ticketsQueryKey, so removing the tickets queries after a save or
// delete also refreshes the suggestions.
export const ticketLocationsQueryOptions = queryOptions({
  queryKey: [...ticketsQueryKey, 'locations'],
  queryFn: getTicketLocations,
})
