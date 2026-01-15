import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { FontProvider } from '@/contexts/FontContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { router } from '@/app/router'

// Componente interno que usa o tema
function AppContent() {
  const { theme } = useTheme()
  
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme={theme}
        position="top-right"
        toastOptions={{
          className:
            'border border-border bg-surface text-text shadow-panel',
          descriptionClassName: 'text-text-muted',
        }}
      />
    </>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <FontProvider>
        <AuthProvider>
          <OrganizationProvider>
            <PermissionsProvider>
              <AppContent />
            </PermissionsProvider>
          </OrganizationProvider>
        </AuthProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

export default App
