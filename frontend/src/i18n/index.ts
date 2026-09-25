import i18next, { type i18n as I18nInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from './resources'

export const localeStorageKey = 'my-car.locale'
export type Locale = 'de' | 'en'

function supportedLocale(value: string | null | undefined): Locale | undefined {
  return value === 'de' || value === 'en' ? value : undefined
}

export function detectLocale(
  saved: string | null | undefined,
  browserLanguages: readonly string[],
): Locale {
  const persisted = supportedLocale(saved)
  if (persisted) return persisted
  return browserLanguages.some((language) =>
    language.toLowerCase().startsWith('de'),
  )
    ? 'de'
    : 'en'
}

function savedLocale(): string | null {
  try {
    return localStorage.getItem(localeStorageKey)
  } catch {
    return null
  }
}

export const i18n: I18nInstance = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(savedLocale(), navigator.languages),
  fallbackLng: 'en',
  supportedLngs: ['de', 'en'],
  interpolation: { escapeValue: false },
  initAsync: false,
})

document.documentElement.lang = i18n.resolvedLanguage ?? 'en'

export async function setLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale)
  document.documentElement.lang = locale
  try {
    localStorage.setItem(localeStorageKey, locale)
  } catch {
    // The selected locale still applies when storage is unavailable.
  }
}
