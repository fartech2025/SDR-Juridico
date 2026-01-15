import * as React from 'react'
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { AuthLayout } from '@/layouts/AuthLayout'

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')

    window.setTimeout(() => {
      if (!password.trim() || password !== confirmPassword) {
        setStatus('error')
        toast.error('As senhas nao conferem.')
        return
      }
      setStatus('idle')
      toast.success('Senha atualizada com sucesso.')
      navigate('/login')
    }, 700)
  }

  return (
    <AuthLayout title="CRIAR NOVA SENHA" sideSubtitle="">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2F6BFF]">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-(--auth-text)">
        Criar nova senha
      </h2>
      <p className="mt-2 text-sm text-(--auth-text-muted)">
        Informe sua nova senha para concluir a redefinicao.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Nova senha
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
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)">
            Confirmacao
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" />
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-(--auth-text-muted)">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Minimo de 8 caracteres
        </div>
        {status === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            Verifique as senhas e tente novamente.
          </div>
        )}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-(--auth-primary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Atualizando...' : 'Salvar senha'}
        </button>
        <Link
          to="/login"
          className="block text-center text-xs text-(--auth-text-muted) hover:underline"
        >
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  )
}
