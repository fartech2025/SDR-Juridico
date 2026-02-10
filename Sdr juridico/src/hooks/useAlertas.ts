/**
 * Hook para gerenciar alertas persistentes
 */

import { useState, useCallback, useEffect } from 'react'
import { alertasService, type AlertaRow } from '@/services/alertasService'

interface UseAlertasState {
  alertas: AlertaRow[]
  naoLidas: number
  loading: boolean
  error: Error | null
}

export function useAlertas() {
  const [state, setState] = useState<UseAlertasState>({
    alertas: [],
    naoLidas: 0,
    loading: false,
    error: null,
  })

  const fetchAlertas = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const [alertas, naoLidas] = await Promise.all([
        alertasService.getAlertas({ limit: 50 }),
        alertasService.getContadorNaoLidas(),
      ])
      setState({ alertas, naoLidas, loading: false, error: null })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
    }
  }, [])

  const marcarLida = useCallback(async (id: string) => {
    try {
      await alertasService.marcarComoLida(id)
      setState((prev) => ({
        ...prev,
        alertas: prev.alertas.map((a) => (a.id === id ? { ...a, lida: true } : a)),
        naoLidas: Math.max(0, prev.naoLidas - 1),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
    }
  }, [])

  const marcarTodasLidas = useCallback(async () => {
    try {
      await alertasService.marcarTodasComoLidas()
      setState((prev) => ({
        ...prev,
        alertas: prev.alertas.map((a) => ({ ...a, lida: true })),
        naoLidas: 0,
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
    }
  }, [])

  // Auto-fetch on mount + poll every 60 seconds
  useEffect(() => {
    fetchAlertas()
    const interval = setInterval(fetchAlertas, 60_000)
    return () => clearInterval(interval)
  }, [fetchAlertas])

  return {
    ...state,
    fetchAlertas,
    marcarLida,
    marcarTodasLidas,
  }
}
