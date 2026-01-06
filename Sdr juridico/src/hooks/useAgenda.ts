import { useCallback, useEffect, useState } from 'react'
import { agendaService } from '@/services/agendaService'
import type { Agenda } from '@/lib/supabaseClient'

interface UseAgendaState {
  eventos: Agenda[]
  loading: boolean
  error: Error | null
}

interface Estatisticas {
  total: number
  reunioes: number
  ligacoes: number
  visitas: number
  proximos_7_dias: number
}

export function useAgenda() {
  const [state, setState] = useState<UseAgendaState>({
    eventos: [],
    loading: true,
    error: null,
  })

  /**
   * Busca todos os eventos
   */
  const fetchEventos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventos()
      setState((prev) => ({ ...prev, eventos, loading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  /**
   * Busca um evento específico
   */
  const fetchEvento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const evento = await agendaService.getEvento(id)
      return evento
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca eventos de um período
   */
  const fetchPorPeriodo = useCallback(async (dataInicio: Date, dataFim: Date) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventosPorPeriodo(dataInicio, dataFim)
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca eventos de hoje
   */
  const fetchHoje = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventosHoje()
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca eventos da semana
   */
  const fetchSemana = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventosDaSemana()
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca eventos por tipo
   */
  const fetchByTipo = useCallback(async (tipo: 'reuniao' | 'ligacao' | 'visita') => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventosByTipo(tipo)
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca próximos eventos
   */
  const fetchProximos = useCallback(async (dias: number = 7) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getProximosEventos(dias)
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca eventos passados
   */
  const fetchPassados = useCallback(async (dias: number = 7) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const eventos = await agendaService.getEventosPassados(dias)
      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Cria um novo evento (com atualização otimista)
   */
  const createEvento = useCallback(async (evento: Omit<Agenda, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoEvento = await agendaService.createEvento(evento)
      setState((prev) => ({ ...prev, eventos: [novoEvento, ...prev.eventos] }))
      return novoEvento
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um evento (com atualização otimista)
   */
  const updateEvento = useCallback(async (id: string, updates: Partial<Omit<Agenda, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const eventoAtualizado = await agendaService.updateEvento(id, updates)
      setState((prev) => ({
        ...prev,
        eventos: prev.eventos.map((e) => (e.id === id ? eventoAtualizado : e)),
      }))
      return eventoAtualizado
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Deleta um evento (com atualização otimista)
   */
  const deleteEvento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await agendaService.deleteEvento(id)
      setState((prev) => ({
        ...prev,
        eventos: prev.eventos.filter((e) => e.id !== id),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Busca estatísticas
   */
  const fetchEstatisticas = useCallback(async (): Promise<Estatisticas> => {
    try {
      return await agendaService.getEstatisticas()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Carrega eventos ao montar componente
   */
  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  return {
    ...state,
    fetchEventos,
    fetchEvento,
    fetchPorPeriodo,
    fetchHoje,
    fetchSemana,
    fetchByTipo,
    fetchProximos,
    fetchPassados,
    createEvento,
    updateEvento,
    deleteEvento,
    fetchEstatisticas,
  }
}
