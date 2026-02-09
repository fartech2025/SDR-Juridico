import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

/**
 * Smart root redirect component.
 * Detects auth tokens in the URL hash (from Supabase email confirmation/invite)
 * and redirects to /auth/callback to process them.
 * Otherwise, redirects to /app/dashboard.
 */
export function RootRedirect() {
  const navigate = useNavigate()
  const hash = window.location.hash

  useEffect(() => {
    // Check if the URL hash contains auth tokens (from invite/confirm emails)
    if (hash && hash.includes('access_token')) {
      // Preserve the hash and redirect to the auth callback handler
      navigate(`/auth/callback${hash}`, { replace: true })
      return
    }
  }, [hash, navigate])

  // If tokens were found, the useEffect will redirect — show spinner briefly
  if (hash && hash.includes('access_token')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <h2 className="text-xl font-semibold text-gray-800">Processando...</h2>
          <p className="mt-2 text-gray-600">Aguarde enquanto confirmamos seu acesso.</p>
        </div>
      </div>
    )
  }

  // No tokens — normal redirect to dashboard
  return <Navigate to="/app/dashboard" replace />
}
