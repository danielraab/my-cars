import { useTranslation } from 'react-i18next'

import type { Refuel } from '#/api/client'
import { LineChart } from '#/components/line-chart'

// A single line of consumption in l/100 km over time. Refuels without a
// consumption (a car's first, or one without odometer readings) are left out.
export function ConsumptionChart({
  items,
  label,
}: {
  items: Refuel[]
  label: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  return (
    <LineChart
      label={label}
      formatValue={(value) =>
        t('refuels.consumptionValue', { value: number.format(value) })
      }
      empty={
        <p className="chart-empty">{t('refuels.consumptionChartEmpty')}</p>
      }
      series={[
        {
          key: 'consumption',
          className: 'chart-consumption',
          label,
          points: items.flatMap((item) =>
            item.consumption === null
              ? []
              : [
                  {
                    id: item.id,
                    time: Date.parse(item.date),
                    value: Number(item.consumption),
                  },
                ],
          ),
        },
      ]}
    />
  )
}
