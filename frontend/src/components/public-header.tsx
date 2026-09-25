import { Link } from '@tanstack/react-router'
import { Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageControl } from './language-control'

export function PublicHeader({ authenticated }: { authenticated?: boolean }) {
  const { t } = useTranslation()

  return (
    <header className="public-header">
      <Link className="brand" to="/">
        <span className="brand-mark">
          <Gauge aria-hidden="true" size={22} />
        </span>
        <span>{t('brand.name')}</span>
      </Link>
      <div className="header-actions">
        <LanguageControl />
        {authenticated ? (
          <Link className="button button-secondary button-compact" to="/home">
            {t('landing.openApp')}
          </Link>
        ) : (
          <Link
            className="button button-secondary button-compact"
            to="/auth/login"
            search={{ returnTo: '/home' }}
          >
            {t('landing.login')}
          </Link>
        )}
      </div>
    </header>
  )
}
