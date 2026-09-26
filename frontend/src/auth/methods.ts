import { queryOptions } from '@tanstack/react-query'

import { getAuthenticationMethods } from '#/api/client'

export const authenticationMethodsQueryOptions = queryOptions({
  queryKey: ['authentication-methods'],
  queryFn: getAuthenticationMethods,
  staleTime: 60_000,
  retry: false,
})
