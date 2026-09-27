import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CarFront, LoaderCircle, Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { CarPage } from '#/api/client'

// What the repair form shows instead of itself while the car picker's cars
// load, fail to load, or do not exist yet.
export function CarsStatus({ cars }: { cars: UseQueryResult<CarPage> }) {
  const { t } = useTranslation()

  if (cars.isPending) {
    return (
      <output className="form-status">
        <LoaderCircle className="spin" aria-hidden="true" size={25} />
        <p>{t('repairs.carsLoading')}</p>
      </output>
    )
  }

  if (cars.isError) {
    return (
      <div className="form-status" role="alert">
        <RefreshCw aria-hidden="true" size={25} />
        <p>{t('repairs.carsLoadError')}</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => cars.refetch()}
        >
          <RefreshCw aria-hidden="true" size={17} />
          {t('repairs.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="form-status">
      <CarFront aria-hidden="true" size={25} />
      <h2>{t('repairs.noCarsTitle')}</h2>
      <p>{t('repairs.noCars')}</p>
      <Link className="button button-primary" to="/cars/create">
        <Plus aria-hidden="true" size={17} />
        {t('repairs.addCar')}
      </Link>
    </div>
  )
}
