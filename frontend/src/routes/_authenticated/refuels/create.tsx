import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { createRefuel } from '#/api/client'
import { allCarsQueryOptions } from '#/cars/queries'
import { RefuelForm } from '#/refuels/refuel-form'
import { refuelStationsQueryOptions, refuelsQueryKey } from '#/refuels/queries'
export const Route = createFileRoute('/_authenticated/refuels/create')({
  validateSearch: (s: Record<string, unknown>): { carId?: string } =>
    typeof s.carId === 'string' ? { carId: s.carId } : {},
  component: Page,
})
function Page() {
  const { t } = useTranslation()
  const { carId } = Route.useSearch()
  const cars = useQuery(allCarsQueryOptions)
  const stations = useQuery(refuelStationsQueryOptions)
  const qc = useQueryClient()
  const nav = useNavigate()
  const mutation = useMutation({
    mutationFn: createRefuel,
    onSuccess: () => {
      qc.removeQueries({ queryKey: refuelsQueryKey })
      void nav({ to: '/refuels' })
    },
  })
  const list = cars.data?.items ?? []
  const initial =
    list.find((c) => c.id === carId)?.id ??
    (list.length === 1 ? list[0].id : '')
  return (
    <section className="form-page">
      <h1>{t('refuels.create.title')}</h1>
      {list.length ? (
        <RefuelForm
          cars={list}
          initialCarId={initial}
          stations={stations.data ?? []}
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={(x) => mutation.mutate(x)}
          onEdit={() => mutation.reset()}
          secondaryAction={
            <Link className="button" to="/refuels">
              {t('refuels.cancel')}
            </Link>
          }
        />
      ) : (
        <p>{t('refuels.noCars')}</p>
      )}
    </section>
  )
}
