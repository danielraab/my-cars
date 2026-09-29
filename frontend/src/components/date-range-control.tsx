import { useTranslation } from 'react-i18next'

import { isCalendarDate } from '#/lib/date-range'

export type DateRange = { from?: string; to?: string }

// Reports only complete calendar dates; a cleared or partial input is
// reported as undefined, so the screen can fall back to its default.
export function DateRangeControl({
  from,
  to,
  onChange,
}: {
  from: string
  to?: string
  onChange: (range: DateRange) => void
}) {
  const { t } = useTranslation()
  const update = (key: keyof DateRange, value: string) =>
    onChange({ [key]: isCalendarDate(value) ? value : undefined })

  return (
    <fieldset className="date-range">
      <legend className="sr-only">{t('dateRange.label')}</legend>
      <label>
        <span>{t('dateRange.from')}</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(event) => update('from', event.target.value)}
        />
      </label>
      <label>
        <span>{t('dateRange.to')}</span>
        <input
          type="date"
          value={to ?? ''}
          min={from}
          onChange={(event) => update('to', event.target.value)}
        />
      </label>
    </fieldset>
  )
}
