import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'

interface UseTeamsSync {
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  lastSync: Date | null
  eventCount: number
  link: () => Promise<void>
  sync: () => Promise<void>
  refresh: () => Promise<void>
}

export function useTeamsSync(): UseTeamsSync {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)

  /**
   * Verifica se Teams está conectado
   */
  const checkConnection = useCallback(async () => {
    try {
      const orgId = await getActiveOrgId()
      if (!orgId) {
        setIsConnected(false)
        return false
      }

      const { data: integration } = await supabase
        .from('integrations')
        .select('id, is_active')
        .eq('org_id', orgId)
        .eq('provider', 'teams')
        .maybeSingle()

      const connected = !!(integration?.is_active)
      setIsConnected(connected)
      return connected
    } catch {
      setIsConnected(false)
      return false
    }
  }, [])

  /**
   * Conta eventos sincronizados do Teams
   */
  const fetchEventCount = useCallback(async () => {
    try {
      const orgId = await getActiveOrgId()
      if (!orgId) {
        setEventCount(0)
        return
      }

      const { count } = await supabase
        .from('agenda')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('external_provider', 'teams')

      setEventCount(count || 0)
    } catch {
      // Ignorar erros de contagem
    }
  }, [])

  /**
   * Inicia o fluxo de vinculação do Teams
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
        .eq('provider', 'teams')
        .maybeSingle()

      if (integrationError || !integration) {
        throw new Error('Integração do Teams não encontrada.')
      }

      // Redirecionar para OAuth
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      if (!supabaseUrl) {
        throw new Error('Supabase não configurado.')
      }

      const state = btoa(
        JSON.stringify({
          orgId,
          integrationId: integration.id,
        })
      )

      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID
      if (!clientId) {
        throw new Error('Microsoft Client ID não configurado.')
      }

      const redirectUri = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/teams-oauth`
      const oauthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
      oauthUrl.searchParams.set('client_id', clientId)
      oauthUrl.searchParams.set('redirect_uri', redirectUri)
      oauthUrl.searchParams.set('response_type', 'code')
      oauthUrl.searchParams.set('scope', 'Calendars.ReadWrite offline_access')
      oauthUrl.searchParams.set('state', state)

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
   * Sincroniza eventos do Teams com agenda local
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
      const { error: syncError } = await supabase.functions.invoke('teams-sync', {
        body: { org_id: orgId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

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
