// src/hooks/useDOU.ts
import { useState, useEffect, useCallback } from 'react'
import { douService } from '@/services/douService'
import type { DOUPublicacao, DOUTermoMonitorado, DOUSearchParams } from '@/types/domain'

export function useDOU(casoId?: string) {
  const [publicacoes, setPublicacoes] = useState<DOUPublicacao[]>([])
  const [termos, setTermos] = useState<DOUTermoMonitorado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [naoLidas, setNaoLidas] = useState(0)

  // Carregar publicações do caso
  const loadPublicacoes = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await douService.getPublicacoesByCaso(id)
      setPublicacoes(data)
      setNaoLidas(data.filter(p => !p.lida).length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar publicações')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar termos monitorados
  const loadTermos = useCallback(async (id?: string) => {
    try {
      const data = await douService.getTermosMonitorados(id)
      setTermos(data)
    } catch (err) {
      console.error('Erro ao carregar termos:', err)
    }
  }, [])

  // Auto-load ao montar
  useEffect(() => {
    if (casoId) {
      loadPublicacoes(casoId)
      loadTermos(casoId)
    }
  }, [casoId, loadPublicacoes, loadTermos])

  // Buscar no DOU via Edge Function
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

  // Marcar como lida
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

  // Adicionar termo
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

  // Remover termo
  const removeTermo = useCallback(async (id: string) => {
    try {
      await douService.removeTermoMonitorado(id)
      setTermos(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Erro ao remover termo:', err)
    }
  }, [])

  // Toggle ativo/inativo
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

  return {
    publicacoes,
    termos,
    loading,
    searchLoading,
    error,
    naoLidas,
    searchDOU,
    marcarLida,
    addTermo,
    removeTermo,
    toggleTermo,
    refresh: () => casoId ? loadPublicacoes(casoId) : undefined,
  }
}
