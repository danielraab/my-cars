import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import type { Repair } from '#/api/client'
import { formatAmount } from '#/cars/format'
import { formatDateTime } from '#/repairs/format'

// The repairs table shared by /repairs and a car's Expenses tab. Leaving out
// carNames hides the car column; a total adds a footer row summing the
// amounts.
export function RepairTable({
  items,
  carNames,
  total,
}: {
  items: Repair[]
  carNames?: Map<string, string>
  total?: number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const showCar = carNames !== undefined

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">{t('repairs.tableLabel')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('repairs.fields.date')}</th>
            {showCar ? <th scope="col">{t('repairs.fields.car')}</th> : null}
            <th scope="col">{t('repairs.fields.station')}</th>
            <th scope="col" className="numeric">
              {t('repairs.odometerColumn')}
            </th>
            <th scope="col">{t('repairs.fields.type')}</th>
            <th scope="col" className="numeric">
              {t('repairs.fields.amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((repair) => (
            <tr key={repair.id}>
              <td>
                <Link
                  className="table-link"
                  to="/repairs/$repairId/edit"
                  params={{ repairId: repair.id }}
                >
                  {formatDateTime(repair.date, locale)}
                </Link>
              </td>
              {showCar ? (
                <td>
                  <Link to="/cars/$carId" params={{ carId: repair.carId }}>
                    {carNames.get(repair.carId) ?? t('repairs.unknownCar')}
                  </Link>
                </td>
              ) : null}
              <td className="wrap">{repair.station}</td>
              <td className="numeric">
                {repair.odometerReading === null
                  ? t('repairs.notRecorded')
                  : t('repairs.odometerValue', {
                      value: new Intl.NumberFormat(locale).format(
                        repair.odometerReading,
                      ),
                    })}
              </td>
              <td>{t(`repairs.types.${repair.type}`)}</td>
              <td className="numeric">{formatAmount(repair.amount, locale)}</td>
            </tr>
          ))}
        </tbody>
        {total === undefined ? null : (
          <tfoot>
            <tr>
              <td colSpan={showCar ? 5 : 4}>{t('repairs.total')}</td>
              <td className="numeric">{formatAmount(String(total), locale)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
