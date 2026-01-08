import * as React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'
import { toast } from 'sonner'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import type { Integration, IntegrationStatus } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useIntegrations } from '@/hooks/useIntegrations'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const tabs = ['Essencial', 'Avancado'] as const
type TabKey = (typeof tabs)[number]

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusVariant = (
  status: IntegrationStatus,
): 'info' | 'success' | 'warning' => {
  if (status === 'connected') return 'success'
  if (status === 'disconnected') return 'warning'
  return 'info'
}

const matchesKey = (value: string, key: string) => {
  const lower = value.toLowerCase()
  if (lower.includes(key)) return true
  return lower.replace(/\s+/g, '_').includes(key)
}

export const ConfigPage = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const state = resolveStatus(params.get('state'))
  const [activeTab, setActiveTab] = React.useState<TabKey>('Essencial')
  const [selectedIntegration, setSelectedIntegration] =
    React.useState<Integration | null>(null)
  const { orgId } = useCurrentUser()
  const { integrations, loading, error, createDefaultIntegrations } = useIntegrations()

  const filteredIntegrations = React.useMemo(() => {
    if (activeTab === 'Essencial') {
      return integrations.filter((integration) =>
        ['whatsapp', 'google_calendar', 'email'].some((key) =>
          matchesKey(integration.name, key),
        ),
      )
    }
    return integrations.filter((integration) => !integration.name.toLowerCase().includes('whatsapp'))
  }, [activeTab, integrations])

  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredIntegrations.length === 0
        ? 'empty'
        : 'ready'
  const pageState = state !== 'ready' ? state : baseState
  const canSeed = !loading && integrations.length === 0 && Boolean(orgId)

  return (
    <div className="space-y-5">
      <header
        className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-soft"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 72%, rgba(255,216,232,0.22) 100%), url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '520px',
          backgroundColor: 'var(--agenda-card)',
          borderColor: 'var(--agenda-border)',
          boxShadow: 'var(--agenda-shadow)',
        }}
      >
        <div className="relative z-10 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-text-subtle">
            Configuracoes
          </p>
          <h2 className="font-display text-2xl text-text">Preferencias</h2>
          <p className="text-sm text-text-muted">
            Controle integracoes e ajustes operacionais.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs uppercase tracking-wide transition',
              activeTab === tab
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-border bg-white text-text-subtle hover:text-text',
            )}
          >
            {tab}
          </button>
        ))}
        {canSeed && (
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              if (!orgId) return
              try {
                await createDefaultIntegrations(orgId)
                toast.success('Integracoes padrao criadas.')
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao criar integracoes'
                toast.error(message)
              }
            }}
            className="rounded-full"
          >
            Criar integracoes padrao
          </Button>
        )}
      </div>

      <PageState status={pageState} emptyTitle="Nenhuma integracao cadastrada">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm">
                      {integration.name}
                    </CardTitle>
                    <Badge variant={statusVariant(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    {integration.description}
                  </p>
                </CardHeader>
                <CardContent className="flex gap-2">
                  {integration.name.toLowerCase().includes('datajud') ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/app/datajud')}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Acessar API
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      Configurar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Pendencias operacionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-text-muted">
              {[
                'Revisar conexao do WhatsApp.',
                'Atualizar credenciais do Supabase.',
                'Validar webhook do CRM.',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2 shadow-soft"
                >
                  <span>{item}</span>
                  <Button variant="ghost" size="sm">
                    Revisar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageState>

      <Modal
        open={Boolean(selectedIntegration)}
        onClose={() => setSelectedIntegration(null)}
        title={selectedIntegration?.name}
        description="Configuracao da integracao."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedIntegration(null)}>
              Fechar
            </Button>
            <Button variant="primary" onClick={() => setSelectedIntegration(null)}>
              Salvar
            </Button>
          </>
        }
      >
        {selectedIntegration && (
          <div className="space-y-3 text-sm text-text-muted">
            <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-soft">
              Status atual:{' '}
              <span className="text-text">{selectedIntegration.status}</span>
            </div>
            <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-soft">
              Ultima sincronizacao: 2 dias atras.
            </div>
            <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-soft">
              Ajustes disponiveis: webhooks, notificacoes e canais.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
