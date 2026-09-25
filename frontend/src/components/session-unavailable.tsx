import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SessionUnavailable({ retry }: { retry: () => void }) {
  const { t } = useTranslation()

  return (
    <section className="status-card" role="alert">
      <div className="status-icon">
        <RefreshCw aria-hidden="true" size={24} />
      </div>
      <p className="eyebrow">my-car</p>
      <h1>{t('sessionError.title')}</h1>
      <p>{t('sessionError.description')}</p>
      <button className="button button-primary" type="button" onClick={retry}>
        <RefreshCw aria-hidden="true" size={17} />
        {t('sessionError.retry')}
      </button>
    </section>
  )
}
