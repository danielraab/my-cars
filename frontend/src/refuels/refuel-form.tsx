import { type FormEvent, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ApiError,
  type Car,
  type Refuel,
  type RefuelFuel,
  type RefuelInput,
  refuelFuels,
} from '#/api/client'
import { fromLocalInput, toLocalInput } from '#/repairs/format'

type Values = {
  carId: string
  date: string
  station: string
  odometerReading: string
  fuel: RefuelFuel
  liters: string
  amount: string
}
type Name = keyof Values
const decimal = (v: string) => v.trim().replace(',', '.')
export function RefuelForm({
  refuel,
  cars,
  initialCarId = '',
  stations,
  pending,
  error,
  onSubmit,
  onEdit,
  secondaryAction,
}: {
  refuel?: Refuel
  cars: Car[]
  initialCarId?: string
  stations: string[]
  pending: boolean
  error: Error | null
  onSubmit: (v: RefuelInput) => void
  onEdit: () => void
  secondaryAction?: ReactNode
}) {
  const { t } = useTranslation()
  const [v, setV] = useState<Values>(() => ({
    carId: refuel?.carId ?? initialCarId,
    date: toLocalInput(refuel ? new Date(refuel.date) : new Date()),
    station: refuel?.station ?? '',
    odometerReading:
      refuel?.odometerReading == null ? '' : String(refuel.odometerReading),
    fuel: refuel?.fuel ?? 'normal',
    liters: refuel?.liters ?? '',
    amount: refuel?.amount ?? '',
  }))
  const [local, setLocal] = useState<Record<string, string>>({})
  const server =
    error instanceof ApiError && error.status === 400
      ? (error.fields ?? {})
      : {}
  const reasons = { ...server, ...local }
  const change = (n: Name, value: string) => {
    setV((x) => ({ ...x, [n]: value }))
    setLocal(({ [n]: _, ...rest }) => rest)
    onEdit()
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const odo = v.odometerReading.trim()
    if (odo !== '' && !/^-?\d+$/.test(odo)) {
      setLocal({ odometerReading: 'invalid_type' })
      return
    }
    onSubmit({
      carId: v.carId,
      date: fromLocalInput(v.date),
      station: v.station,
      odometerReading: odo === '' ? null : Number(odo),
      fuel: v.fuel,
      liters: decimal(v.liters),
      amount: decimal(v.amount),
    })
  }
  const field = (n: Name, control: ReactNode) => (
    <div className="form-field">
      <label htmlFor={`refuel-${n}`}>
        {t(`refuels.fields.${n === 'carId' ? 'car' : n}`)}
      </label>
      {control}
      {reasons[n] ? (
        <p className="field-error" role="alert">
          {t(`refuels.fieldErrors.${reasons[n]}`)}
        </p>
      ) : null}
    </div>
  )
  return (
    <form className="form-card" noValidate onSubmit={submit}>
      <div className="form-grid">
        {field(
          'carId',
          <select
            id="refuel-carId"
            disabled={!!refuel}
            required
            value={v.carId}
            onChange={(e) => change('carId', e.target.value)}
          >
            <option value="">{t('refuels.chooseCar')}</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.make} {c.name}
              </option>
            ))}
          </select>,
        )}
        {field(
          'date',
          <input
            id="refuel-date"
            type="datetime-local"
            required
            value={v.date}
            onChange={(e) => change('date', e.target.value)}
          />,
        )}
        {field(
          'station',
          <>
            <input
              id="refuel-station"
              list="refuel-stations"
              required
              value={v.station}
              onChange={(e) => change('station', e.target.value)}
            />
            <datalist id="refuel-stations">
              {stations.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </>,
        )}
        {field(
          'odometerReading',
          <input
            id="refuel-odometerReading"
            inputMode="numeric"
            value={v.odometerReading}
            onChange={(e) => change('odometerReading', e.target.value)}
          />,
        )}
        {field(
          'fuel',
          <select
            id="refuel-fuel"
            value={v.fuel}
            onChange={(e) => change('fuel', e.target.value)}
          >
            {refuelFuels.map((f) => (
              <option key={f} value={f}>
                {t(`refuels.fuels.${f}`)}
              </option>
            ))}
          </select>,
        )}
        {field(
          'liters',
          <input
            id="refuel-liters"
            inputMode="decimal"
            required
            value={v.liters}
            onChange={(e) => change('liters', e.target.value)}
          />,
        )}
        {field(
          'amount',
          <input
            id="refuel-amount"
            inputMode="decimal"
            required
            value={v.amount}
            onChange={(e) => change('amount', e.target.value)}
          />,
        )}
      </div>
      {error && Object.keys(reasons).length === 0 ? (
        <p className="field-error" role="alert">
          {t('refuels.saveError')}
        </p>
      ) : null}
      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? t('refuels.saving') : t('refuels.save')}
        </button>
        {secondaryAction}
      </div>
    </form>
  )
}
