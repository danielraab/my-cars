import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type Locale, setLocale } from '#/i18n'

export function LanguageControl() {
  const { i18n, t } = useTranslation()
  const locale: Locale = i18n.resolvedLanguage === 'de' ? 'de' : 'en'

  return (
    <label className="language-control">
      <Languages aria-hidden="true" size={16} />
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={locale}
        onChange={(event) => void setLocale(event.target.value as Locale)}
      >
        <option value="de">{t('language.de')}</option>
        <option value="en">{t('language.en')}</option>
      </select>
    </label>
  )
}
