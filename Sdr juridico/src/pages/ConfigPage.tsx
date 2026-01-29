import * as React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'
import { toast } from 'sonner'

import heroLight from '@/assets/hero-light.svg'
import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { Integration, IntegrationStatus } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useIntegrations } from '@/hooks/useIntegrations'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { supabase } from '@/lib/supabaseClient'

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
  const [integrationBusy, setIntegrationBusy] = React.useState(false)
  const [calendarId, setCalendarId] = React.useState('')
  const { orgId } = useCurrentUser()
  const {
    integrations,
    loading,
    error,
    createDefaultIntegrations,
    updateIntegration,
  } = useIntegrations()

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
    // Aba Avançado: mostra todas exceto whatsapp
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
  const canSeed = !loading && integrations.length === 0
  const selectedIsGoogleCalendar = selectedIntegration
    ? matchesKey(selectedIntegration.name, 'google_calendar')
    : false
  const googleCalendarStatus = params.get('google_calendar')

  const resolveCalendarId = (integration: Integration | null) => {
    const settings = integration?.settings
    if (settings && typeof settings === 'object' && 'calendar_id' in settings) {
      const value = (settings as { calendar_id?: string }).calendar_id
      return typeof value === 'string' ? value : ''
    }
    return ''
  }

  const buildGoogleCalendarSettings = (
    overrides: Record<string, unknown> = {},
  ) => {
    const baseSettings =
      selectedIntegration?.settings && typeof selectedIntegration.settings === 'object'
        ? (selectedIntegration.settings as Record<string, unknown>)
        : {}
    const next: Record<string, unknown> = { ...baseSettings, ...overrides }
    const trimmedCalendarId = calendarId.trim()
    if (trimmedCalendarId) {
      next.calendar_id = trimmedCalendarId
    } else if ('calendar_id' in next) {
      delete next.calendar_id
    }
    return next
  }

  const handleGoogleCalendarConnect = async () => {
    if (!selectedIntegration) return
    setIntegrationBusy(true)
    try {
      const settings = buildGoogleCalendarSettings({
        linked_at: new Date().toISOString(),
      })
      await updateIntegration(selectedIntegration.id, { settings })
      setSelectedIntegration((prev) => (prev ? { ...prev, settings } : prev))
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase nao configurado.')
      }
      if (!orgId) {
        throw new Error('Organizacao nao encontrada.')
      }
      const returnTo = `${window.location.origin}/app/config`
      const oauthUrl = new URL(
        `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`,
      )
      oauthUrl.searchParams.set('integration_id', selectedIntegration.id)
      oauthUrl.searchParams.set('org_id', orgId)
      oauthUrl.searchParams.set('return_to', returnTo)
      window.location.href = oauthUrl.toString()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar integracao'
      toast.error(message)
      setIntegrationBusy(false)
    } finally {
      if (!document.hidden) {
        setIntegrationBusy(false)
      }
    }
  }

  const handleGoogleCalendarDisconnect = async () => {
    if (!selectedIntegration) return
    setIntegrationBusy(true)
    try {
      const settings = buildGoogleCalendarSettings({
        unlinked_at: new Date().toISOString(),
      })
      await updateIntegration(selectedIntegration.id, {
        enabled: false,
        settings,
      })
      setSelectedIntegration((prev) =>
        prev ? { ...prev, status: 'disconnected', settings } : prev,
      )
      toast.success('Google Calendar desvinculado.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar integracao'
      toast.error(message)
    } finally {
      setIntegrationBusy(false)
    }
  }

  const handleGoogleCalendarSave = async () => {
    if (!selectedIntegration) return
    setIntegrationBusy(true)
    try {
      const settings = buildGoogleCalendarSettings({
        updated_at: new Date().toISOString(),
      })
      await updateIntegration(selectedIntegration.id, { settings })
      setSelectedIntegration((prev) => (prev ? { ...prev, settings } : prev))
      toast.success('Configuracao do Google Calendar salva.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar configuracao'
      toast.error(message)
    } finally {
      setIntegrationBusy(false)
    }
  }

  const handleGoogleCalendarSync = async () => {
    if (!orgId) {
      toast.error('Organizacao nao encontrada.')
      return
    }
    setIntegrationBusy(true)
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (sessionError || !accessToken) {
        throw new Error('Sessao expirada. Faca login novamente.')
      }
      const { data, error: syncError } = await supabase.functions.invoke(
        'google-calendar-sync',
        {
          body: { org_id: orgId },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      if (syncError) {
        throw syncError
      }
      toast.success('Sincronizacao concluida.')
      if (data?.created || data?.updated || data?.pushed) {
        toast.success(
          `Sync: +${data.created || 0} novos, ${data.updated || 0} atualizados, ${data.pushed || 0} enviados.`,
        )
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao sincronizar agenda'
      toast.error(message)
    } finally {
      setIntegrationBusy(false)
    }
  }

  React.useEffect(() => {
    if (!selectedIntegration || !selectedIsGoogleCalendar) {
      setCalendarId('')
      return
    }
    setCalendarId(resolveCalendarId(selectedIntegration))
  }, [selectedIntegration, selectedIsGoogleCalendar])

  React.useEffect(() => {
    if (!googleCalendarStatus) return
    if (googleCalendarStatus === 'connected') {
      toast.success('Google Calendar conectado.')
    } else if (googleCalendarStatus === 'error') {
      toast.error('Falha ao conectar Google Calendar.')
    }
  }, [googleCalendarStatus])

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        'bg-base text-text',
      )}
    >
      <div className="space-y-5">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]','border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              'opacity-90',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-xs uppercase tracking-[0.3em]',
                'text-text-muted',
              )}
            >
              Configuracoes
            </p>
            <h2 className={cn('font-display text-2xl', 'text-text')}>
              Preferencias
            </h2>
            <p className={cn('text-sm', 'text-text-muted')}>
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
                ? 'border-[#721011]/60 bg-[#721011]/10 text-[#721011]'
                : 'border-border bg-white text-text-muted hover:text-text',
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
            {filteredIntegrations.map((integration) => {
              const isGoogleCalendar = matchesKey(
                integration.name,
                'google_calendar',
              )
              const actionLabel = isGoogleCalendar
                ? integration.status === 'connected'
                  ? 'Gerenciar'
                  : 'Vincular'
                : 'Configurar'
              return (
                <Card
                  key={integration.id}
                  className={cn(
                    'border','border-border bg-white/95',
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
                        className="!bg-[#721011] !text-white hover:!bg-[#8a1315] !border-0"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Acessar API
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIntegration(integration)}
                        className="!bg-[#721011] !text-white hover:!bg-[#8a1315] !border-0"
                      >
                        {actionLabel}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
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
                    'border-border bg-white',
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
            <Button
              variant="ghost"
              onClick={() => setSelectedIntegration(null)}
              disabled={integrationBusy}
            >
              Fechar
            </Button>
            {selectedIsGoogleCalendar ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleGoogleCalendarSave}
                  disabled={integrationBusy}
                >
                  Salvar ajustes
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGoogleCalendarSync}
                  disabled={integrationBusy}
                >
                  Sincronizar agora
                </Button>
                {selectedIntegration?.status === 'connected' ? (
                  <Button
                    variant="danger"
                    onClick={handleGoogleCalendarDisconnect}
                    disabled={integrationBusy}
                  >
                    Desvincular
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleGoogleCalendarConnect}
                    disabled={integrationBusy}
                  >
                    Vincular Google Calendar
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => setSelectedIntegration(null)}
                disabled={integrationBusy}
              >
                Salvar
              </Button>
            )}
          </>
        }
      >
        {selectedIntegration && (
          <div className="space-y-3 text-sm text-text-muted">
            {selectedIsGoogleCalendar && (
              <div
                className={cn(
                  'rounded-2xl border px-3 py-3 text-xs shadow-soft',
                  'border-[#721011]/40 bg-[#721011]/10 text-[#721011]',
                )}
              >
                Use o botao abaixo para vincular ou desvincular sua conta do
                Google Calendar.
              </div>
            )}
            {selectedIsGoogleCalendar && (
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-text-subtle">
                  ID do Calendario (opcional)
                </span>
                <Input
                  value={calendarId}
                  onChange={(event) => setCalendarId(event.target.value)}
                  placeholder="primary@group.calendar.google.com"
                  disabled={integrationBusy}
                />
                <p className="text-[11px] text-text-muted">
                  Use o ID do calendario compartilhado se nao for o principal.
                </p>
              </div>
            )}
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                'border-border bg-white',
              )}
            >
              Status atual:{' '}
              <span className="text-text">{selectedIntegration.status}</span>
            </div>
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                'border-border bg-white',
              )}
            >
              Ultima sincronizacao: 2 dias atras.
            </div>
            <div
              className={cn(
                'rounded-2xl border px-3 py-3 shadow-soft',
                'border-border bg-white',
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
