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

          console.log('✅ OAuth sessão definida:', data.user?.email)

          // Salvar tokens do Google para uso com Calendar API
          const providerToken = data.session?.provider_token
          const providerRefreshToken = data.session?.provider_refresh_token
          console.log('🔑 Provider token recebido?', !!providerToken, 'Refresh token?', !!providerRefreshToken)

          if (providerToken) {
            // Salvar no localStorage como fonte confiável (sempre funciona)
            try {
              localStorage.setItem('google_calendar_token', JSON.stringify({
                access_token: providerToken,
                refresh_token: providerRefreshToken || null,
                saved_at: new Date().toISOString(),
              }))
              console.log('✅ Google tokens salvos no localStorage')
            } catch (e) {
              console.warn('⚠️ Falha ao salvar tokens no localStorage:', e)
            }

            // Também tentar salvar no user_metadata (backup servidor)
            if (data.user) {
              supabase.functions.invoke('store-google-tokens', {
                body: {
                  user_id: data.user.id,
                  access_token: providerToken,
                  refresh_token: providerRefreshToken || null,
                },
              }).then(res => {
                console.log('✅ Google tokens salvos no user_metadata:', res.data)
              }).catch(e => {
                console.warn('⚠️ Falha ao salvar no user_metadata (localStorage funciona):', e)
              })
            }
          } else {
            console.warn('⚠️ Nenhum provider_token recebido do Google OAuth — Calendar não vai funcionar')
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
    <div className="flex min-h-screen items-center justify-center bg-surface-alt">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <h2 className="text-xl font-semibold text-text">Processando...</h2>
        <p className="mt-2 text-text-muted">Aguarde enquanto confirmamos seu acesso.</p>
      </div>
    </div>
  )
}
