import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'

interface UseGoogleCalendarSync {
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  lastSync: Date | null
  eventCount: number
  link: () => Promise<void>
  sync: () => Promise<void>
  refresh: () => Promise<void>
}

export function useGoogleCalendarSync(): UseGoogleCalendarSync {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)

  /**
   * Verifica se o Google Calendar está conectado
   */
  const checkConnection = useCallback(async () => {
    try {
      const orgId = await getActiveOrgId()
      if (!orgId) return false

      const { data, error: err } = await supabase
        .from('integrations')
        .select('enabled, secrets, settings, updated_at')
        .eq('org_id', orgId)
        .eq('provider', 'google_calendar')
        .maybeSingle()

      if (err || !data) return false

      const secrets = data.secrets || {}
      const hasToken = Boolean(secrets.access_token)

      if (hasToken) {
        setLastSync(data.updated_at ? new Date(data.updated_at) : null)
      }

      setIsConnected(hasToken && data.enabled)
      return hasToken
    } catch {
      return false
    }
  }, [])

  /**
   * Conta eventos sincronizados do Google Calendar
   */
  const fetchEventCount = useCallback(async () => {
    try {
      const orgId = getActiveOrgId()
      if (!orgId) return

      const { count, error: err } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('external_provider', 'google_calendar')

      if (!err && count !== null) {
        setEventCount(count)
      }
    } catch {
      // Ignorar erros de contagem
    }
  }, [])

  /**
   * Inicia o fluxo de vinculação do Google Calendar
   */
  const link = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const orgId = await getActiveOrgId()
      if (!orgId) {
        throw new Error('Organização não encontrada.')
      }

      // Obter ID da integração
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('id')
        .eq('org_id', orgId)
        .eq('provider', 'google_calendar')
        .maybeSingle()

      if (integrationError || !integration) {
        throw new Error('Integração do Google Calendar não encontrada.')
      }

      // Redirecionar para OAuth
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      if (!supabaseUrl) {
        throw new Error('Supabase não configurado.')
      }

      const returnTo = `${window.location.origin}/app/config`
      const oauthUrl = new URL(
        `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`
      )
      oauthUrl.searchParams.set('integration_id', integration.id)
      oauthUrl.searchParams.set('org_id', orgId)
      oauthUrl.searchParams.set('return_to', returnTo)

      window.location.href = oauthUrl.toString()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao vincular')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Sincroniza eventos do Google Calendar
   */
  const sync = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const orgId = await getActiveOrgId()
      if (!orgId) {
        throw new Error('Organização não encontrada.')
      }

      // Chamar edge function de sincronização
      const { error: syncError } = await supabase.functions.invoke(
        'google-calendar-sync',
        {
          body: { org_id: orgId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )

      if (syncError) {
        throw syncError
      }

      // Atualizar estado
      setLastSync(new Date())
      await fetchEventCount()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao sincronizar')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetchEventCount])

  /**
   * Recarrega o estado da conexão
   */
  const refresh = useCallback(async () => {
    await checkConnection()
    await fetchEventCount()
  }, [checkConnection, fetchEventCount])

  // Verificar conexão no mount e periodicamente
  useEffect(() => {
    checkConnection()
    fetchEventCount()

    // Recarregar a cada 5 minutos
    const interval = setInterval(() => {
      checkConnection()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkConnection, fetchEventCount])

  return {
    isConnected,
    isLoading,
    error,
    lastSync,
    eventCount,
    link,
    sync,
    refresh,
  }
}
