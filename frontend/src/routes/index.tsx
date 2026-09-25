import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Fuel,
  ReceiptText,
  Wrench,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { sessionQueryOptions } from '#/auth/session'
import { PublicHeader } from '#/components/public-header'
import { SessionUnavailable } from '#/components/session-unavailable'

export const Route = createFileRoute('/')({ component: LandingPage })

const cards = [
  { key: 'expenses', path: '/home', icon: ChartNoAxesCombined },
  { key: 'refuels', path: '/refuels', icon: Fuel },
  { key: 'repairs', path: '/repairs', icon: Wrench },
  { key: 'tickets', path: '/tickets', icon: ReceiptText },
] as const

function LandingPage() {
  const { t } = useTranslation()
  const session = useQuery(sessionQueryOptions)

  return (
    <div className="public-page">
      <PublicHeader authenticated={Boolean(session.data)} />
      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t('landing.eyebrow')}</p>
            <h1>{t('landing.title')}</h1>
            <p className="hero-description">{t('landing.description')}</p>
            {!session.isPending && !session.isError ? (
              session.data ? (
                <Link className="button button-primary" to="/home">
                  {t('landing.openApp')}
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              ) : (
                <Link
                  className="button button-primary"
                  to="/auth/login"
                  search={{ returnTo: '/home' }}
                >
                  {t('landing.login')}
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              )
            ) : null}
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="road-line" />
            <div className="hero-number">04</div>
            <div className="hero-label">{t('landing.visualLabel')}</div>
          </div>
        </section>

        {session.isError ? (
          <SessionUnavailable retry={() => void session.refetch()} />
        ) : (
          <section
            aria-busy={session.isPending}
            aria-label={t('brand.tagline')}
            className="feature-grid"
          >
            {cards.map(({ key, path, icon: Icon }, index) => {
              const card = (
                <>
                  <span className="feature-number">0{index + 1}</span>
                  <span className="feature-icon">
                    <Icon aria-hidden="true" size={24} />
                  </span>
                  <h2>{t(`landing.cards.${key}.title`)}</h2>
                  <p>{t(`landing.cards.${key}.description`)}</p>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="feature-arrow"
                    size={19}
                  />
                </>
              )

              if (session.isPending) {
                return (
                  <div className="feature-card feature-card-loading" key={key}>
                    {card}
                  </div>
                )
              }
              return session.data ? (
                <Link className="feature-card" key={key} to={path}>
                  {card}
                </Link>
              ) : (
                <Link
                  className="feature-card"
                  key={key}
                  to="/auth/login"
                  search={{ returnTo: path }}
                >
                  {card}
                </Link>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}
