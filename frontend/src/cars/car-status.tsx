import { Link } from '@tanstack/react-router'
import { ArrowLeft, LoaderCircle, RefreshCw, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '#/api/client'

// The pending or failed state of a single-car query; a 404 covers both a
// missing car and one owned by another account.
export function CarStatus({
  error,
  retry,
}: {
  error: Error | null
  retry: () => void
}) {
  const { t } = useTranslation()

  if (error === null) {
    return (
      <output className="form-status">
        <LoaderCircle className="spin" aria-hidden="true" size={25} />
        <p>{t('cars.detail.loading')}</p>
      </output>
    )
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="form-status" role="alert">
        <SearchX aria-hidden="true" size={25} />
        <h2>{t('cars.detail.notFoundTitle')}</h2>
        <p>{t('cars.detail.notFound')}</p>
        <Link className="button button-secondary" to="/cars">
          <ArrowLeft aria-hidden="true" size={17} />
          {t('cars.detail.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="form-status" role="alert">
      <RefreshCw aria-hidden="true" size={25} />
      <h2>{t('cars.detail.loadErrorTitle')}</h2>
      <p>{t('cars.detail.loadError')}</p>
      <button className="button button-primary" type="button" onClick={retry}>
        <RefreshCw aria-hidden="true" size={17} />
        {t('cars.retry')}
      </button>
    </div>
  )
}
