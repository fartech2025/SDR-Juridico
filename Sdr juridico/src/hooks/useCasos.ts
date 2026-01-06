import { useCallback, useEffect, useState } from 'react'
import { casosService } from '@/services/casosService'
import type { Casos } from '@/lib/supabaseClient'

interface UseCasosState {
  casos: Casos[]
  loading: boolean
  error: Error | null
}

interface Estatisticas {
  total: number
  abertos: number
  em_andamento: number
  resolvidos: number
  fechados: number
  criticos: number
}

export function useCasos() {
  const [state, setState] = useState<UseCasosState>({
    casos: [],
    loading: true,
    error: null,
  })

  /**
   * Busca todos os casos
   */
  const fetchCasos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const casos = await casosService.getCasos()
      setState((prev) => ({ ...prev, casos, loading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  /**
   * Busca um caso específico
   */
  const fetchCaso = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const caso = await casosService.getCaso(id)
      return caso
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca casos por status
   */
  const fetchByStatus = useCallback(async (status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado') => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const casos = await casosService.getCasosByStatus(status)
      setState((prev) => ({ ...prev, casos, loading: false }))
      return casos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca casos críticos
   */
  const fetchCriticos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const casos = await casosService.getCasosCriticos()
      setState((prev) => ({ ...prev, casos, loading: false }))
      return casos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca casos de um cliente
   */
  const fetchByCliente = useCallback(async (clienteId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const casos = await casosService.getCasosByCliente(clienteId)
      setState((prev) => ({ ...prev, casos, loading: false }))
      return casos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Cria um novo caso (com atualização otimista)
   */
  const createCaso = useCallback(async (caso: Omit<Casos, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoCaso = await casosService.createCaso(caso)
      setState((prev) => ({ ...prev, casos: [novoCaso, ...prev.casos] }))
      return novoCaso
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um caso (com atualização otimista)
   */
  const updateCaso = useCallback(async (id: string, updates: Partial<Omit<Casos, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const casoAtualizado = await casosService.updateCaso(id, updates)
      setState((prev) => ({
        ...prev,
        casos: prev.casos.map((c) => (c.id === id ? casoAtualizado : c)),
      }))
      return casoAtualizado
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Deleta um caso (com atualização otimista)
   */
  const deleteCaso = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await casosService.deleteCaso(id)
      setState((prev) => ({
        ...prev,
        casos: prev.casos.filter((c) => c.id !== id),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Muda status de um caso
   */
  const mudarStatus = useCallback(async (id: string, novoStatus: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado') => {
    return updateCaso(id, { status: novoStatus })
  }, [updateCaso])

  /**
   * Muda prioridade de um caso
   */
  const mudarPrioridade = useCallback(async (id: string, novaPrioridade: 'baixa' | 'media' | 'alta' | 'critica') => {
    return updateCaso(id, { prioridade: novaPrioridade })
  }, [updateCaso])

  /**
   * Busca estatísticas
   */
  const fetchEstatisticas = useCallback(async (): Promise<Estatisticas> => {
    try {
      return await casosService.getEstatisticas()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Carrega casos ao montar componente
   */
  useEffect(() => {
    fetchCasos()
  }, [fetchCasos])

  return {
    ...state,
    fetchCasos,
    fetchCaso,
    fetchByStatus,
    fetchCriticos,
    fetchByCliente,
    createCaso,
    updateCaso,
    deleteCaso,
    mudarStatus,
    mudarPrioridade,
    fetchEstatisticas,
  }
}
