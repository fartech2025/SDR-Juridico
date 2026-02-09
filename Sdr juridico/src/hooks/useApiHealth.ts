import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { testarConexao } from '@/services/datajudService'

type ApiStatus = 'checking' | 'online' | 'offline'

interface ApiHealthState {
  datajud: ApiStatus
  dou: ApiStatus
}

const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useApiHealth() {
  const [status, setStatus] = useState<ApiHealthState>({
    datajud: 'checking',
    dou: 'checking',
  })

  const checkDataJud = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    try {
      const result = await testarConexao()
      return result.sucesso
    } catch {
      return false
    }
  }, [])

  const checkDOU = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    try {
      const { data, error } = await supabase.functions.invoke('dou-search', {
        body: { termo: 'teste', limit: 1 },
      })
      // Any HTTP response (even 401/403) means the edge function is reachable
      // Only network errors (fetch failure) should count as "offline"
      if (data) return true
      if (error) {
        // FunctionsHttpError = server responded (online), FunctionsRelayError/FetchError = offline
        const errName = (error as any)?.name || ''
        if (errName === 'FunctionsHttpError') return true // server is up, just auth issue
        return false
      }
      return true
    } catch {
      return false
    }
  }, [])

  const runChecks = useCallback(async () => {
    const [datajudOk, douOk] = await Promise.allSettled([
      checkDataJud(),
      checkDOU(),
    ])

    setStatus({
      datajud: datajudOk.status === 'fulfilled' && datajudOk.value ? 'online' : 'offline',
      dou: douOk.status === 'fulfilled' && douOk.value ? 'online' : 'offline',
    })
  }, [checkDataJud, checkDOU])

  useEffect(() => {
    runChecks()
    const interval = setInterval(runChecks, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [runChecks])

  return status
}
