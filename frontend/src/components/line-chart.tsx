import { type CSSProperties, type ReactNode, useId } from 'react'
import { useTranslation } from 'react-i18next'

import { niceTicks, type TimeUnit, timeTicks } from '#/lib/chart-ticks'

import { ChartPopover } from './chart-popover'
import { useChartInteraction } from './use-chart-interaction'

export type LinePoint = { id: string; time: number; value: number }
export type LineSeries = {
  key: string
  // Sets the series colour through its --series custom property.
  className: string
  label: string
  points: LinePoint[]
}

// Date-axis labels nearer an end than this (in percent) are aligned to it
// instead of centred, so they never hang past the plot.
const edge = 12

// Time-series lines sharing one value axis over a grid of round value ticks
// and calendar boundaries. Points arrive in time order; those without a
// finite time or value are left out, and without any points the chart
// renders empty instead. The plot is one tab stop: hovering, tapping or
// scrubbing picks the nearest point on screen, and the arrow keys step
// through the points by date; the active point's exact numbers show in a
// popover and are announced.
export function LineChart({
  series,
  formatValue,
  formatTick,
  label,
  empty,
  showLegend = false,
}: {
  series: LineSeries[]
  formatValue: (value: number) => string
  // Formats a value-axis tick; step is the distance between ticks.
  formatTick: (value: number, step: number) => string
  label: string
  empty: ReactNode
  showLegend?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const hintId = useId()
  const lines = series
    .map((line) => ({
      ...line,
      points: line.points.filter(
        (point) => Number.isFinite(point.time) && Number.isFinite(point.value),
      ),
    }))
    .filter((line) => line.points.length > 0)
  // Every point in stepping order: by date, then by series.
  const ordered = lines
    .flatMap((line, order) =>
      line.points.map((point) => ({ ...point, line, order })),
    )
    .sort((a, b) => a.time - b.time || a.order - b.order)

  const times = ordered.map((point) => point.time)
  const values = ordered.map((point) => point.value)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const ticks =
    values.length > 0
      ? niceTicks(Math.min(...values), Math.max(...values))
      : niceTicks(0, 1)
  const x = (time: number) =>
    maxTime === minTime ? 50 : ((time - minTime) / (maxTime - minTime)) * 100
  const y = (value: number) =>
    100 - ((value - ticks.start) / (ticks.end - ticks.start)) * 100

  const { active, areaProps } = useChartInteraction(
    ordered.length,
    (px, py, width, height) => {
      let nearest: number | null = null
      let best = Number.POSITIVE_INFINITY
      ordered.forEach((point, i) => {
        const dx = (x(point.time) / 100) * width - px
        const dy = (y(point.value) / 100) * height - py
        const distance = dx * dx + dy * dy
        if (distance < best) {
          best = distance
          nearest = i
        }
      })
      return nearest
    },
  )

  if (ordered.length === 0) return empty

  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const time = timeTicks(minTime, maxTime)
  const formatTime = timeFormatter(time.unit, locale, (quarter, year) =>
    t('charts.quarter', { quarter, year }),
  )
  const current = active === null ? null : ordered[active]
  const announcement =
    current === null
      ? ''
      : [
          date.format(current.time),
          showLegend ? current.line.label : null,
          formatValue(current.value),
        ]
          .filter(Boolean)
          .join(' · ')

  return (
    <figure className="line-chart">
      <div className="chart-plot">
        <div className="chart-y-axis" aria-hidden="true">
          <div className="chart-y-sizer">
            {ticks.values.map((value) => (
              <span key={value}>{formatTick(value, ticks.step)}</span>
            ))}
          </div>
          {ticks.values.map((value) => (
            <span
              key={value}
              className="chart-tick"
              style={{ '--at': `${y(value)}%` } as CSSProperties}
            >
              {formatTick(value, ticks.step)}
            </span>
          ))}
        </div>
        <div
          {...areaProps}
          className="chart-area"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-describedby={hintId}
          aria-valuemin={1}
          aria-valuemax={ordered.length}
          aria-valuenow={(active ?? 0) + 1}
          aria-valuetext={announcement || undefined}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <g className="chart-grid">
              {ticks.values.map((value) => (
                <line
                  key={`y${value}`}
                  vectorEffect="non-scaling-stroke"
                  x1={0}
                  x2={100}
                  y1={y(value)}
                  y2={y(value)}
                />
              ))}
              {time.ticks.map((tick) => (
                <line
                  key={`x${tick.time}`}
                  vectorEffect="non-scaling-stroke"
                  x1={x(tick.time)}
                  x2={x(tick.time)}
                  y1={0}
                  y2={100}
                />
              ))}
            </g>
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
                    className={
                      point.id === current?.id && line === current.line
                        ? 'chart-dot chart-dot-active'
                        : 'chart-dot'
                    }
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
          {current === null ? null : (
            <ChartPopover
              x={x(current.time)}
              y={y(current.value)}
              placement={y(current.value) >= 50 ? 'above' : 'below'}
            >
              <strong>{date.format(current.time)}</strong>
              {showLegend ? (
                <dl>
                  <dt className={current.line.className}>
                    {current.line.label}
                  </dt>
                  <dd>{formatValue(current.value)}</dd>
                </dl>
              ) : (
                formatValue(current.value)
              )}
            </ChartPopover>
          )}
        </div>
        <div className="chart-x-axis" aria-hidden="true">
          {time.ticks
            .filter((tick) => tick.wide)
            .map((tick) => {
              const at = x(tick.time)
              const classes = ['chart-tick']
              if (at < edge) classes.push('chart-tick-start')
              if (at > 100 - edge) classes.push('chart-tick-end')
              if (!tick.narrow) classes.push('chart-tick-narrow-hidden')
              return (
                <span
                  key={tick.time}
                  className={classes.join(' ')}
                  style={{ '--at': `${at}%` } as CSSProperties}
                >
                  {formatTime(tick.time)}
                </span>
              )
            })}
        </div>
      </div>
      <p id={hintId} className="sr-only">
        {t('charts.keyboardHint')}
      </p>
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

// Labels a calendar boundary for its unit: day and month for weeks, the
// month (with its year in January) for months, "Q2 2026" for quarters.
function timeFormatter(
  unit: TimeUnit,
  locale: string,
  quarter: (quarter: number, year: number) => string,
): (time: number) => string {
  const week = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  })
  const month = new Intl.DateTimeFormat(locale, { month: 'short' })
  const january = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  })
  const year = new Intl.DateTimeFormat(locale, { year: 'numeric' })
  return (time) => {
    const date = new Date(time)
    switch (unit) {
      case 'week':
        return week.format(date)
      case 'month':
        return (date.getMonth() === 0 ? january : month).format(date)
      case 'quarter':
        return quarter(Math.floor(date.getMonth() / 3) + 1, date.getFullYear())
      case 'year':
        return year.format(date)
    }
  }
}
