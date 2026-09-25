import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Feature =
  | 'dashboard'
  | 'cars'
  | 'refuels'
  | 'repairs'
  | 'tickets'
  | 'profile'

export function DeferredPage({ feature }: { feature: Feature }) {
  const { t } = useTranslation()
  const label = t(`navigation.${feature}`)

  return (
    <section className="deferred-page">
      <div className="status-icon">
        <Construction aria-hidden="true" size={26} />
      </div>
      <p className="eyebrow">{t('unavailable.eyebrow')}</p>
      <h1>{t('unavailable.title', { feature: label })}</h1>
      <p>{t('unavailable.description')}</p>
    </section>
  )
}
