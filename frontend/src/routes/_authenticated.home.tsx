import { createFileRoute } from '@tanstack/react-router'

import { DeferredPage } from '#/components/deferred-page'

export const Route = createFileRoute('/_authenticated/home')({
  component: () => <DeferredPage feature="dashboard" />,
})
