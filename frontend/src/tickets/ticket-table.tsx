import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import type { Ticket } from '#/api/client'
import { formatAmount } from '#/cars/format'
import { formatDateTime } from '#/repairs/format'

// The tickets table shared by /tickets and a car's Expenses tab. Leaving out
// carNames hides the car column; a total adds a footer row summing the
// amounts.
export function TicketTable({
  items,
  carNames,
  total,
}: {
  items: Ticket[]
  carNames?: Map<string, string>
  total?: number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const showCar = carNames !== undefined

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">{t('tickets.tableLabel')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('tickets.fields.date')}</th>
            {showCar ? <th scope="col">{t('tickets.fields.car')}</th> : null}
            <th scope="col">{t('tickets.fields.type')}</th>
            <th scope="col">{t('tickets.fields.location')}</th>
            <th scope="col" className="numeric">
              {t('tickets.fields.amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link
                  className="table-link"
                  to="/tickets/$ticketId/edit"
                  params={{ ticketId: ticket.id }}
                >
                  {formatDateTime(ticket.date, locale)}
                </Link>
              </td>
              {showCar ? (
                <td>
                  <Link to="/cars/$carId" params={{ carId: ticket.carId }}>
                    {carNames.get(ticket.carId) ?? t('tickets.unknownCar')}
                  </Link>
                </td>
              ) : null}
              <td>{t(`tickets.types.${ticket.type}`)}</td>
              <td className="wrap">{ticket.location}</td>
              <td className="numeric">{formatAmount(ticket.amount, locale)}</td>
            </tr>
          ))}
        </tbody>
        {total === undefined ? null : (
          <tfoot>
            <tr>
              <td colSpan={showCar ? 4 : 3}>{t('tickets.total')}</td>
              <td className="numeric">{formatAmount(String(total), locale)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
