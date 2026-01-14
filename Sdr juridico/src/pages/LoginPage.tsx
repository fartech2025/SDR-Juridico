import * as React from 'react'
import { CheckCircle2, Lock, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import logoMark from '@/assets/logo-mark.svg'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')

    if (!email.trim() || !password.trim()) {
      setStatus('error')
      toast.error('Credenciais obrigatorias.')
      return
    }

    const { error } = await signIn(email.trim(), password.trim())
    if (error) {
      setStatus('error')
      toast.error('Falha no login: ' + (error.message || 'verifique seus dados'))
      return
    }

    setStatus('idle')
    toast.success('Acesso liberado.')
    
    // Redirect to /admin for now (will be handled by guards)
    navigate('/admin/organizations', { replace: true })
  }

  return (
    <AuthLayout title="LOGIN" sideTitle="Nao e membro ainda?" sideSubtitle="">
      <div className="flex items-center gap-3">
        <img src={logoMark} alt="Logo" className="h-10 w-10" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-(--auth-text)">
        10.000 advogados ajudam <span className="font-bold">15 mil</span>{' '}
        usuarios por mes no SDR Juridico
      </h2>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="email"
              placeholder="rupendesign01@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-(--auth-text-muted)">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-[#2F6BFF]"
            />
            Lembrar sessao
          </label>
          <Link
            to="/forgot-password"
            className="text-(--auth-text-muted) hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        {status === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            Verifique email e senha e tente novamente.
          </div>
        )}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-(--auth-primary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Entrando...' : 'ENTRAR'}
        </button>
        <div className="flex items-center gap-2 text-xs text-(--auth-text-muted)">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Conexao segura - Dados protegidos
        </div>
      </form>
      <div className="mt-6 flex items-center justify-between text-xs text-(--auth-text-muted)">
        <span>Ou entrar com</span>
        <div className="flex items-center gap-4 font-semibold text-(--auth-text)">
          <span>Facebook</span>
          <span>Google</span>
        </div>
      </div>
    </AuthLayout>
  )
}
