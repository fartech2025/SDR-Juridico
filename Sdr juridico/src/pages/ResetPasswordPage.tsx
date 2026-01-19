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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-subtle text-brand-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-slate-800">
        Criar nova senha
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Informe sua nova senha para concluir a redefinicao.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-full border bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Confirmacao
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 w-full rounded-full border bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Minimo de 8 caracteres
        </div>
        {status === 'error' && (
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
            Verifique as senhas e tente novamente.
          </div>
        )}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-blue-600 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Atualizando...' : 'Salvar senha'}
        </button>
        <Link
          to="/login"
          className="block text-center text-xs text-slate-500 hover:underline"
        >
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  )
}
