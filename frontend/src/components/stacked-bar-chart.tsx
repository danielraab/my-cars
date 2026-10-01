import { type CSSProperties, type ReactNode, useId } from 'react'
import { useTranslation } from 'react-i18next'

import { niceTicks } from '#/lib/chart-ticks'
import { sumDecimals } from '#/lib/decimal'

import { ChartPopover } from './chart-popover'
import { useChartInteraction } from './use-chart-interaction'

export type BarSeries = {
  key: string
  // Sets the series colour through its --series custom property.
  className: string
  label: string
  // One decimal string per category.
  values: string[]
}

// The plot is drawn in a 100×100 box stretched to the chart's size.
// Share of each category's slot taken by its bar.
const barWidth = 0.6

// Categories side by side, each a bar stacking every series' value from the
// baseline up, first series at the bottom, over horizontal gridlines at round
// value ticks. Without any non-zero value the chart renders empty instead.
// The plot is one tab stop: hovering, tapping or scrubbing anywhere in a
// category's column, or stepping with the arrow keys, shows that category's
// exact numbers in a popover at the top of the plot. A visually hidden table
// also carries them for screen readers.
export function StackedBarChart({
  categories,
  narrowCategories = categories,
  series,
  formatValue,
  label,
  categoryLabel,
  totalLabel,
  empty,
}: {
  categories: string[]
  // Shorter axis labels for narrow screens, such as single-letter months.
  narrowCategories?: string[]
  series: BarSeries[]
  formatValue: (value: string) => string
  label: string
  categoryLabel: string
  totalLabel: string
  empty: ReactNode
}) {
  const { t } = useTranslation()
  const hintId = useId()
  const totals = categories.map((_, i) =>
    sumDecimals(series.map((s) => s.values[i] ?? '0')),
  )
  const max = Math.max(0, ...totals.map(Number))
  const slot = 100 / categories.length
  const { active, areaProps } = useChartInteraction(
    max === 0 ? 0 : categories.length,
    (px, _py, width) =>
      Math.min(
        categories.length - 1,
        Math.max(0, Math.floor((px / width) * categories.length)),
      ),
  )
  if (max === 0) return empty

  const ticks = niceTicks(0, max)
  const height = (value: string) => (Number(value) / ticks.end) * 100
  const y = (value: number) => 100 - (value / ticks.end) * 100
  const describe = (i: number) =>
    `${categories[i]}: ${[
      ...series.map((s) => `${s.label} ${formatValue(s.values[i] ?? '0')}`),
      `${totalLabel} ${formatValue(totals[i])}`,
    ].join(', ')}`

  return (
    <figure className="bar-chart">
      <div className="chart-plot">
        <div className="chart-y-axis" aria-hidden="true">
          <div className="chart-y-sizer">
            {ticks.values.map((value) => (
              <span key={value}>{formatValue(String(value))}</span>
            ))}
          </div>
          {ticks.values.map((value) => (
            <span
              key={value}
              className="chart-tick"
              style={{ '--at': `${y(value)}%` } as CSSProperties}
            >
              {formatValue(String(value))}
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
          aria-valuemax={categories.length}
          aria-valuenow={(active ?? 0) + 1}
          aria-valuetext={active === null ? undefined : describe(active)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <g className="chart-grid">
              {ticks.values.map((value) => (
                <line
                  key={value}
                  vectorEffect="non-scaling-stroke"
                  x1={0}
                  x2={100}
                  y1={y(value)}
                  y2={y(value)}
                />
              ))}
            </g>
            {active === null ? null : (
              <rect
                className="chart-column-active"
                x={slot * active}
                y={0}
                width={slot}
                height={100}
              />
            )}
            {categories.map((category, i) => {
              let base = 100
              return (
                <g key={category}>
                  {series.map((s) => {
                    const value = s.values[i] ?? '0'
                    const h = height(value)
                    if (h <= 0) return null
                    base -= h
                    return (
                      <rect
                        key={s.key}
                        className={`chart-bar ${s.className}`}
                        x={slot * i + (slot * (1 - barWidth)) / 2}
                        y={base}
                        width={slot * barWidth}
                        height={h}
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>
          {active === null ? null : (
            <ChartPopover x={slot * (active + 0.5)} y={0} placement="top">
              <strong>{categories[active]}</strong>
              <dl>
                {series.map((s) => (
                  <div key={s.key} className="chart-popover-row">
                    <dt className={s.className}>{s.label}</dt>
                    <dd>{formatValue(s.values[active] ?? '0')}</dd>
                  </div>
                ))}
                <div className="chart-popover-row chart-popover-total">
                  <dt>{totalLabel}</dt>
                  <dd>{formatValue(totals[active])}</dd>
                </div>
              </dl>
            </ChartPopover>
          )}
        </div>
        <div
          className="chart-x-axis bar-chart-x-axis"
          aria-hidden="true"
          style={{
            gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
          }}
        >
          {categories.map((category, i) => (
            <span key={category}>
              <span className="axis-label-wide">{category}</span>
              <span className="axis-label-narrow">{narrowCategories[i]}</span>
            </span>
          ))}
        </div>
      </div>
      <p id={hintId} className="sr-only">
        {t('charts.keyboardHint')}
      </p>
      <figcaption>
        <ul className="chart-legend">
          {series.map((s) => (
            <li key={s.key} className={s.className}>
              {s.label}
            </li>
          ))}
        </ul>
      </figcaption>
      {/* A table ignores the 1px width of .sr-only and grows to fit its
          content, so it is clipped through a wrapper instead. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{categoryLabel}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
              <th scope="col">{totalLabel}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, i) => (
              <tr key={category}>
                <th scope="row">{category}</th>
                {series.map((s) => (
                  <td key={s.key}>{formatValue(s.values[i] ?? '0')}</td>
                ))}
                <td>{formatValue(totals[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
