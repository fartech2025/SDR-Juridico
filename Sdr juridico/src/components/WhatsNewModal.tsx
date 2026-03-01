// WhatsNewModal — Modal "O que há de novo" exibido para orgs com versão desatualizada
// Disparado pelo AppShell ao detectar onboarding_version !== APP_VERSION

import * as React from 'react'
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { useIsOrgAdmin } from '@/hooks/usePermissions'
import { onboardingService } from '@/services/onboardingService'
import { APP_VERSION, VERSION_HIGHLIGHTS } from '@/lib/version'

interface WhatsNewModalProps {
  open: boolean
  onClose: () => void
}

export function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
  const { currentOrg, reloadOrg } = useOrganizationContext()
  const isOrgAdmin = useIsOrgAdmin()
  const [loading, setLoading] = React.useState(false)

  const highlights = VERSION_HIGHLIGHTS[APP_VERSION]

  const handleAcknowledge = async () => {
    if (!currentOrg) { onClose(); return }

    // Apenas org_admin persiste a versão no banco — outros usuários fecham localmente
    if (!isOrgAdmin) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onboardingService.complete(currentOrg.id, APP_VERSION)
      await reloadOrg()
      onClose()
    } catch {
      toast.error('Erro ao confirmar versão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleAcknowledge}
      maxWidth="28rem"
      footer={
        <button
          onClick={handleAcknowledge}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', fontSize: 14, fontWeight: 600,
            color: '#fff', backgroundColor: '#721011', border: 'none',
            borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entendido
        </button>
      }
    >
      {/* Header colorido */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: '#fff3f3', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Sparkles className="h-5 w-5" style={{ color: '#721011' }} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Versão {APP_VERSION}
          </p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {highlights?.title ?? 'Novidades disponíveis'}
          </h3>
        </div>
      </div>

      {/* Lista de novidades */}
      {highlights?.items && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {highlights.items.map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: '#721011' }}
              />
              <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
