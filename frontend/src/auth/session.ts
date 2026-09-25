import { queryOptions } from '@tanstack/react-query'

import { getSession, type Session, UnauthorizedError } from '#/api/client'

export const sessionQueryKey = ['session'] as const

export async function resolveSession(): Promise<Session | null> {
  try {
    return await getSession()
  } catch (error) {
    if (error instanceof UnauthorizedError) return null
    throw error
  }
}

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: resolveSession,
  staleTime: 30_000,
  retry: false,
})
