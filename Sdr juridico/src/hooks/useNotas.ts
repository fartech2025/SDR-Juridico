import { useCallback, useEffect, useState } from 'react'
import { notasService } from '@/services/notasService'
import type { TimelineEvent } from '@/types/domain'
import { mapTimelineRowToTimelineEvent } from '@/lib/mappers'

interface UseNotasState {
  notas: TimelineEvent[]
  loading: boolean
  error: Error | null
}

type CreateNotaPayload = {
  entidade: string
  entidadeId: string
  texto: string
  createdBy?: string | null
  tags?: string[]
}

export function useNotas() {
  const [state, setState] = useState<UseNotasState>({
    notas: [],
    loading: true,
    error: null,
  })

  const fetchNotas = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const notas = await notasService.getNotas()
      setState((prev) => ({
        ...prev,
        notas: notas.map(mapTimelineRowToTimelineEvent),
        loading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  const fetchNotasByEntidade = useCallback(async (entidade: string, entidadeId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const notas = await notasService.getNotasByEntidade(entidade, entidadeId)
      const mapped = notas.map(mapTimelineRowToTimelineEvent)
      setState((prev) => ({ ...prev, notas: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  const createNota = useCallback(async (payload: CreateNotaPayload) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const nota = await notasService.createNota({
        entidade: payload.entidade,
        entidade_id: payload.entidadeId,
        texto: payload.texto,
        created_by: payload.createdBy || null,
        tags: payload.tags || [],
      })
      const mapped = mapTimelineRowToTimelineEvent(nota)
      setState((prev) => ({ ...prev, notas: [mapped, ...prev.notas] }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  useEffect(() => {
    fetchNotas()
  }, [fetchNotas])

  return {
    ...state,
    fetchNotas,
    fetchNotasByEntidade,
    createNota,
  }
}
