import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Kind = 'refuels' | 'repairs' | 'tickets'

// One of the Expenses tab's lists: a heading with an add action, then the
// table of the query's loaded pages, with its own loading, empty, error and
// load-more states so one failing list does not hide the others.
export function ExpenseSection<Item>({
  kind,
  add,
  query,
  children,
}: {
  kind: Kind
  add: ReactNode
  query: UseInfiniteQueryResult<InfiniteData<{ items: Item[] }>>
  children: (items: Item[]) => ReactNode
}) {
  const { t } = useTranslation()
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const titleId = `car-${kind}-title`

  return (
    <section className="expense-section" aria-labelledby={titleId}>
      <header className="expense-section-header">
        <h2 id={titleId}>{t(`${kind}.title`)}</h2>
        {add}
      </header>
      {query.isPending ? (
        <output className="chart-status">
          <LoaderCircle className="spin" aria-hidden="true" size={20} />
          {t(`${kind}.loading`)}
        </output>
      ) : query.data === undefined ? (
        <div className="chart-status" role="alert">
          <p>{t(`cars.detail.expensesLoadError.${kind}`)}</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => query.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t(`${kind}.retry`)}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="chart-empty">{t(`cars.detail.expensesEmpty.${kind}`)}</p>
      ) : (
        <>
          {children(items)}
          {query.isFetchNextPageError ? (
            <p className="field-error" role="alert">
              {t(`${kind}.loadMoreError`)}
            </p>
          ) : null}
          {query.hasNextPage ? (
            <div className="list-footer">
              <button
                className="button button-secondary"
                disabled={query.isFetchingNextPage}
                type="button"
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? (
                  <LoaderCircle className="spin" aria-hidden="true" size={17} />
                ) : null}
                {query.isFetchingNextPage
                  ? t(`${kind}.loadingMore`)
                  : t(`${kind}.loadMore`)}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
