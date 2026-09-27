import { LoaderCircle, Save } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ApiError,
  type Car,
  type CarFuel,
  type CarInput,
  carFuels,
} from '#/api/client'

type Values = {
  type: string
  make: string
  name: string
  fuel: CarFuel
  firstRegistration: string
  licensePlate: string
  fin: string
  purchaseDate: string
  purchasePrice: string
}

type FieldName = keyof Values

const fields: {
  name: FieldName
  kind: 'text' | 'date' | 'select' | 'decimal'
  optional?: boolean
  hint?: boolean
}[] = [
  { name: 'type', kind: 'text', hint: true },
  { name: 'make', kind: 'text' },
  { name: 'name', kind: 'text' },
  { name: 'fuel', kind: 'select' },
  { name: 'firstRegistration', kind: 'date' },
  { name: 'licensePlate', kind: 'text' },
  { name: 'fin', kind: 'text', optional: true },
  { name: 'purchaseDate', kind: 'date', optional: true },
  { name: 'purchasePrice', kind: 'decimal', optional: true, hint: true },
]

const knownReasons = new Set([
  'required',
  'empty',
  'invalid_enum',
  'invalid_date',
  'invalid_decimal',
  'negative',
  'invalid_type',
])

function initialValues(car?: Car): Values {
  return {
    type: car?.type ?? '',
    make: car?.make ?? '',
    name: car?.name ?? '',
    fuel: car?.fuel ?? carFuels[0],
    firstRegistration: car?.firstRegistration ?? '',
    licensePlate: car?.licensePlate ?? '',
    fin: car?.fin ?? '',
    purchaseDate: car?.purchaseDate ?? '',
    purchasePrice: car?.purchasePrice ?? '',
  }
}

function optional(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// Accept a decimal comma ("18500,50"), as German users write amounts.
function decimal(value: string): string {
  return /^-?\d+,\d+$/.test(value) ? value.replace(',', '.') : value
}

function toInput(values: Values): CarInput {
  const purchasePrice = optional(values.purchasePrice)
  return {
    type: values.type,
    make: values.make,
    name: values.name,
    fuel: values.fuel,
    firstRegistration: values.firstRegistration,
    licensePlate: values.licensePlate,
    fin: optional(values.fin),
    purchaseDate: optional(values.purchaseDate),
    purchasePrice: purchasePrice === null ? null : decimal(purchasePrice),
  }
}

type CarFormProps = {
  car?: Car
  submitLabel: string
  submittingLabel: string
  pending: boolean
  error: Error | null
  onSubmit: (input: CarInput) => void
  onEdit: () => void
  secondaryAction?: ReactNode
}

export function CarForm({
  car,
  submitLabel,
  submittingLabel,
  pending,
  error,
  onSubmit,
  onEdit,
  secondaryAction,
}: CarFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState(() => initialValues(car))

  const reasons =
    error instanceof ApiError && error.status === 400
      ? (error.fields ?? {})
      : {}
  const invalidFields = fields
    .map((field) => field.name)
    .filter((name) => reasons[name])
  const formError = error !== null && invalidFields.length === 0

  function change<Name extends FieldName>(name: Name, value: Values[Name]) {
    setValues((current) => ({ ...current, [name]: value }))
    onEdit()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(toInput(values))
  }

  return (
    <form className="form-card" noValidate onSubmit={submit}>
      <div className="form-grid">
        {fields.map(({ name, kind, optional: isOptional, hint }) => {
          const id = `car-${name}`
          const invalid = invalidFields.includes(name)
          const hintId = hint ? `${id}-hint` : undefined
          const errorId = invalid ? `${id}-error` : undefined
          const describedBy = [hintId, errorId].filter(Boolean).join(' ')
          const reason = reasons[name]
          const common = {
            id,
            name,
            'aria-invalid': invalid,
            'aria-describedby': describedBy || undefined,
          }
          return (
            <div className="form-field" key={name}>
              <label htmlFor={id}>
                {t(`cars.fields.${name}`)}
                {isOptional ? (
                  <span className="field-optional">
                    {' '}
                    ({t('cars.optional')})
                  </span>
                ) : null}
              </label>
              <div className="input-wrap">
                {kind === 'select' ? (
                  <select
                    {...common}
                    value={values.fuel}
                    onChange={(event) => {
                      const fuel = carFuels.find(
                        (option) => option === event.target.value,
                      )
                      if (fuel) change('fuel', fuel)
                    }}
                  >
                    {carFuels.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {t(`cars.fuels.${fuel}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    autoComplete="off"
                    inputMode={kind === 'decimal' ? 'decimal' : undefined}
                    required={!isOptional}
                    type={kind === 'date' ? 'date' : 'text'}
                    value={values[name]}
                    onChange={(event) => change(name, event.target.value)}
                  />
                )}
              </div>
              {hintId ? (
                <p className="field-hint" id={hintId}>
                  {t(`cars.hints.${name}`)}
                </p>
              ) : null}
              {errorId ? (
                <p className="field-error" id={errorId} role="alert">
                  {t(
                    `cars.fieldErrors.${knownReasons.has(reason) ? reason : 'invalid'}`,
                  )}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      {formError ? (
        <p className="field-error" role="alert">
          {t('cars.saveError')}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="spin" aria-hidden="true" size={18} />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          {pending ? submittingLabel : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  )
}
