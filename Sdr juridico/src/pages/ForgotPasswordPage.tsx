import * as React from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import logoMark from '@/assets/logo-mark.svg'
import { AuthLayout } from '@/layouts/AuthLayout'

export const ForgotPasswordPage = () => {
  const [status, setStatus] = React.useState<
    'idle' | 'loading' | 'error' | 'success'
  >('idle')
  const [email, setEmail] = React.useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')

    window.setTimeout(() => {
      if (!email.trim()) {
        setStatus('error')
        toast.error('Informe um email valido.')
        return
      }
      setStatus('success')
      toast.success('Link de recuperacao enviado.')
    }, 700)
  }

  return (
    <AuthLayout title="RECUPERAR ACESSO" sideSubtitle="">
      <div className="flex items-center gap-3">
        <img src={logoMark} alt="Logo" className="h-10 w-10" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-[color:var(--auth-text)]">
        Recuperar acesso
      </h2>
      <p className="mt-2 text-sm text-[color:var(--auth-text-muted)]">
        Informe seu email para receber o link de redefinicao.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--auth-text-muted)]">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--auth-text-muted)]" />
            <input
              type="email"
              placeholder="email@seudominio.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setStatus('idle')
              }}
              className="h-12 w-full rounded-full border bg-[color:var(--auth-input-bg)] pl-11 pr-4 text-sm text-[color:var(--auth-text)] placeholder:text-[color:var(--auth-text-muted)] focus:border-[color:var(--auth-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              style={{ borderColor: 'var(--auth-input-border)' }}
            />
          </div>
        </div>
        {status === 'success' && (
          <div
            className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-3 text-xs text-[color:var(--auth-text-muted)] shadow-soft"
            style={{ borderColor: 'var(--auth-border)' }}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Link enviado. Verifique seu email.
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            Email obrigatorio para enviar o link.
          </div>
        )}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-[color:var(--auth-primary)] text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar link'}
        </button>
        <Link
          to="/login"
          className="block text-center text-xs text-[color:var(--auth-text-muted)] hover:underline"
        >
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  )
}
