import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { CarFront } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { createCar } from '#/api/client'
import { CarForm } from '#/cars/car-form'
import { carQueryKey, carsListQueryKey } from '#/cars/queries'

export const Route = createFileRoute('/_authenticated/cars/create')({
  component: CreateCarPage,
})

function CreateCarPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation({
    mutationFn: createCar,
    onSuccess: (car) => {
      queryClient.setQueryData(carQueryKey(car.id), car)
      queryClient.removeQueries({ queryKey: carsListQueryKey })
      void navigate({ to: '/cars/$carId', params: { carId: car.id } })
    },
  })

  return (
    <section className="form-page" aria-labelledby="create-car-title">
      <header className="form-page-header">
        <div className="status-icon">
          <CarFront aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('cars.create.eyebrow')}</p>
          <h1 id="create-car-title">{t('cars.create.title')}</h1>
          <p>{t('cars.create.description')}</p>
        </div>
      </header>

      <CarForm
        submitLabel={t('cars.create.submit')}
        submittingLabel={t('cars.create.submitting')}
        pending={create.isPending}
        error={create.error}
        onSubmit={(input) => create.mutate(input)}
        onEdit={() => {
          if (create.isError) create.reset()
        }}
        secondaryAction={
          <Link className="button button-secondary" to="/cars">
            {t('cars.edit.cancel')}
          </Link>
        }
      />
    </section>
  )
}
