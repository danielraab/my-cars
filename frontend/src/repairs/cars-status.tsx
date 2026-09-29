import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CarFront, LoaderCircle, Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { CarPage } from '#/api/client'

// What an expense form (repair, refuel or ticket, picked by namespace) shows instead
// of itself while the car picker's cars load, fail to load, or do not exist
// yet.
export function CarsStatus({
  cars,
  namespace = 'repairs',
}: {
  cars: UseQueryResult<CarPage>
  namespace?: 'repairs' | 'refuels' | 'tickets'
}) {
  const { t } = useTranslation()

  if (cars.isPending) {
    return (
      <output className="form-status">
        <LoaderCircle className="spin" aria-hidden="true" size={25} />
        <p>{t(`${namespace}.carsLoading`)}</p>
      </output>
    )
  }

  if (cars.isError) {
    return (
      <div className="form-status" role="alert">
        <RefreshCw aria-hidden="true" size={25} />
        <p>{t(`${namespace}.carsLoadError`)}</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => cars.refetch()}
        >
          <RefreshCw aria-hidden="true" size={17} />
          {t(`${namespace}.retry`)}
        </button>
      </div>
    )
  }

  return (
    <div className="form-status">
      <CarFront aria-hidden="true" size={25} />
      <h2>{t(`${namespace}.noCarsTitle`)}</h2>
      <p>{t(`${namespace}.noCars`)}</p>
      <Link className="button button-primary" to="/cars/create">
        <Plus aria-hidden="true" size={17} />
        {t(`${namespace}.addCar`)}
      </Link>
    </div>
  )
}
