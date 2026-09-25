import { describe, expect, it } from 'vitest'

import { detectLocale, i18n } from './index'
import { resources } from './resources'

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof child === 'object' && child !== null
      ? keys(child, path)
      : [path]
  })
}

describe('locale selection', () => {
  it('prefers a supported saved locale', () => {
    expect(detectLocale('en', ['de-DE'])).toBe('en')
  })

  it('uses German when any browser preference begins with de', () => {
    expect(detectLocale(null, ['fr-FR', 'de-AT'])).toBe('de')
  })

  it('falls back to English for unsupported preferences', () => {
    expect(detectLocale('es', ['fr-FR'])).toBe('en')
  })

  it('falls back to an English value missing from German', async () => {
    await i18n.changeLanguage('de')
    expect(i18n.t('internal.fallbackProbe')).toBe('English fallback')
  })

  it('ships matching user-facing keys in both locales', () => {
    const english = keys(resources.en.translation).filter(
      (key) => !key.startsWith('internal.'),
    )
    const german = keys(resources.de.translation).filter(
      (key) => !key.startsWith('internal.'),
    )
    expect(german.sort()).toEqual(english.sort())
  })
})
