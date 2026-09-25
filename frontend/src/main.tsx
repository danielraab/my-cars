import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'

import './i18n'
import { createQueryClient, getRouter } from './router'

const queryClient = createQueryClient()
const router = getRouter(queryClient)

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('Mount point #app is missing from index.html')
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
