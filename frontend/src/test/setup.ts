import '@testing-library/jest-dom/vitest'

import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

window.scrollTo = () => {}
// File-route chunks are transformed lazily on their first use in Vitest.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.lang = 'en'
})
