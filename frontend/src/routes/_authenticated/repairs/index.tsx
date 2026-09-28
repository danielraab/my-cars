import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LoaderCircle, Plus, RefreshCw, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatAmount } from '#/cars/format'
import { allCarsQueryOptions } from '#/cars/queries'
import { formatDateTime } from '#/repairs/format'
import { repairsListQueryOptions } from '#/repairs/queries'

export const Route = createFileRoute('/_authenticated/repairs/')({
  component: RepairsPage,
})

function RepairsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const repairs = useInfiniteQuery(repairsListQueryOptions)
  const cars = useQuery(allCarsQueryOptions)
  const items = repairs.data?.pages.flatMap((page) => page.items) ?? []
  const total = items.reduce((sum, repair) => sum + Number(repair.amount), 0)
  const carNames = new Map(
    cars.data?.items.map((car) => [car.id, `${car.make} ${car.name}`]),
  )

  return (
    <section className="list-page" aria-labelledby="repairs-title">
      <header className="form-page-header">
        <div className="status-icon">
          <Wrench aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('repairs.eyebrow')}</p>
          <h1 id="repairs-title">{t('repairs.title')}</h1>
          <p>{t('repairs.description')}</p>
        </div>
        <Link
          className="button button-primary page-action"
          to="/repairs/create"
        >
          <Plus aria-hidden="true" size={18} />
          {t('repairs.add')}
        </Link>
      </header>

      {repairs.isPending ? (
        <output className="form-status">
          <LoaderCircle className="spin" aria-hidden="true" size={25} />
          <p>{t('repairs.loading')}</p>
        </output>
      ) : repairs.data === undefined ? (
        <div className="form-status" role="alert">
          <RefreshCw aria-hidden="true" size={25} />
          <h2>{t('repairs.loadErrorTitle')}</h2>
          <p>{t('repairs.loadError')}</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => repairs.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t('repairs.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="form-status">
          <p>{t('repairs.empty')}</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">{t('repairs.tableLabel')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('repairs.fields.date')}</th>
                  <th scope="col">{t('repairs.fields.car')}</th>
                  <th scope="col">{t('repairs.fields.station')}</th>
                  <th scope="col" className="numeric">
                    {t('repairs.odometerColumn')}
                  </th>
                  <th scope="col">{t('repairs.fields.type')}</th>
                  <th scope="col" className="numeric">
                    {t('repairs.fields.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((repair) => (
                  <tr key={repair.id}>
                    <td>
                      <Link
                        className="table-link"
                        to="/repairs/$repairId/edit"
                        params={{ repairId: repair.id }}
                      >
                        {formatDateTime(repair.date, locale)}
                      </Link>
                    </td>
                    <td>
                      <Link to="/cars/$carId" params={{ carId: repair.carId }}>
                        {carNames.get(repair.carId) ?? t('repairs.unknownCar')}
                      </Link>
                    </td>
                    <td className="wrap">{repair.station}</td>
                    <td className="numeric">
                      {repair.odometerReading === null
                        ? t('repairs.notRecorded')
                        : t('repairs.odometerValue', {
                            value: new Intl.NumberFormat(locale).format(
                              repair.odometerReading,
                            ),
                          })}
                    </td>
                    <td>{t(`repairs.types.${repair.type}`)}</td>
                    <td className="numeric">
                      {formatAmount(repair.amount, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>{t('repairs.total')}</td>
                  <td className="numeric">
                    {formatAmount(String(total), locale)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {repairs.isFetchNextPageError ? (
            <p className="field-error" role="alert">
              {t('repairs.loadMoreError')}
            </p>
          ) : null}
          {repairs.hasNextPage ? (
            <div className="list-footer">
              <button
                className="button button-secondary"
                disabled={repairs.isFetchingNextPage}
                type="button"
                onClick={() => repairs.fetchNextPage()}
              >
                {repairs.isFetchingNextPage ? (
                  <LoaderCircle className="spin" aria-hidden="true" size={17} />
                ) : null}
                {repairs.isFetchingNextPage
                  ? t('repairs.loadingMore')
                  : t('repairs.loadMore')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
