import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { deleteRefuel, type RefuelInput, updateRefuel } from '#/api/client'
import { allCarsQueryOptions } from '#/cars/queries'
import { TwoStepDeleteButton } from '#/components/two-step-delete-button'
import { RefuelForm } from '#/refuels/refuel-form'
import {
  refuelQueryOptions,
  refuelStationsQueryOptions,
  refuelsQueryKey,
} from '#/refuels/queries'
export const Route = createFileRoute('/_authenticated/refuels/$refuelId/edit')({
  component: Page,
})
function Page() {
  const { t } = useTranslation()
  const { id } = { id: Route.useParams().refuelId }
  const item = useQuery(refuelQueryOptions(id))
  const cars = useQuery(allCarsQueryOptions)
  const stations = useQuery(refuelStationsQueryOptions)
  const qc = useQueryClient()
  const nav = useNavigate()
  const done = () => {
    qc.removeQueries({ queryKey: refuelsQueryKey })
    void nav({ to: '/refuels' })
  }
  const save = useMutation({
    mutationFn: ({ carId: _, ...x }: RefuelInput) => updateRefuel(id, x),
    onSuccess: done,
  })
  const remove = useMutation({
    mutationFn: () => deleteRefuel(id),
    onSuccess: done,
  })
  if (item.isPending || cars.isPending) return <p>{t('refuels.loading')}</p>
  if (item.isError || !item.data || !cars.data)
    return <p role="alert">{t('refuels.notFound')}</p>
  return (
    <section className="form-page">
      <h1>{t('refuels.edit.title')}</h1>
      <RefuelForm
        refuel={item.data}
        cars={cars.data.items}
        stations={stations.data ?? []}
        pending={save.isPending}
        error={save.error}
        onSubmit={(x) => save.mutate(x)}
        onEdit={() => save.reset()}
        secondaryAction={
          <Link className="button" to="/refuels">
            {t('refuels.cancel')}
          </Link>
        }
      />
      <div className="form-card danger-zone">
        <TwoStepDeleteButton
          label={t('refuels.delete.action')}
          prompt={t('refuels.delete.prompt')}
          confirmLabel={t('refuels.delete.confirm')}
          cancelLabel={t('refuels.cancel')}
          pendingLabel={t('refuels.delete.deleting')}
          pending={remove.isPending}
          onConfirm={() => remove.mutate()}
        />
      </div>
    </section>
  )
}
