import type { Refuel } from '#/api/client'
const colors = {
  normal: '#2563eb',
  special: '#dc2626',
  other: '#64748b',
} as const
export function FuelPriceChart({
  items,
  label,
}: {
  items: Refuel[]
  label: string
}) {
  if (items.length === 0) return <p>{label}: —</p>
  const values = items.map((x) => Number(x.perLiter))
  const min = Math.min(...values),
    max = Math.max(...values)
  const span = max - min || 1
  const points = items
    .map(
      (x, i) =>
        `${items.length === 1 ? 50 : (i / (items.length - 1)) * 100},${90 - ((Number(x.perLiter) - min) / span) * 80}`,
    )
    .join(' ')
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 100 100"
      className="fuel-price-chart"
    >
      <polyline
        fill="none"
        stroke={colors[items[0].fuel]}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}
