import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ── 1. PKCE flow (OAuth providers like Google) ──
        // Supabase exchanges the code automatically via onAuthStateChange,
        // but we can also check query params for the code.
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('❌ Erro ao trocar código por sessão:', error)
            navigate('/login?error=oauth_failed')
            return
          }

          if (import.meta.env.DEV) {
            console.log('✅ OAuth sessão definida:', data.user?.email)
          }

          // Salvar tokens do Google para uso com Calendar API
          const providerToken = data.session?.provider_token
          const providerRefreshToken = data.session?.provider_refresh_token
          if (providerToken && data.user) {
            try {
              await supabase.functions.invoke('store-google-tokens', {
                body: {
                  user_id: data.user.id,
                  access_token: providerToken,
                  refresh_token: providerRefreshToken || null,
                },
              })
              if (import.meta.env.DEV) {
                console.log('✅ Google tokens salvos para Calendar')
              }
            } catch (e) {
              console.warn('⚠️ Falha ao salvar Google tokens (Calendar pode não funcionar):', e)
            }
          }

          navigate('/app/dashboard', { replace: true })
          return
        }

        // ── 2. Hash-based flow (email confirm, password reset, magic link) ──
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (import.meta.env.DEV) {
          console.log('🔐 AuthCallback - Type:', type)
          console.log('🔐 AuthCallback - Has tokens:', !!accessToken, !!refreshToken)
        }

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('❌ Erro ao definir sessão:', error)
            navigate('/login?error=callback_failed')
            return
          }

          if (import.meta.env.DEV) {
            console.log('✅ Sessão definida com sucesso!', data.user?.email)
          }

          if (type === 'signup' || type === 'email_confirmation' || type === 'invite' || type === 'magiclink') {
            // Invited users or new signups must set their own password
            navigate('/reset-password', { replace: true })
          } else if (type === 'recovery') {
            navigate('/reset-password', { replace: true })
          } else {
            navigate('/app/dashboard', { replace: true })
          }
        } else {
          console.warn('⚠️ Tokens não encontrados na URL')
          navigate('/login?error=no_tokens')
        }
      } catch (err) {
        console.error('❌ Erro no callback:', err)
        navigate('/login?error=callback_exception')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <h2 className="text-xl font-semibold text-gray-800">Processando...</h2>
        <p className="mt-2 text-gray-600">Aguarde enquanto confirmamos seu acesso.</p>
      </div>
    </div>
  )
}
