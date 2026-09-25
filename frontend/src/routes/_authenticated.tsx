import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { validReturnTo } from '#/auth/return-to'
import { sessionQueryKey, sessionQueryOptions } from '#/auth/session'
import { AppShell } from '#/components/app-shell'
import { SessionUnavailable } from '#/components/session-unavailable'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session =
      await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!session) {
      throw redirect({
        to: '/auth/login',
        search: { returnTo: validReturnTo(location.href) },
      })
    }
    return { session }
  },
  component: AuthenticatedLayout,
  errorComponent: SessionError,
})

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext()
  return <AppShell session={session} />
}

function SessionError({ reset }: { reset: () => void }) {
  const router = useRouter()
  function retry() {
    router.options.context.queryClient.removeQueries({
      queryKey: sessionQueryKey,
    })
    reset()
    void router.invalidate()
  }
  return (
    <main className="centered-page">
      <SessionUnavailable retry={retry} />
    </main>
  )
}
