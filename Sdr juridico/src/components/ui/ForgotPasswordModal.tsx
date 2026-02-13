import * as React from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { supabase } from '@/lib/supabaseClient'

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
}

export const ForgotPasswordModal = ({ open, onClose }: ForgotPasswordModalProps) => {
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
      toast.success('Link de recuperacao enviado.')
    } catch {
      setStatus('error')
      setErrorMessage('Erro inesperado. Tente novamente.')
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recuperar acesso"
      description="Informe seu email para receber o link de redefinição."
      maxWidth="26rem"
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--brand-accent)' }} />
            <input
              type="email"
              placeholder="email@seudominio.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setStatus('idle')
              }}
              style={{
                height: 48,
                width: '100%',
                borderRadius: 999,
                border: '1px solid var(--auth-border, #e2e8f0)',
                background: 'var(--auth-bg, #f8fafc)',
                paddingLeft: 44,
                paddingRight: 16,
                fontSize: 15,
                color: 'var(--brand-dark, #0f172a)',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(114,16,17,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--auth-border, #e2e8f0)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
        {status === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 16, border: '1px solid var(--auth-border, #e2e8f0)', background: '#fff', padding: '10px 16px', fontSize: 13, color: 'var(--brand-accent)', boxShadow: '0 2px 8px rgba(47,107,255,0.08)' }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--color-success, #10b981)' }} />
            Link enviado. Verifique seu email.
          </div>
        )}
        {status === 'error' && (
          <div style={{ borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>
            {errorMessage || 'Erro ao enviar o link.'}
          </div>
        )}
        <button
          type="submit"
          style={{
            height: 48,
            width: '100%',
            borderRadius: 12,
            background: 'var(--brand-primary)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            boxShadow: '0 4px 14px rgba(114,16,17,0.18)',
            border: 'none',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            transition: 'background .15s, box-shadow .15s',
            opacity: status === 'loading' ? 0.7 : 1,
          }}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
    </Modal>
  )
}
