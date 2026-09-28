import { useTranslation } from 'react-i18next'

import { type Refuel, type RefuelFuel, refuelFuels } from '#/api/client'

type Point = { id: string; fuel: RefuelFuel; time: number; price: number }

// The plot is drawn in a 100×100 box stretched to the chart's size; strokes
// keep their width because they do not scale with it.
const top = 6
const bottom = 94

// A line of the per-litre price over time for each fuel present in items,
// which arrive in date order.
export function FuelPriceChart({
  items,
  label,
}: {
  items: Refuel[]
  label: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const points: Point[] = items
    .map((item) => ({
      id: item.id,
      fuel: item.fuel,
      time: Date.parse(item.date),
      price: Number(item.perLiter),
    }))
    .filter(
      (point) => Number.isFinite(point.time) && Number.isFinite(point.price),
    )

  if (points.length === 0) {
    return <p className="chart-empty">{t('refuels.chartEmpty')}</p>
  }

  const times = points.map((point) => point.time)
  const prices = points.map((point) => point.price)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const x = (time: number) =>
    maxTime === minTime ? 50 : ((time - minTime) / (maxTime - minTime)) * 100
  const y = (price: number) =>
    maxPrice === minPrice
      ? 50
      : bottom - ((price - minPrice) / (maxPrice - minPrice)) * (bottom - top)
  const series = refuelFuels
    .map((fuel) => ({
      fuel,
      points: points.filter((point) => point.fuel === fuel),
    }))
    .filter((line) => line.points.length > 0)
  const price = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  return (
    <figure className="fuel-price-chart">
      <div className="chart-plot">
        <div className="chart-y-axis" aria-hidden="true">
          <span>{price.format(maxPrice)}</span>
          <span>{price.format(minPrice)}</span>
        </div>
        <svg
          role="img"
          aria-label={label}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {series.map((line) => (
            <g key={line.fuel} className={`chart-series chart-${line.fuel}`}>
              {line.points.length > 1 ? (
                <polyline
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  points={line.points
                    .map((point) => `${x(point.time)},${y(point.price)}`)
                    .join(' ')}
                />
              ) : null}
              {line.points.map((point) => (
                // A zero-length line with a round cap draws an undistorted dot.
                <line
                  key={point.id}
                  className="chart-dot"
                  vectorEffect="non-scaling-stroke"
                  x1={x(point.time)}
                  x2={x(point.time)}
                  y1={y(point.price)}
                  y2={y(point.price)}
                />
              ))}
            </g>
          ))}
        </svg>
        <div className="chart-x-axis" aria-hidden="true">
          <span>{date.format(minTime)}</span>
          {maxTime === minTime ? null : <span>{date.format(maxTime)}</span>}
        </div>
      </div>
      <figcaption>
        <ul className="chart-legend">
          {series.map((line) => (
            <li key={line.fuel} className={`chart-${line.fuel}`}>
              {t(`refuels.fuels.${line.fuel}`)}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
