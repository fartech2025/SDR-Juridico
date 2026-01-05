import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { router } from '@/app/router'

const App = () => (
  <>
    <RouterProvider router={router} />
    <Toaster
      theme="light"
      position="top-right"
      toastOptions={{
        className:
          'border border-border bg-surface text-text shadow-panel',
        descriptionClassName: 'text-text-muted',
      }}
    />
  </>
)

export default App
