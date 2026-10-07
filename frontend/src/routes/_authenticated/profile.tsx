import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, RefreshCw, Save, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ApiError,
  getMe,
  type Profile,
  type Session,
  updateMe,
} from '#/api/client'
import { sessionQueryKey } from '#/auth/session'
import { PasskeySection } from '#/components/passkey-section'

const profileQueryKey = ['me'] as const

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

type NameField = 'firstName' | 'lastName'
const nameFields: NameField[] = ['firstName', 'lastName']
const knownReasons = new Set(['too_long', 'invalid_type'])

function ProfilePage() {
  const { t } = useTranslation()
  const profile = useQuery({ queryKey: profileQueryKey, queryFn: getMe })

  return (
    <section className="form-page" aria-labelledby="profile-title">
      <header className="form-page-header">
        <div className="status-icon">
          <UserRound aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">{t('profile.eyebrow')}</p>
          <h1 id="profile-title">{t('profile.title')}</h1>
          <p>{t('profile.description')}</p>
        </div>
      </header>

      {profile.isPending ? (
        <output className="form-status">
          <LoaderCircle className="spin" aria-hidden="true" size={25} />
          <p>{t('profile.loading')}</p>
        </output>
      ) : profile.isError ? (
        <div className="form-status" role="alert">
          <RefreshCw aria-hidden="true" size={25} />
          <h2>{t('profile.loadErrorTitle')}</h2>
          <p>{t('profile.loadError')}</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => profile.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t('profile.retry')}
          </button>
        </div>
      ) : (
        <ProfileForm profile={profile.data} />
      )}

      <PasskeySection />
    </section>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [values, setValues] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
  })
  const save = useMutation({
    mutationFn: updateMe,
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKey, saved)
      queryClient.setQueryData<Session | null>(sessionQueryKey, (session) =>
        session ? { ...session, profile: saved } : session,
      )
      setValues({ firstName: saved.firstName, lastName: saved.lastName })
    },
  })

  const fieldReasons =
    save.error instanceof ApiError && save.error.status === 400
      ? (save.error.fields ?? {})
      : {}
  const fieldErrors = nameFields.filter((field) => fieldReasons[field])
  const formError = save.isError && fieldErrors.length === 0

  function fieldMessage(field: NameField): string {
    const reason = fieldReasons[field]
    return t(
      `profile.fieldErrors.${knownReasons.has(reason) ? reason : 'invalid'}`,
    )
  }

  function change(field: NameField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    if (!save.isIdle) save.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save.mutate({ firstName: values.firstName, lastName: values.lastName })
  }

  return (
    <div className="form-card">
      <dl className="read-only-field">
        <dt>{t('profile.emailLabel')}</dt>
        <dd>{profile.email}</dd>
        <dd className="field-hint">{t('profile.emailHint')}</dd>
      </dl>

      <form noValidate onSubmit={submit}>
        {nameFields.map((field) => {
          const invalid = fieldErrors.includes(field)
          const errorId = `${field}-error`
          return (
            <div className="form-field" key={field}>
              <label htmlFor={field}>{t(`profile.${field}Label`)}</label>
              <div className="input-wrap">
                <input
                  autoComplete={
                    field === 'firstName' ? 'given-name' : 'family-name'
                  }
                  id={field}
                  maxLength={100}
                  name={field}
                  type="text"
                  value={values[field]}
                  aria-describedby={invalid ? errorId : undefined}
                  aria-invalid={invalid}
                  onChange={(event) => change(field, event.target.value)}
                />
              </div>
              {invalid ? (
                <p className="field-error" id={errorId} role="alert">
                  {fieldMessage(field)}
                </p>
              ) : null}
            </div>
          )
        })}

        {formError ? (
          <p className="field-error" role="alert">
            {t('profile.saveError')}
          </p>
        ) : null}
        {save.isSuccess ? (
          <output className="form-success">{t('profile.saved')}</output>
        ) : null}

        <button
          className="button button-primary"
          disabled={save.isPending}
          type="submit"
        >
          <Save aria-hidden="true" size={18} />
          {save.isPending ? t('profile.saving') : t('profile.save')}
        </button>
      </form>
    </div>
  )
}
