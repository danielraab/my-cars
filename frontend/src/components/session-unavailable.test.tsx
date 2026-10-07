import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it } from 'vitest'

import { i18n } from '#/i18n'

import { SessionUnavailable } from './session-unavailable'

describe('SessionUnavailable', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('names the product untranslated in German', async () => {
    await i18n.changeLanguage('de')
    render(
      <I18nextProvider i18n={i18n}>
        <SessionUnavailable retry={() => {}} />
      </I18nextProvider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('My cars')
    expect(screen.getByRole('alert')).not.toHaveTextContent('my-car')
  })
})
