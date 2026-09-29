import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LoaderCircle, Plus, ReceiptText, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatAmount } from '#/cars/format'
import { allCarsQueryOptions } from '#/cars/queries'
import { formatDateTime } from '#/repairs/format'
import { ticketsListQueryOptions } from '#/tickets/queries'

export const Route = createFileRoute('/_authenticated/tickets/')({
  component: TicketsPage,
})

function TicketsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  const tickets = useInfiniteQuery(ticketsListQueryOptions)
  const cars = useQuery(allCarsQueryOptions)
  const items = tickets.data?.pages.flatMap((page) => page.items) ?? []
  const total = items.reduce((sum, ticket) => sum + Number(ticket.amount), 0)
  const carNames = new Map(
    cars.data?.items.map((car) => [car.id, `${car.make} ${car.name}`]),
  )

  return (
    <section className="list-page" aria-labelledby="tickets-title">
      <header className="form-page-header">
        <div className="status-icon">
          <ReceiptText aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('tickets.eyebrow')}</p>
          <h1 id="tickets-title">{t('tickets.title')}</h1>
          <p>{t('tickets.description')}</p>
        </div>
        <Link
          className="button button-primary page-action"
          to="/tickets/create"
        >
          <Plus aria-hidden="true" size={18} />
          {t('tickets.add')}
        </Link>
      </header>

      {tickets.isPending ? (
        <output className="form-status">
          <LoaderCircle className="spin" aria-hidden="true" size={25} />
          <p>{t('tickets.loading')}</p>
        </output>
      ) : tickets.data === undefined ? (
        <div className="form-status" role="alert">
          <RefreshCw aria-hidden="true" size={25} />
          <h2>{t('tickets.loadErrorTitle')}</h2>
          <p>{t('tickets.loadError')}</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => tickets.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t('tickets.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="form-status">
          <p>{t('tickets.empty')}</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">{t('tickets.tableLabel')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('tickets.fields.date')}</th>
                  <th scope="col">{t('tickets.fields.car')}</th>
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
                    <td>
                      <Link to="/cars/$carId" params={{ carId: ticket.carId }}>
                        {carNames.get(ticket.carId) ?? t('tickets.unknownCar')}
                      </Link>
                    </td>
                    <td>{t(`tickets.types.${ticket.type}`)}</td>
                    <td className="wrap">{ticket.location}</td>
                    <td className="numeric">
                      {formatAmount(ticket.amount, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>{t('tickets.total')}</td>
                  <td className="numeric">
                    {formatAmount(String(total), locale)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {tickets.isFetchNextPageError ? (
            <p className="field-error" role="alert">
              {t('tickets.loadMoreError')}
            </p>
          ) : null}
          {tickets.hasNextPage ? (
            <div className="list-footer">
              <button
                className="button button-secondary"
                disabled={tickets.isFetchingNextPage}
                type="button"
                onClick={() => tickets.fetchNextPage()}
              >
                {tickets.isFetchingNextPage ? (
                  <LoaderCircle className="spin" aria-hidden="true" size={17} />
                ) : null}
                {tickets.isFetchingNextPage
                  ? t('tickets.loadingMore')
                  : t('tickets.loadMore')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
