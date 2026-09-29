import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LoaderCircle, Plus, RefreshCw, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { allCarsQueryOptions } from '#/cars/queries'
import { DateRangeControl } from '#/components/date-range-control'
import { dateRangeToInstants, defaultFrom } from '#/lib/date-range'
import { type ListSearch, validateListSearch } from '#/lib/list-search'
import { repairsListQueryOptions } from '#/repairs/queries'
import { RepairTable } from '#/repairs/repair-table'

export const Route = createFileRoute('/_authenticated/repairs/')({
  validateSearch: validateListSearch,
  component: RepairsPage,
})

function RepairsPage() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const carId = search.carId ?? ''
  // The default is not written into the URL, so a link without a range
  // always means the last six months.
  const from = search.from ?? defaultFrom()
  // Filter changes replace the history entry instead of adding one per
  // selection or keystroke.
  const update = (change: ListSearch) =>
    navigate({
      replace: true,
      search: (previous) => ({ ...previous, ...change }),
    })
  const repairs = useInfiniteQuery(
    repairsListQueryOptions({
      ...(carId ? { carId } : {}),
      ...dateRangeToInstants(from, search.to),
    }),
  )
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
          search={carId ? { carId } : {}}
        >
          <Plus aria-hidden="true" size={18} />
          {t('repairs.add')}
        </Link>
      </header>

      <div className="list-toolbar">
        <div className="form-field">
          <label htmlFor="repair-filter">{t('repairs.filter')}</label>
          <div className="input-wrap">
            <select
              id="repair-filter"
              value={carId}
              onChange={(event) =>
                update({ carId: event.target.value || undefined })
              }
            >
              <option value="">{t('repairs.allCars')}</option>
              {cars.data?.items.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DateRangeControl from={from} to={search.to} onChange={update} />
      </div>

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
          <RepairTable items={items} carNames={carNames} total={total} />

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
