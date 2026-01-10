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
import { useTheme } from '@/contexts/ThemeContext'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const state = resolveStatus(params.get('state'))
  const [activeTab, setActiveTab] = React.useState<TabKey>('Essencial')
  const [selectedIntegration, setSelectedIntegration] =
    React.useState<Integration | null>(null)
  const { orgId } = useCurrentUser()
  const { integrations, loading, error, createDefaultIntegrations } = useIntegrations()

  const dedupedIntegrations = React.useMemo(() => {
    const byKey = new Map<string, Integration>()
    integrations.forEach((integration) => {
      const key = integration.name.toLowerCase().trim()
      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, integration)
        return
      }
      if (existing.status !== 'connected' && integration.status === 'connected') {
        byKey.set(key, integration)
      }
    })
    return Array.from(byKey.values())
  }, [integrations])

  const filteredIntegrations = React.useMemo(() => {
    if (activeTab === 'Essencial') {
      return dedupedIntegrations.filter((integration) =>
        ['whatsapp', 'google_calendar', 'email'].some((key) =>
          matchesKey(integration.name, key),
        ),
      )
    }
    return dedupedIntegrations.filter(
      (integration) => !integration.name.toLowerCase().includes('whatsapp'),
    )
  }, [activeTab, dedupedIntegrations])

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
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-5">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]',
            isDark
              ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#10141b] to-[#0b0f14]'
              : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              isDark ? 'opacity-20' : 'opacity-80',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-xs uppercase tracking-[0.3em]',
                isDark ? 'text-emerald-200' : 'text-[#9a5b1e]',
              )}
            >
              Configuracoes
            </p>
            <h2 className={cn('font-display text-2xl', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
              Preferencias
            </h2>
            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-[#7a4a1a]')}>
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
                ? isDark
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                  : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-300'
                  : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:text-[#2a1400]',
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
              try {
                await createDefaultIntegrations()
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
              <Card
                key={integration.id}
                className={cn(
                  'border',
                  isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
                )}
              >
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
                      className="!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-0"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Acessar API
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(integration)}
                      className="!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-0"
                    >
                      Configurar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card
            className={cn(
              'border',
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
            )}
          >
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
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 shadow-soft',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
                  )}
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
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
              )}
            >
              Status atual:{' '}
              <span className="text-text">{selectedIntegration.status}</span>
            </div>
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
              )}
            >
              Ultima sincronizacao: 2 dias atras.
            </div>
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
              )}
            >
              Ajustes disponiveis: webhooks, notificacoes e canais.
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  )
}
