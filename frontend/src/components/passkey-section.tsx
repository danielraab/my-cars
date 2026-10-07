import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Fingerprint,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ApiError,
  deletePasskey,
  getPasskeys,
  type PasskeySummary,
  registerPasskey,
  renamePasskey,
  startPasskeyRegistration,
  UnauthorizedError,
} from '#/api/client'
import {
  createPasskeyCredential,
  PasskeyCancelledError,
  passkeysSupported,
} from '#/auth/passkeys'
import { resolveSession, sessionQueryKey } from '#/auth/session'
import { TwoStepDeleteButton } from '#/components/two-step-delete-button'

const passkeysQueryKey = ['passkeys'] as const
const knownNameReasons = new Set(['empty', 'too_long'])

type Notice = 'added' | 'removed' | null

export function PasskeySection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const passkeys = useQuery({
    queryKey: passkeysQueryKey,
    queryFn: getPasskeys,
  })
  const [notice, setNotice] = useState<Notice>(null)
  const supported = passkeysSupported()

  const add = useMutation({
    mutationFn: async () => {
      const options = await startPasskeyRegistration()
      const credential = await createPasskeyCredential(options)
      const number = (passkeys.data?.length ?? 0) + 1
      return registerPasskey({
        name: t('passkeys.defaultName', { number }),
        credential,
      })
    },
    onMutate: () => setNotice(null),
    onSuccess: (created) => {
      queryClient.setQueryData<PasskeySummary[]>(passkeysQueryKey, (list) => [
        ...(list ?? []),
        created,
      ])
      setNotice('added')
    },
  })

  // Deleting the passkey that established this session ends the session too.
  async function afterRemoval(removedId: string) {
    queryClient.setQueryData<PasskeySummary[]>(passkeysQueryKey, (list) =>
      (list ?? []).filter((passkey) => passkey.id !== removedId),
    )
    const session = await resolveSession().catch(() => undefined)
    if (session === null) {
      await signedOut()
      return
    }
    setNotice('removed')
  }

  async function signedOut() {
    queryClient.setQueryData(sessionQueryKey, null)
    await navigate({ to: '/auth/login', search: { returnTo: '/profile' } })
  }

  return (
    <section
      className="form-card passkey-section"
      aria-labelledby="passkeys-title"
    >
      <h2 id="passkeys-title">{t('passkeys.title')}</h2>
      <p className="passkey-intro">{t('passkeys.description')}</p>

      {passkeys.isPending ? (
        <output className="passkey-status">
          <LoaderCircle className="spin" aria-hidden="true" size={20} />
          {t('passkeys.loading')}
        </output>
      ) : passkeys.isError ? (
        <div className="passkey-status" role="alert">
          <p>{t('passkeys.loadError')}</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => passkeys.refetch()}
          >
            <RefreshCw aria-hidden="true" size={17} />
            {t('passkeys.retry')}
          </button>
        </div>
      ) : passkeys.data.length === 0 ? (
        <p className="passkey-empty">{t('passkeys.empty')}</p>
      ) : (
        <ul className="passkey-list" aria-label={t('passkeys.listLabel')}>
          {passkeys.data.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              passkey={passkey}
              onRemoved={() => afterRemoval(passkey.id)}
              onSignedOut={signedOut}
            />
          ))}
        </ul>
      )}

      {notice ? (
        <output className="form-success">
          {t(notice === 'added' ? 'passkeys.added' : 'passkeys.removed')}
        </output>
      ) : null}

      {supported ? (
        <div className="passkey-add">
          <p className="field-hint" id="passkey-fresh-login-hint">
            {t('passkeys.freshLoginHint')}
          </p>
          <AddError error={add.error} />
          <button
            className="button button-primary"
            disabled={add.isPending}
            type="button"
            aria-describedby="passkey-fresh-login-hint"
            onClick={() => add.mutate()}
          >
            {add.isPending ? (
              <LoaderCircle className="spin" aria-hidden="true" size={18} />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            {add.isPending ? t('passkeys.adding') : t('passkeys.add')}
          </button>
        </div>
      ) : (
        <p className="field-hint">{t('passkeys.unsupported')}</p>
      )}
    </section>
  )
}

function AddError({ error }: { error: Error | null }) {
  const { t } = useTranslation()
  if (!error) return null
  if (error instanceof PasskeyCancelledError) {
    return (
      <output className="passkey-notice">{t('passkeys.addCancelled')}</output>
    )
  }
  if (error instanceof ApiError && error.code === 'reauthentication_required') {
    return (
      <p className="field-error" role="alert">
        {t('passkeys.reauthenticate')}{' '}
        <Link to="/auth/login" search={{ returnTo: '/profile' }}>
          {t('passkeys.reauthenticateLink')}
        </Link>
      </p>
    )
  }
  return (
    <p className="field-error" role="alert">
      {error instanceof ApiError && error.status === 409
        ? t('passkeys.alreadyRegistered')
        : t('passkeys.addError')}
    </p>
  )
}

function PasskeyItem({
  passkey,
  onRemoved,
  onSignedOut,
}: {
  passkey: PasskeySummary
  onRemoved: () => Promise<void>
  onSignedOut: () => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState(false)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  const remove = useMutation({
    mutationFn: () => deletePasskey(passkey.id),
    onSuccess: onRemoved,
    onError: (error) => {
      if (error instanceof UnauthorizedError) void onSignedOut()
    },
  })

  return (
    <li className="passkey-item">
      <div className="passkey-heading">
        <Fingerprint aria-hidden="true" size={20} />
        <div>
          <h3>{passkey.name}</h3>
          <p className="passkey-meta">
            {[
              passkey.authenticatorName,
              t(passkey.backedUp ? 'passkeys.synced' : 'passkeys.deviceBound'),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="passkey-meta">
            {t('passkeys.createdAt', {
              date: date.format(new Date(passkey.createdAt)),
            })}
            {' · '}
            {passkey.lastUsedAt
              ? t('passkeys.lastUsedAt', {
                  date: date.format(new Date(passkey.lastUsedAt)),
                })
              : t('passkeys.neverUsed')}
          </p>
        </div>
      </div>

      {editing ? (
        <RenameForm passkey={passkey} onDone={() => setEditing(false)} />
      ) : (
        <div className="passkey-actions">
          <button
            className="button button-secondary"
            type="button"
            aria-label={t('passkeys.renameAction', { name: passkey.name })}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden="true" size={17} />
            {t('passkeys.rename')}
          </button>
          <TwoStepDeleteButton
            label={t('passkeys.remove')}
            prompt={t('passkeys.removePrompt', { name: passkey.name })}
            confirmLabel={t('passkeys.removeConfirm')}
            cancelLabel={t('passkeys.removeCancel')}
            pendingLabel={t('passkeys.removing')}
            pending={remove.isPending}
            onConfirm={() => remove.mutate()}
          />
        </div>
      )}
      {remove.isError && !(remove.error instanceof UnauthorizedError) ? (
        <p className="field-error" role="alert">
          {t('passkeys.removeError')}
        </p>
      ) : null}
    </li>
  )
}

function RenameForm({
  passkey,
  onDone,
}: {
  passkey: PasskeySummary
  onDone: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(passkey.name)
  const [empty, setEmpty] = useState(false)
  const rename = useMutation({
    mutationFn: (value: string) => renamePasskey(passkey.id, value),
    onSuccess: (renamed) => {
      queryClient.setQueryData<PasskeySummary[]>(passkeysQueryKey, (list) =>
        (list ?? []).map((item) => (item.id === renamed.id ? renamed : item)),
      )
      onDone()
    },
  })

  const reason =
    rename.error instanceof ApiError && rename.error.status === 400
      ? rename.error.fields?.name
      : undefined
  const fieldError = empty ? 'empty' : reason
  const inputId = `passkey-name-${passkey.id}`
  const errorId = `${inputId}-error`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() === '') {
      setEmpty(true)
      return
    }
    setEmpty(false)
    rename.mutate(name.trim())
  }

  return (
    <form className="passkey-rename" noValidate onSubmit={submit}>
      <div className="form-field">
        <label htmlFor={inputId}>{t('passkeys.nameLabel')}</label>
        <div className="input-wrap">
          <input
            id={inputId}
            maxLength={100}
            type="text"
            value={name}
            aria-describedby={fieldError ? errorId : undefined}
            aria-invalid={fieldError !== undefined}
            onChange={(event) => {
              setName(event.target.value)
              setEmpty(false)
              if (!rename.isIdle) rename.reset()
            }}
          />
        </div>
        {fieldError ? (
          <p className="field-error" id={errorId} role="alert">
            {t(
              `passkeys.nameErrors.${knownNameReasons.has(fieldError) ? fieldError : 'invalid'}`,
            )}
          </p>
        ) : null}
        {rename.isError && !reason ? (
          <p className="field-error" role="alert">
            {t('passkeys.renameError')}
          </p>
        ) : null}
      </div>
      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={rename.isPending}
          type="submit"
        >
          <Save aria-hidden="true" size={17} />
          {rename.isPending ? t('passkeys.saving') : t('passkeys.save')}
        </button>
        <button
          className="button button-secondary"
          disabled={rename.isPending}
          type="button"
          onClick={onDone}
        >
          {t('passkeys.cancel')}
        </button>
      </div>
    </form>
  )
}
