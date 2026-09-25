import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import {
  CarFront,
  Fuel,
  Gauge,
  House,
  LogOut,
  Menu,
  ReceiptText,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  logout as requestLogout,
  type Session,
  UnauthorizedError,
} from '#/api/client'
import { sessionQueryKey } from '#/auth/session'

import { LanguageControl } from './language-control'

const navigation = [
  { to: '/home', label: 'dashboard', icon: House },
  { to: '/cars', label: 'cars', icon: CarFront },
  { to: '/refuels', label: 'refuels', icon: Fuel },
  { to: '/repairs', label: 'repairs', icon: Wrench },
  { to: '/tickets', label: 'tickets', icon: ReceiptText },
  { to: '/profile', label: 'profile', icon: UserRound },
] as const

async function invalidateLogout() {
  try {
    await requestLogout()
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error
  }
}

function Navigation({ close }: { close?: () => void }) {
  const { t } = useTranslation()
  return (
    <nav className="app-navigation" aria-label={t('navigation.label')}>
      {navigation.map(({ to, label, icon: Icon }) => (
        <Link
          activeProps={{ 'data-active': true }}
          className="navigation-link"
          key={to}
          onClick={close}
          to={to}
        >
          <Icon aria-hidden="true" size={19} />
          {t(`navigation.${label}`)}
        </Link>
      ))}
    </nav>
  )
}

export function AppShell({ session }: { session: Session }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  const navigate = useNavigate()
  const logout = useMutation({
    mutationFn: invalidateLogout,
    onSuccess: async () => {
      queryClient.setQueryData(sessionQueryKey, null)
      await router.invalidate()
      await navigate({ to: '/' })
    },
  })

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand brand-light" to="/">
          <span className="brand-mark brand-mark-light">
            <Gauge aria-hidden="true" size={22} />
          </span>
          <span>{t('brand.name')}</span>
        </Link>
        <Navigation />
        <div className="sidebar-footer">
          <p>{t('shell.account', { email: session.profile.email })}</p>
          <LanguageControl />
          <button
            className="navigation-link logout-button"
            disabled={logout.isPending}
            type="button"
            onClick={() => logout.mutate()}
          >
            <LogOut aria-hidden="true" size={19} />
            {logout.isPending ? t('shell.loggingOut') : t('shell.logout')}
          </button>
          {logout.isError ? (
            <p className="inline-error" role="alert">
              {t('shell.logoutError')}
            </p>
          ) : null}
        </div>
      </aside>

      <header className="mobile-header">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Gauge aria-hidden="true" size={21} />
          </span>
          <span>{t('brand.name')}</span>
        </Link>
        <button
          aria-label={t('navigation.open')}
          className="icon-button"
          type="button"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </header>

      <Dialog className="mobile-dialog" open={menuOpen} onClose={setMenuOpen}>
        <DialogBackdrop className="mobile-backdrop" />
        <DialogPanel className="mobile-panel">
          <div className="mobile-panel-header">
            <span className="brand">{t('brand.name')}</span>
            <button
              aria-label={t('navigation.close')}
              className="icon-button"
              type="button"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden="true" size={22} />
            </button>
          </div>
          <Navigation close={() => setMenuOpen(false)} />
          <div className="mobile-panel-footer">
            <LanguageControl />
            <button
              className="navigation-link logout-button"
              disabled={logout.isPending}
              type="button"
              onClick={() => logout.mutate()}
            >
              <LogOut aria-hidden="true" size={19} />
              {logout.isPending ? t('shell.loggingOut') : t('shell.logout')}
            </button>
          </div>
        </DialogPanel>
      </Dialog>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
