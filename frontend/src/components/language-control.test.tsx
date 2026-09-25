import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import { i18n, localeStorageKey } from '#/i18n'

import { LanguageControl } from './language-control'

describe('LanguageControl', () => {
  it('changes visible text, document metadata, and saved preference', async () => {
    await i18n.changeLanguage('de')
    document.documentElement.lang = 'de'
    const user = userEvent.setup()
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageControl />
      </I18nextProvider>,
    )

    const control = screen.getByRole('combobox', { name: 'Sprache' })
    await user.selectOptions(control, 'en')

    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(localeStorageKey)).toBe('en')
  })
})
