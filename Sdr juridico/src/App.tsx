import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { FontProvider } from '@/contexts/FontContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/app/router'

const App = () => {
  return (
    <ThemeProvider>
      <FontProvider>
        <AuthProvider>
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
        </AuthProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

export default App
