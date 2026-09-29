import type { ReactNode } from 'react'

import { sumDecimals } from '#/lib/decimal'

export type BarSeries = {
  key: string
  // Sets the series colour through its --series custom property.
  className: string
  label: string
  // One decimal string per category.
  values: string[]
}

// The plot is drawn in a 100×100 box stretched to the chart's size.
const top = 4
const bottom = 100
// Share of each category's slot taken by its bar.
const barWidth = 0.6

// Categories side by side, each a bar stacking every series' value from the
// baseline up, first series at the bottom. Without any non-zero value the
// chart renders empty instead. A visually hidden table carries the exact
// numbers for screen readers.
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
  const totals = categories.map((_, i) =>
    sumDecimals(series.map((s) => s.values[i] ?? '0')),
  )
  const max = Math.max(0, ...totals.map(Number))
  if (max === 0) return empty

  const slot = 100 / categories.length
  const height = (value: string) => (Number(value) / max) * (bottom - top)

  return (
    <figure className="bar-chart">
      <div className="chart-plot">
        <div className="chart-y-axis" aria-hidden="true">
          <span>{formatValue(String(max))}</span>
          <span>{formatValue('0')}</span>
        </div>
        <svg
          role="img"
          aria-label={label}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {categories.map((category, i) => {
            let base = bottom
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
                    >
                      <title>{`${category} · ${s.label}: ${formatValue(value)}`}</title>
                    </rect>
                  )
                })}
              </g>
            )
          })}
        </svg>
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
