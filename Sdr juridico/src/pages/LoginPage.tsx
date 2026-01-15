import * as React from 'react'
import { CheckCircle2, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import logoMark from '@/assets/logo-mark.svg'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import { permissionsService } from '@/services/permissionsService'

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

    // Aguarda o auth state e o perfil estarem prontos antes de redirecionar
    const resolveUserProfile = async () => {
      let lastUser = null as Awaited<ReturnType<typeof permissionsService.getCurrentUser>>
      for (let attempt = 0; attempt < 5; attempt += 1) {
        // pequeno delay para evitar race de auth/profile
        await new Promise((resolve) => setTimeout(resolve, 150))
        lastUser = await permissionsService.getCurrentUser()
        if (lastUser) return lastUser
      }
      return lastUser
    }

    const currentUser = await resolveUserProfile()
    
    // Log para debug (pode remover depois)
    console.log('[Login] User profile:', {
      email: currentUser?.email,
      role: currentUser?.role,
      is_fartech_admin: currentUser?.is_fartech_admin,
      org_id: currentUser?.org_id,
    })

    // Redirecionamento pós-login:
    // - APENAS is_fartech_admin === true: /admin/organizations
    // - Demais usuários: /app/dashboard (guards cuidam do restante)
    if (currentUser?.is_fartech_admin === true) {
      toast.info(`Bem-vindo, Admin Fartech!`)
      navigate('/admin/organizations', { replace: true })
    } else {
      toast.info(`Bem-vindo, ${currentUser?.name || currentUser?.email}!`)
      navigate('/app/dashboard', { replace: true })
    }
  }

  return (
    <AuthLayout
      title="ACESSO RESTRITO"
      sideTitle="Acesso OAB"
      sideSubtitle="Produtividade e inteligência jurídica em um painel moderno"
    >
      <div className="flex items-center gap-3">
        <img src={logoMark} alt="Logo" className="h-12 w-12 rounded-full bg-white p-2 shadow-md" />
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)">SDR Jurídico</p>
          <p className="text-sm font-semibold text-(--auth-text)">Unir para avançar</p>
        </div>
      </div>

      <h2 className="mt-6 text-3xl font-semibold text-(--auth-text)">
        Área administrativa com segurança OAB
      </h2>
      <p className="mt-2 text-sm text-(--auth-text-muted)">
        Utilize seu e-mail corporativo para acessar o painel. Dados protegidos e verificações automáticas de acesso.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)">
            Email profissional
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="email"
              placeholder="seu.email@oab.org.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-xl border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--brand-secondary) focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.18)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-xl border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--brand-primary-dark) focus:outline-none focus:ring-2 focus:ring-[rgba(5,150,105,0.16)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-(--auth-text-muted)">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-(--brand-secondary)"
            />
            Manter conectado
          </label>
          <Link
            to="/forgot-password"
            className="text-(--auth-text-muted) hover:text-(--auth-text) hover:underline"
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
          className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-(--brand-secondary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[rgba(99,102,241,0.35)] transition duration-200 hover:brightness-105 disabled:opacity-60"
          disabled={status === 'loading'}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[rgba(99,102,241,0.35)] via-transparent to-[rgba(212,32,39,0.22)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative">{status === 'loading' ? 'Entrando...' : 'Entrar'}</span>
          <ArrowRight className="relative h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs text-(--auth-text-muted)">
          <ShieldCheck className="h-4 w-4 text-(--brand-primary)" />
          Autenticação segura com monitoramento de acesso
        </div>
      </form>
      <div className="mt-6 flex items-center justify-between text-xs text-(--auth-text-muted)">
        <span>Ou entrar com</span>
        <div className="flex items-center gap-3 font-semibold text-(--auth-text)">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">GovBR</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">OAuth</span>
        </div>
      </div>
    </AuthLayout>
  )
}
