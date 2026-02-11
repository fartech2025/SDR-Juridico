import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { permissionsService } from '@/services/permissionsService'
import { usePermissions } from '@/hooks/usePermissions'

const LOGO_URL = 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/talent%20jud%2003.png'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  const { refreshPermissions } = usePermissions()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  // Detect auth tokens in URL hash (from invite/confirm email links)
  React.useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      navigate(`/auth/callback${hash}`, { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setIsLoading(false)
      toast.error('Credenciais obrigatorias.')
      return
    }

    const { error } = await signIn(email.trim(), password.trim())
    if (error) {
      setIsLoading(false)
      // Mensagem amigavel para usuario convidado que ainda nao definiu senha
      const msg = error.message || ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
        toast.error('Credenciais invalidas. Se voce recebeu um convite por email, clique no link do email para definir sua senha antes de fazer login.')
      } else {
        toast.error('Falha no login: ' + (msg || 'verifique seus dados'))
      }
      return
    }

    toast.success('Acesso liberado.')

    // Verificar se o usuario precisa trocar a senha no primeiro login
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser()
    if (currentAuthUser?.user_metadata?.must_change_password === true) {
      toast.info('Por seguranca, defina sua senha pessoal.')
      navigate('/reset-password', { replace: true })
      setIsLoading(false)
      return
    }

    const resolveUserProfile = async () => {
      let lastUser = null as Awaited<ReturnType<typeof permissionsService.getCurrentUser>>
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        lastUser = await permissionsService.getCurrentUser()
        if (lastUser) return lastUser
      }
      return lastUser
    }

    await refreshPermissions()
    const currentUser = await resolveUserProfile()

    if (currentUser?.is_fartech_admin === true) {
      toast.info(`Bem-vindo, Admin Fartech!`)
      navigate('/admin/organizations', { replace: true })
    } else {
      toast.info(`Bem-vindo, ${currentUser?.name || currentUser?.email}!`)
      navigate('/app/dashboard', { replace: true })
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setIsGoogleLoading(false)
      toast.error('Falha ao iniciar login com Google: ' + (error.message || 'tente novamente'))
    }
    // Redirect happens automatically via Supabase OAuth — no need to setIsGoogleLoading(false)
  }

  /* ───── inline styles to shield from force-light.css !important overrides ───── */
  const s = {
    page: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      background: '#f7f8fc',
    } as React.CSSProperties,

    /* LEFT — branding panel */
    left: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      width: '55%',
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #721011 0%, #4A0B0C 55%, #2D0707 100%)',
      padding: '48px 56px',
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

    /* RIGHT — form panel */
    right: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '45%',
      minHeight: '100vh',
      background: '#ffffff',
      padding: '48px 56px',
    } as React.CSSProperties,

    formWrap: {
      width: '100%',
      maxWidth: 420,
    } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      {/* ════════════════ LEFT PANEL — Branding ════════════════ */}
      <div style={s.left} className="hidden lg:flex">
        {/* Grid texture */}
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* Large shield watermark */}
        <svg
          style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', opacity: 0.06 }}
          width="560" height="660" viewBox="0 0 200 240"
        >
          <path d="M100 0 L200 40 L200 140 C200 200 100 240 100 240 C100 240 0 200 0 140 L0 40 Z" fill="white"/>
        </svg>

        {/* Top logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <img
            src={LOGO_URL}
            alt="TalentJUD"
            style={{ height: 64, width: 'auto', borderRadius: 8, objectFit: 'contain' }}
          />
        </div>

        {/* Central hero */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
          {/* Shield illustration */}
          <svg viewBox="0 0 400 350" fill="none" style={{ width: '72%', maxWidth: 380, height: 'auto' }}>
            <path d="M200 20 L350 70 L350 180 C350 260 200 320 200 320 C200 320 50 260 50 180 L50 70 Z"
              fill="url(#sg)" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <path d="M200 50 L320 90 L320 175 C320 235 200 285 200 285 C200 285 80 235 80 175 L80 90 Z"
              fill="url(#ig)" opacity="0.5"/>
            <clipPath id="logoClip">
              <circle cx="200" cy="170" r="91"/>
            </clipPath>
            <image
              href="https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png"
              x="96" y="66" width="208" height="208"
              clipPath="url(#logoClip)"
              preserveAspectRatio="xMidYMid slice"
            />
            <defs>
              <linearGradient id="sg" x1="50" y1="20" x2="350" y2="320">
                <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0.04)"/>
              </linearGradient>
              <radialGradient id="ig" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.28)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </radialGradient>
            </defs>
          </svg>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Seguro', 'Eficiente', 'Organizado'].map((t) => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                borderRadius: 999, padding: '8px 18px',
                color: '#fff', fontSize: 13, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          Plataforma completa para gestão jurídica
        </p>
      </div>

      {/* ════════════════ RIGHT PANEL — Login Form ════════════════ */}
      <div style={s.right}>
        <div style={s.formWrap}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src={LOGO_URL} alt="TalentJUD" style={{ height: 48, margin: '0 auto', borderRadius: 6 }}/>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.2 }}>
              Bem-vindo de volta
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 16px 14px 44px',
                    fontSize: 15, color: '#0f172a', fontFamily: "'DM Sans', sans-serif",
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#721011'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(114,16,17,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 48px 14px 44px',
                    fontSize: 15, color: '#0f172a', fontFamily: "'DM Sans', sans-serif",
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#721011'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(114,16,17,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
                <input type="checkbox" style={{ accentColor: '#721011', width: 16, height: 16 }}/>
                Lembrar-me
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: '#721011', textDecoration: 'none' }}>
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '15px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#721011', color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(114,16,17,0.28)',
                transition: 'background .15s, box-shadow .15s',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = '#4A0B0C'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(114,16,17,0.35)' }}}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#721011'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(114,16,17,0.28)' }}
            >
              {isLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span style={{ color: '#fff' }}>Entrando...</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#fff' }}>Entrar</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>ou continue com</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleLogin}
            style={{
              width: '100%', padding: '14px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              background: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 12,
              fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              cursor: (isGoogleLoading || isLoading) ? 'wait' : 'pointer',
              transition: 'background .15s, border-color .15s, box-shadow .15s',
              opacity: (isGoogleLoading || isLoading) ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!isGoogleLoading && !isLoading) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {isGoogleLoading ? (
              <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24">
                <circle opacity="0.25" cx="12" cy="12" r="10" stroke="#374151" strokeWidth="4" fill="none"/>
                <path opacity="0.75" fill="#374151" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span style={{ color: '#374151' }}>
              {isGoogleLoading ? 'Redirecionando...' : 'Entrar com Google'}
            </span>
          </button>

          {/* Footer */}
          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            © 2026 TalentJUD. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Mobile: full-width when left panel is hidden */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 1023px) {
          /* on mobile hide left and make right full */
          div[style] > div:first-child { display: none !important; }
          div[style] > div:last-child  { width: 100% !important; padding: 32px 24px !important; }
        }
      `}</style>
    </div>
  )
}
