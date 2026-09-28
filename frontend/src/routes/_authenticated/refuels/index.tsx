import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Fuel, LoaderCircle, Plus, RefreshCw } from 'lucide-react'
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

function formatNumber(value: string, locale: string, fractionDigits: number) {
  const number = Number(value)
  if (!Number.isFinite(number)) return value
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
  }).format(number)
}

function RefuelsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const [carId, setCarId] = useState('')
  const refuels = useInfiniteQuery(refuelsListQueryOptions(carId || undefined))
  const chart = useQuery(refuelChartQueryOptions(carId || undefined))
  const cars = useQuery(allCarsQueryOptions)
  const items = refuels.data?.pages.flatMap((page) => page.items) ?? []
  const total = items.reduce((sum, refuel) => sum + Number(refuel.amount), 0)
  const carNames = new Map(
    cars.data?.items.map((car) => [car.id, `${car.make} ${car.name}`]),
  )
  // Consumption needs each refuel's predecessor, which only the complete
  // chart series is guaranteed to hold.
  const derived = new Map(
    chart.data?.items.map((refuel) => [refuel.id, refuel]),
  )

  return (
    <section className="list-page" aria-labelledby="refuels-title">
      <header className="form-page-header">
        <div className="status-icon">
          <Fuel aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('refuels.eyebrow')}</p>
          <h1 id="refuels-title">{t('refuels.title')}</h1>
          <p>{t('refuels.description')}</p>
        </div>
        <Link
          className="button button-primary page-action"
          to="/refuels/create"
          search={carId ? { carId } : {}}
        >
          <Plus aria-hidden="true" size={18} />
          {t('refuels.add')}
        </Link>
      </header>

      <div className="list-toolbar">
        <div className="form-field">
          <label htmlFor="refuel-filter">{t('refuels.filter')}</label>
          <div className="input-wrap">
            <select
              id="refuel-filter"
              value={carId}
              onChange={(event) => setCarId(event.target.value)}
            >
              <option value="">{t('refuels.allCars')}</option>
              {cars.data?.items.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="chart-card" aria-labelledby="refuels-chart-title">
        <h2 id="refuels-chart-title">{t('refuels.chart')}</h2>
        <p className="chart-description">{t('refuels.chartDescription')}</p>
        {chart.isPending ? (
          <output className="chart-status">
            <LoaderCircle className="spin" aria-hidden="true" size={20} />
            {t('refuels.loading')}
          </output>
        ) : chart.isError ? (
          <div className="chart-status" role="alert">
            <p>{t('refuels.chartLoadError')}</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => chart.refetch()}
            >
              <RefreshCw aria-hidden="true" size={17} />
              {t('refuels.retry')}
            </button>
          </div>
        ) : (
          <FuelPriceChart items={chart.data.items} label={t('refuels.chart')} />
        )}
      </section>

      {refuels.isPending ? (
        <output className="form-status">
          <LoaderCircle className="spin" aria-hidden="true" size={25} />
          <p>{t('refuels.loading')}</p>
        </output>
      ) : refuels.data === undefined ? (
        <div className="form-status" role="alert">
          <RefreshCw aria-hidden="true" size={25} />
          <h2>{t('refuels.loadErrorTitle')}</h2>
          <p>{t('refuels.loadError')}</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => refuels.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t('refuels.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="form-status">
          <p>{t('refuels.empty')}</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">{t('refuels.tableLabel')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('refuels.fields.date')}</th>
                  <th scope="col">{t('refuels.fields.car')}</th>
                  <th scope="col">{t('refuels.fields.station')}</th>
                  <th scope="col" className="numeric">
                    {t('refuels.odometerColumn')}
                  </th>
                  <th scope="col">{t('refuels.fields.fuel')}</th>
                  <th scope="col" className="numeric">
                    {t('refuels.fields.liters')}
                  </th>
                  <th scope="col" className="numeric">
                    {t('refuels.fields.perLiter')}
                  </th>
                  <th scope="col" className="numeric">
                    {t('refuels.fields.amount')}
                  </th>
                  <th scope="col" className="numeric">
                    {t('refuels.fields.consumption')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((refuel) => {
                  const consumption = derived.get(refuel.id)?.consumption
                  return (
                    <tr key={refuel.id}>
                      <td>
                        <Link
                          className="table-link"
                          to="/refuels/$refuelId/edit"
                          params={{ refuelId: refuel.id }}
                        >
                          {formatDateTime(refuel.date, locale)}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to="/cars/$carId"
                          params={{ carId: refuel.carId }}
                        >
                          {carNames.get(refuel.carId) ??
                            t('refuels.unknownCar')}
                        </Link>
                      </td>
                      <td className="wrap">{refuel.station}</td>
                      <td className="numeric">
                        {refuel.odometerReading === null
                          ? t('refuels.notRecorded')
                          : t('refuels.odometerValue', {
                              value: new Intl.NumberFormat(locale).format(
                                refuel.odometerReading,
                              ),
                            })}
                      </td>
                      <td>{t(`refuels.fuels.${refuel.fuel}`)}</td>
                      <td className="numeric">
                        {t('refuels.litersValue', {
                          value: formatNumber(refuel.liters, locale, 2),
                        })}
                      </td>
                      <td className="numeric">
                        {formatNumber(refuel.perLiter, locale, 3)}
                      </td>
                      <td className="numeric">
                        {formatAmount(refuel.amount, locale)}
                      </td>
                      <td className="numeric">
                        {consumption == null
                          ? '—'
                          : t('refuels.consumptionValue', {
                              value: formatNumber(consumption, locale, 2),
                            })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7}>{t('refuels.total')}</td>
                  <td className="numeric">
                    {formatAmount(String(total), locale)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {refuels.isFetchNextPageError ? (
            <p className="field-error" role="alert">
              {t('refuels.loadMoreError')}
            </p>
          ) : null}
          {refuels.hasNextPage ? (
            <div className="list-footer">
              <button
                className="button button-secondary"
                disabled={refuels.isFetchingNextPage}
                type="button"
                onClick={() => refuels.fetchNextPage()}
              >
                {refuels.isFetchingNextPage ? (
                  <LoaderCircle className="spin" aria-hidden="true" size={17} />
                ) : null}
                {refuels.isFetchingNextPage
                  ? t('refuels.loadingMore')
                  : t('refuels.loadMore')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
