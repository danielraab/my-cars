import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CarFront, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Car } from '#/api/client'
import { CarStatus } from '#/cars/car-status'
import { formatAmount, formatDate } from '#/cars/format'
import { carQueryOptions } from '#/cars/queries'

export const Route = createFileRoute('/_authenticated/cars/$carId/')({
  component: CarDetailPage,
})

function CarDetailPage() {
  const { carId } = Route.useParams()
  const car = useQuery(carQueryOptions(carId))

  return car.data ? (
    <CarDetails car={car.data} />
  ) : (
    <section className="form-page">
      <CarStatus error={car.error} retry={() => car.refetch()} />
    </section>
  )
}

function CarDetails({ car }: { car: Car }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const notRecorded = t('cars.notRecorded')
  const details: [string, string][] = [
    ['type', car.type],
    ['make', car.make],
    ['name', car.name],
    ['fuel', t(`cars.fuels.${car.fuel}`)],
    ['firstRegistration', formatDate(car.firstRegistration, locale)],
    ['licensePlate', car.licensePlate],
    ['fin', car.fin ?? notRecorded],
    [
      'purchaseDate',
      car.purchaseDate === null
        ? notRecorded
        : formatDate(car.purchaseDate, locale),
    ],
    [
      'purchasePrice',
      car.purchasePrice === null
        ? notRecorded
        : formatAmount(car.purchasePrice, locale),
    ],
  ]

  return (
    <section className="form-page" aria-labelledby="car-title">
      <header className="form-page-header">
        <div className="status-icon">
          <CarFront aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('cars.detail.eyebrow')}</p>
          <h1 id="car-title">{car.name}</h1>
          <p>
            {car.make} · {car.licensePlate}
          </p>
        </div>
      </header>

      <div className="form-card">
        <dl className="detail-list">
          {details.map(([field, value]) => (
            <div key={field}>
              <dt>{t(`cars.fields.${field}`)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="form-actions">
          <Link
            className="button button-primary"
            to="/cars/$carId/edit"
            params={{ carId: car.id }}
          >
            <Pencil aria-hidden="true" size={17} />
            {t('cars.detail.edit')}
          </Link>
          <Link className="button button-secondary" to="/cars">
            <ArrowLeft aria-hidden="true" size={17} />
            {t('cars.detail.back')}
          </Link>
        </div>
      </div>
    </section>
  )
}
