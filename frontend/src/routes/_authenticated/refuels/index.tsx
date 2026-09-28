import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount } from '#/cars/format'
import { allCarsQueryOptions } from '#/cars/queries'
import { FuelPriceChart } from '#/refuels/fuel-price-chart'
import {
  refuelChartQueryOptions,
  refuelsListQueryOptions,
} from '#/refuels/queries'
import { formatDateTime } from '#/repairs/format'
export const Route = createFileRoute('/_authenticated/refuels/')({
  component: RefuelsPage,
})
function RefuelsPage() {
  const { t, i18n } = useTranslation()
  const [carId, setCarId] = useState('')
  const list = useInfiniteQuery(refuelsListQueryOptions(carId || undefined))
  const chart = useQuery(refuelChartQueryOptions(carId || undefined))
  const cars = useQuery(allCarsQueryOptions)
  const items = list.data?.pages.flatMap((p) => p.items) ?? []
  const names = new Map(
    cars.data?.items.map((c) => [c.id, `${c.make} ${c.name}`]),
  )
  const total = items.reduce((s, r) => s + Number(r.amount), 0)
  const derived = new Map(chart.data?.items.map((r) => [r.id, r]))
  const locale = i18n.resolvedLanguage ?? 'en'
  return (
    <section className="list-page">
      <header className="form-page-header">
        <div>
          <p className="eyebrow">{t('refuels.eyebrow')}</p>
          <h1>{t('refuels.title')}</h1>
          <p>{t('refuels.description')}</p>
        </div>
        <Link
          className="button button-primary page-action"
          to="/refuels/create"
        >
          {t('refuels.add')}
        </Link>
      </header>
      <label htmlFor="refuel-filter">{t('refuels.filter')}</label>
      <select
        id="refuel-filter"
        value={carId}
        onChange={(e) => setCarId(e.target.value)}
      >
        <option value="">{t('refuels.allCars')}</option>
        {cars.data?.items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.make} {c.name}
          </option>
        ))}
      </select>
      <section aria-label={t('refuels.chart')}>
        <h2>{t('refuels.chart')}</h2>
        {chart.isPending ? (
          <p>{t('refuels.loading')}</p>
        ) : chart.isError ? (
          <button
            type="button"
            className="button"
            onClick={() => chart.refetch()}
          >
            {t('refuels.retry')}
          </button>
        ) : (
          <FuelPriceChart
            items={chart.data?.items ?? []}
            label={t('refuels.chart')}
          />
        )}
      </section>
      {list.isPending ? (
        <p>{t('refuels.loading')}</p>
      ) : list.isError ? (
        <button type="button" className="button" onClick={() => list.refetch()}>
          {t('refuels.retry')}
        </button>
      ) : items.length === 0 ? (
        <p>{t('refuels.empty')}</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">{t('refuels.tableLabel')}</caption>
              <thead>
                <tr>
                  {[
                    'date',
                    'car',
                    'station',
                    'odometerReading',
                    'fuel',
                    'liters',
                    'perLiter',
                    'amount',
                    'consumption',
                  ].map((x) => (
                    <th key={x}>{t(`refuels.fields.${x}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        to="/refuels/$refuelId/edit"
                        params={{ refuelId: r.id }}
                      >
                        {formatDateTime(r.date, locale)}
                      </Link>
                    </td>
                    <td>{names.get(r.carId) ?? t('refuels.unknownCar')}</td>
                    <td>{r.station}</td>
                    <td>{r.odometerReading ?? '—'}</td>
                    <td>{t(`refuels.fuels.${r.fuel}`)}</td>
                    <td>{r.liters}</td>
                    <td>{r.perLiter}</td>
                    <td>{formatAmount(r.amount, locale)}</td>
                    <td>{derived.get(r.id)?.consumption ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7}>{t('refuels.total')}</td>
                  <td>{formatAmount(String(total), locale)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {list.hasNextPage ? (
            <button
              type="button"
              className="button"
              disabled={list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {t('refuels.loadMore')}
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
