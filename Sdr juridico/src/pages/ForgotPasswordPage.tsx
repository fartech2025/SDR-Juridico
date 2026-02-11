import * as React from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'


import { AuthLayout } from '@/layouts/AuthLayout'
import { supabase } from '@/lib/supabaseClient'

export const ForgotPasswordPage = () => {
  const [status, setStatus] = React.useState<
    'idle' | 'loading' | 'error' | 'success'
  >('idle')
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
      toast.success('Link de recuperacao enviado.')
    } catch {
      setStatus('error')
      setErrorMessage('Erro inesperado. Tente novamente.')
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <AuthLayout title="RECUPERAR ACESSO" sideSubtitle="">
      <div className="flex items-center gap-3">
        <img src="https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/talent%20jud%2003.png" alt="TalentJUD" className="h-10 w-auto" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-slate-800">
        Recuperar acesso
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Informe seu email para receber o link de redefinicao.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              placeholder="email@seudominio.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setStatus('idle')
              }}
              className="h-12 w-full rounded-full border bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]"
              
            />
          </div>
        </div>
        {status === 'success' && (
          <div
            className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-3 text-xs text-slate-500 shadow-soft"
            style={{ borderColor: 'var(--auth-border)' }}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Link enviado. Verifique seu email.
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {errorMessage || 'Erro ao enviar o link.'}
          </div>
        )}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-blue-600 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar link'}
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
