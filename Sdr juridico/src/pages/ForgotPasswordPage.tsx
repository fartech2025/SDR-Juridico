import * as React from 'react'
import { CheckCircle2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabaseClient'

const LOGO_URL = 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/talent%20jud%2003.png'

/**
 * Página standalone de recuperação de senha.
 *
 * Segue a arquitetura canônica:
 * - Design tokens CSS (--brand-primary, --brand-accent, --brand-primary-900, etc.)
 * - Paleta oficial Burgundy / Amber / Warm Gray / Preto
 * - Layout split-screen consistente com LoginPage
 * - Sem lógica de negócio — apenas orquestra supabase.auth.resetPasswordForEmail
 */
export const ForgotPasswordPage = () => {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [email, setEmail] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim()) {
      setStatus('error')
      setErrorMessage('Informe um email valido.')
      toast.error('Informe um email valido.')
      return
    }

    setStatus('loading')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        setStatus('error')
        if (error.message.includes('rate limit')) {
          setErrorMessage('Muitas tentativas. Aguarde alguns minutos.')
          toast.error('Muitas tentativas. Aguarde alguns minutos.')
        } else {
          setErrorMessage(error.message)
          toast.error('Erro ao enviar link: ' + error.message)
        }
        return
      }

      setStatus('success')
      toast.success('Link de recuperacao enviado para seu email.')
    } catch {
      setStatus('error')
      setErrorMessage('Erro inesperado. Tente novamente.')
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  /* ───── inline styles — immune to force-light.css overrides ───── */
  const s = {
    page: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      background: '#f7f8fc',
    } as React.CSSProperties,

    left: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      width: '55%',
      minHeight: '100vh',
      background: 'linear-gradient(145deg, var(--brand-primary, #721011) 0%, var(--brand-primary-900, #4A0B0C) 55%, #2D0707 100%)',
      padding: '48px 56px',
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

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
      {/* ══════ LEFT PANEL — Branding ══════ */}
      <div style={s.left} className="hidden lg:flex">
        {/* Grid texture */}
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* Shield watermark */}
        <svg
          style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', opacity: 0.06 }}
          width="560" height="660" viewBox="0 0 200 240"
        >
          <path d="M100 0 L200 40 L200 140 C200 200 100 240 100 240 C100 240 0 200 0 140 L0 40 Z" fill="white" />
        </svg>

        {/* Top logo */}
        <div style={{ position: 'relative', zIndex: 2, overflow: 'visible' }}>
          <img
            src={LOGO_URL}
            alt="TalentJUD"
            style={{ height: 96, width: 'auto', borderRadius: 8, objectFit: 'contain', transform: 'scale(3)', transformOrigin: 'top left' }}
          />
        </div>

        {/* Central hero */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
          <svg viewBox="0 0 400 350" fill="none" style={{ width: '72%', maxWidth: 380, height: 'auto' }}>
            <path d="M200 20 L350 70 L350 180 C350 260 200 320 200 320 C200 320 50 260 50 180 L50 70 Z"
              fill="url(#sg)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <path d="M200 50 L320 90 L320 175 C320 235 200 285 200 285 C200 285 80 235 80 175 L80 90 Z"
              fill="url(#ig)" opacity="0.5" />
            <clipPath id="logoClip">
              <circle cx="200" cy="170" r="91" />
            </clipPath>
            <image
              href="https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png"
              x="96" y="66" width="208" height="208"
              clipPath="url(#logoClip)"
              preserveAspectRatio="xMidYMid slice"
            />
            <defs>
              <linearGradient id="sg" x1="50" y1="20" x2="350" y2="320">
                <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
              </linearGradient>
              <radialGradient id="ig" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
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
                  <path d="M20 6L9 17l-5-5" />
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

      {/* ══════ RIGHT PANEL — Forgot Password Form ══════ */}
      <div style={s.right}>
        <div style={s.formWrap}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src={LOGO_URL} alt="TalentJUD" style={{ height: 72, margin: '0 auto', borderRadius: 6, transform: 'scale(3)', transformOrigin: 'top center' }} />
          </div>

          {/* Back link */}
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600,
              color: 'var(--brand-secondary, #6B5E58)',
              textDecoration: 'none', marginBottom: 24,
              transition: 'color .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary, #721011)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--brand-secondary, #6B5E58)' }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Voltar ao login
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--brand-primary-50, #FAF3F3)',
              marginBottom: 20,
            }}>
              <ShieldCheck style={{ width: 28, height: 28, color: 'var(--brand-primary, #721011)' }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text, #000)', margin: '0 0 8px', lineHeight: 1.2 }}>
              Recuperar acesso
            </h2>
            <p style={{ fontSize: 15, color: 'var(--brand-secondary, #6B5E58)', margin: '0 0 32px' }}>
              Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {/* ── Success state ── */}
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, borderRadius: '50%',
                background: '#ecfdf5', margin: '0 auto 20px',
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--color-success, #10b981)' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text, #000)', margin: '0 0 8px' }}>
                E-mail enviado!
              </h3>
              <p style={{ fontSize: 14, color: 'var(--brand-secondary, #6B5E58)', margin: '0 0 8px', lineHeight: 1.6 }}>
                Enviamos um link de recuperação para{' '}
                <strong style={{ color: 'var(--color-text, #000)' }}>{email}</strong>.
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500, #8A7E78)', margin: '0 0 28px' }}>
                Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
              </p>

              <button
                type="button"
                onClick={() => { setStatus('idle'); setEmail('') }}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: 'transparent',
                  color: 'var(--brand-primary, #721011)',
                  border: '2px solid var(--brand-primary, #721011)',
                  borderRadius: 12,
                  fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer', marginBottom: 12,
                  transition: 'background .15s, color .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-primary-50, #FAF3F3)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Tentar outro e-mail
              </button>
              <Link
                to="/login"
                style={{
                  display: 'block', width: '100%', padding: '14px 24px',
                  textAlign: 'center', textDecoration: 'none',
                  background: 'var(--brand-primary, #721011)',
                  color: '#fff', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 14px rgba(114,16,17,0.28)',
                  transition: 'background .15s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-primary-900, #4A0B0C)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand-primary, #721011)' }}
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit}>
              {/* Email input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-gray-700, #3D3632)', marginBottom: 6 }}>
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Mail style={{ width: 18, height: 18, color: 'var(--color-gray-400, #A39D98)' }} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                    placeholder="seu@email.com"
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '14px 16px 14px 44px',
                      fontSize: 15, color: 'var(--color-text, #000)', fontFamily: "'DM Sans', sans-serif",
                      background: 'var(--color-gray-50, #F8F7F6)',
                      border: '1px solid var(--color-gray-300, #C3BFB9)', borderRadius: 12,
                      outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-primary, #721011)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(114,16,17,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-gray-300, #C3BFB9)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Error message */}
              {status === 'error' && errorMessage && (
                <div style={{
                  borderRadius: 10, border: '1px solid #fecaca',
                  background: '#fef2f2', padding: '10px 14px',
                  fontSize: 13, color: '#dc2626', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '15px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'var(--brand-primary, #721011)', color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(114,16,17,0.28)',
                  transition: 'background .15s, box-shadow .15s',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (status !== 'loading') { e.currentTarget.style.background = 'var(--brand-primary-900, #4A0B0C)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(114,16,17,0.35)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand-primary, #721011)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(114,16,17,0.28)' }}
              >
                {status === 'loading' ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Mail style={{ width: 18, height: 18 }} />
                    <span>Enviar link de recuperação</span>
                  </>
                )}
              </button>

              {/* Secondary link */}
              <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--brand-secondary, #6B5E58)' }}>
                Lembrou sua senha?{' '}
                <Link
                  to="/login"
                  style={{ fontWeight: 600, color: 'var(--brand-primary, #721011)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                >
                  Fazer login
                </Link>
              </p>
            </form>
          )}

          {/* Footer */}
          <p style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: 'var(--color-gray-400, #A39D98)' }}>
            © 2026 TalentJUD. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Responsive + spin keyframe */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 1023px) {
          div[style] > div:first-child { display: none !important; }
          div[style] > div:last-child  { width: 100% !important; padding: 32px 24px !important; }
        }
      `}</style>
    </div>
  )
}

