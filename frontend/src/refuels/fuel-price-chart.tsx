import { useTranslation } from 'react-i18next'

import { type Refuel, refuelFuels } from '#/api/client'
import { LineChart } from '#/components/line-chart'
import { formatValueTick } from '#/lib/chart-ticks'

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
  const price = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })

  return (
    <LineChart
      label={label}
      formatTick={(value, step) => formatValueTick(value, step, locale)}
      showLegend
      formatValue={(value) => price.format(value)}
      empty={<p className="chart-empty">{t('refuels.chartEmpty')}</p>}
      series={refuelFuels.map((fuel) => ({
        key: fuel,
        className: `chart-${fuel}`,
        label: t(`refuels.fuels.${fuel}`),
        points: items
          .filter((item) => item.fuel === fuel)
          .map((item) => ({
            id: item.id,
            time: Date.parse(item.date),
            value: Number(item.perLiter),
          })),
      }))}
    />
  )
}
