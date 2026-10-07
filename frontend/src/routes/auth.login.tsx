import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  Send,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ApiError,
  completePasskeyLogin,
  requestMagicLink,
  startPasskeyLogin,
} from '#/api/client'
import { authenticationMethodsQueryOptions } from '#/auth/methods'
import {
  getPasskeyCredential,
  PasskeyCancelledError,
  passkeysSupported,
} from '#/auth/passkeys'
import { oidcStartUrl, validReturnTo } from '#/auth/return-to'
import { sessionQueryKey } from '#/auth/session'
import { PublicHeader } from '#/components/public-header'

type LoginSearch = { returnTo?: string }

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: LoginPage,
})

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function LoginPage() {
  const { t } = useTranslation()
  const { returnTo: rawReturnTo } = Route.useSearch()
  const returnTo = validReturnTo(rawReturnTo)
  const [email, setEmail] = useState('')
  const [invalid, setInvalid] = useState(false)
  const methods = useQuery(authenticationMethodsQueryOptions)
  const magicLink = useMutation({ mutationFn: requestMagicLink })
  const queryClient = useQueryClient()
  const router = useRouter()
  const passkey = useMutation({
    mutationFn: async () => {
      const options = await startPasskeyLogin()
      await completePasskeyLogin(await getPasskeyCredential(options))
    },
    onSuccess: () => {
      // The backend set a new session cookie; resolve it afresh.
      queryClient.removeQueries({ queryKey: sessionQueryKey })
      router.history.push(returnTo)
    },
  })
  const offerPasskey =
    methods.data?.methods.includes('passkey') === true && passkeysSupported()
  const passkeyRejected =
    passkey.error instanceof ApiError && passkey.error.status === 401
  const passkeyUnavailable =
    passkey.isError &&
    !passkeyRejected &&
    !(passkey.error instanceof PasskeyCancelledError)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validEmail(email)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    magicLink.mutate({ email, returnTo })
  }

  const backendValidation =
    magicLink.error instanceof ApiError && magicLink.error.status === 400
  const unexpectedError = magicLink.isError && !backendValidation

  return (
    <div className="public-page login-page">
      <PublicHeader />
      <main className="login-main">
        <section className="login-intro">
          <p className="eyebrow">{t('login.eyebrow')}</p>
          <h1>{t('login.title')}</h1>
          <p>
            {methods.data?.methods.includes('oidc')
              ? t('login.description')
              : t('login.descriptionMagicLink')}
          </p>
          <div className="login-art" aria-hidden="true">
            <KeyRound size={44} />
            <span>{t('login.securityLabel')}</span>
          </div>
        </section>

        <section className="login-card">
          {methods.isPending ? (
            <output className="login-method-status">
              <LoaderCircle className="spin" aria-hidden="true" size={25} />
              <p>{t('login.methodsLoading')}</p>
            </output>
          ) : methods.isError ? (
            <div className="login-method-status" role="alert">
              <RefreshCw aria-hidden="true" size={25} />
              <h2>{t('login.methodsErrorTitle')}</h2>
              <p>{t('login.methodsError')}</p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => methods.refetch()}
              >
                <RefreshCw aria-hidden="true" size={17} />
                {t('login.methodsRetry')}
              </button>
            </div>
          ) : magicLink.isSuccess ? (
            <output className="accepted-message">
              <span className="status-icon">
                <Mail aria-hidden="true" size={25} />
              </span>
              <h2>{t('login.acceptedTitle')}</h2>
              <p>{t('login.accepted')}</p>
            </output>
          ) : (
            <>
              {offerPasskey ? (
                <div className="login-passkey">
                  <button
                    className="button button-oidc"
                    disabled={passkey.isPending}
                    type="button"
                    onClick={() => passkey.mutate()}
                  >
                    {passkey.isPending ? (
                      <LoaderCircle
                        className="spin"
                        aria-hidden="true"
                        size={18}
                      />
                    ) : (
                      <Fingerprint aria-hidden="true" size={18} />
                    )}
                    {passkey.isPending
                      ? t('login.passkeyPending')
                      : t('login.passkey')}
                  </button>
                  {passkeyRejected || passkeyUnavailable ? (
                    <p className="field-error" role="alert">
                      {passkeyRejected
                        ? t('login.passkeyRejected')
                        : t('login.passkeyUnavailable')}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {methods.data.methods.includes('oidc') ? (
                <a className="button button-oidc" href={oidcStartUrl(returnTo)}>
                  <KeyRound aria-hidden="true" size={18} />
                  {t('login.oidc')}
                </a>
              ) : null}
              {offerPasskey || methods.data.methods.includes('oidc') ? (
                <div className="divider">
                  <span>{t('login.divider')}</span>
                </div>
              ) : null}
              <form noValidate onSubmit={submit}>
                <label htmlFor="email">{t('login.emailLabel')}</label>
                <div className="input-wrap">
                  <Mail aria-hidden="true" size={18} />
                  <input
                    autoComplete="email"
                    id="email"
                    name="email"
                    placeholder={t('login.emailPlaceholder')}
                    type="email"
                    value={email}
                    aria-describedby={
                      invalid || backendValidation ? 'email-error' : undefined
                    }
                    aria-invalid={invalid || backendValidation}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                {invalid || backendValidation ? (
                  <p className="field-error" id="email-error" role="alert">
                    {t('login.invalidEmail')}
                  </p>
                ) : null}
                {unexpectedError ? (
                  <p className="field-error" role="alert">
                    {t('login.unavailable')}
                  </p>
                ) : null}
                <button
                  className="button button-primary button-wide"
                  disabled={magicLink.isPending}
                  type="submit"
                >
                  <Send aria-hidden="true" size={18} />
                  {magicLink.isPending
                    ? t('login.sending')
                    : t('login.magicLink')}
                </button>
              </form>
            </>
          )}
          <Link className="back-link" to="/">
            <ArrowLeft aria-hidden="true" size={16} />
            {t('login.back')}
          </Link>
        </section>
      </main>
    </div>
  )
}
