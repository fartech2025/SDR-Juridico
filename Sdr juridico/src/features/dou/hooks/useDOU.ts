// src/features/dou/hooks/useDOU.ts
import { useState, useEffect, useCallback } from 'react'
import { douService } from '../services/douService'
import type { DOUPublicacao, DOUTermoMonitorado, DOUSearchParams } from '@/types/domain'

export function useDOU(casoId?: string) {
  const [publicacoes, setPublicacoes] = useState<DOUPublicacao[]>([])
  const [termos, setTermos] = useState<DOUTermoMonitorado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [naoLidas, setNaoLidas] = useState(0)
  const [monitorarDOU, setMonitorarDOU] = useState(true)
  const [monitorarLoading, setMonitorarLoading] = useState(false)

  const loadPublicacoes = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await douService.getPublicacoesByCaso(id)
      setPublicacoes(data)
      setNaoLidas(data.filter(p => !p.lida).length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar publicacoes')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTermos = useCallback(async (id?: string) => {
    try {
      const data = await douService.getTermosMonitorados(id)
      setTermos(data)
    } catch (err) {
      console.error('Erro ao carregar termos:', err)
    }
  }, [])

  const loadMonitorarDOU = useCallback(async (id: string) => {
    try {
      const status = await douService.getMonitorarDOU(id)
      setMonitorarDOU(status)
    } catch (err) {
      console.error('Erro ao carregar status monitoramento:', err)
    }
  }, [])

  useEffect(() => {
    if (casoId) {
      loadPublicacoes(casoId)
      loadTermos(casoId)
      loadMonitorarDOU(casoId)
    }
  }, [casoId, loadPublicacoes, loadTermos, loadMonitorarDOU])

  const searchDOU = useCallback(async (params: DOUSearchParams) => {
    setSearchLoading(true)
    setError(null)
    try {
      const result = await douService.searchPublicacoes(params)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro na busca'
      setError(msg)
      throw err
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const marcarLida = useCallback(async (id: string) => {
    try {
      await douService.marcarComoLida(id)
      setPublicacoes(prev =>
        prev.map(p => p.id === id ? { ...p, lida: true } : p)
      )
      setNaoLidas(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Erro ao marcar como lida:', err)
    }
  }, [])

  const addTermo = useCallback(async (termo: string, tipo: string, orgId: string) => {
    if (!casoId) return
    try {
      await douService.addTermoMonitorado({ casoId, termo, tipo, orgId })
      await loadTermos(casoId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar termo'
      setError(msg)
      throw err
    }
  }, [casoId, loadTermos])

  const removeTermo = useCallback(async (id: string) => {
    try {
      await douService.removeTermoMonitorado(id)
      setTermos(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Erro ao remover termo:', err)
    }
  }, [])

  const toggleTermo = useCallback(async (id: string, ativo: boolean) => {
    try {
      await douService.toggleTermoAtivo(id, ativo)
      setTermos(prev =>
        prev.map(t => t.id === id ? { ...t, ativo } : t)
      )
    } catch (err) {
      console.error('Erro ao alterar termo:', err)
    }
  }, [])

  const toggleMonitorarDOU = useCallback(async (monitorar: boolean) => {
    if (!casoId) return
    setMonitorarLoading(true)
    try {
      await douService.toggleMonitorarDOU(casoId, monitorar)
      setMonitorarDOU(monitorar)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar monitoramento')
    } finally {
      setMonitorarLoading(false)
    }
  }, [casoId])

  return {
    publicacoes,
    termos,
    loading,
    searchLoading,
    error,
    naoLidas,
    monitorarDOU,
    monitorarLoading,
    searchDOU,
    marcarLida,
    addTermo,
    removeTermo,
    toggleTermo,
    toggleMonitorarDOU,
    refresh: () => casoId ? loadPublicacoes(casoId) : undefined,
  }
}
