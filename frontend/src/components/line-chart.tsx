import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type LinePoint = { id: string; time: number; value: number }
export type LineSeries = {
  key: string
  // Sets the series colour through its --series custom property.
  className: string
  label: string
  points: LinePoint[]
}

// The plot is drawn in a 100×100 box stretched to the chart's size; strokes
// keep their width because they do not scale with it.
const top = 6
const bottom = 94

// Time-series lines sharing one value axis. Points arrive in time order;
// those without a finite time or value are left out, and without any points
// the chart renders empty instead.
export function LineChart({
  series,
  formatValue,
  label,
  empty,
  showLegend = false,
}: {
  series: LineSeries[]
  formatValue: (value: number) => string
  label: string
  empty: ReactNode
  showLegend?: boolean
}) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const lines = series
    .map((line) => ({
      ...line,
      points: line.points.filter(
        (point) => Number.isFinite(point.time) && Number.isFinite(point.value),
      ),
    }))
    .filter((line) => line.points.length > 0)
  const points = lines.flatMap((line) => line.points)

  if (points.length === 0) return empty

  const times = points.map((point) => point.time)
  const values = points.map((point) => point.value)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const x = (time: number) =>
    maxTime === minTime ? 50 : ((time - minTime) / (maxTime - minTime)) * 100
  const y = (value: number) =>
    maxValue === minValue
      ? 50
      : bottom - ((value - minValue) / (maxValue - minValue)) * (bottom - top)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  return (
    <figure className="line-chart">
      <div className="chart-plot">
        <div className="chart-y-axis" aria-hidden="true">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(minValue)}</span>
        </div>
        <svg
          role="img"
          aria-label={label}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {lines.map((line) => (
            <g key={line.key} className={`chart-series ${line.className}`}>
              {line.points.length > 1 ? (
                <polyline
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  points={line.points
                    .map((point) => `${x(point.time)},${y(point.value)}`)
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
                  y1={y(point.value)}
                  y2={y(point.value)}
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
      {showLegend ? (
        <figcaption>
          <ul className="chart-legend">
            {lines.map((line) => (
              <li key={line.key} className={line.className}>
                {line.label}
              </li>
            ))}
          </ul>
        </figcaption>
      ) : null}
    </figure>
  )
}
