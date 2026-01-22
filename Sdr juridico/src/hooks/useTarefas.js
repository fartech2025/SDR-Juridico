import { useCallback, useEffect, useState } from 'react'
import { tarefasService } from '@/services/tarefasService'
import { mapTarefaRowToTarefa } from '@/lib/mappers'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function useTarefas() {
  const { user } = useCurrentUser()
  const [state, setState] = useState({
    tarefas: [],
    loading: true,
    error: null,
  })

  const fetchTarefas = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const tarefas = await tarefasService.getTarefas()
      setState((prev) => ({
        ...prev,
        tarefas: tarefas.map(mapTarefaRowToTarefa),
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

  const fetchTarefasByEntidade = useCallback(async (entidade, entidadeId) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const tarefas = await tarefasService.getTarefasByEntidade(entidade, entidadeId)
      const mapped = tarefas.map(mapTarefaRowToTarefa)
      setState((prev) => ({ ...prev, tarefas: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  const createTarefa = useCallback(async (payload) => {
    try {
      const ownerId = payload.ownerId || user?.id
      if (!ownerId) {
        throw new Error('Usuario nao autenticado')
      }
      setState((prev) => ({ ...prev, error: null }))
      const tarefa = await tarefasService.createTarefa({
        usuario_id: ownerId,
        titulo: payload.title,
        descricao: payload.description || null,
        prioridade: payload.priority || 'normal',
        status: payload.status || 'pendente',
        data_vencimento: payload.dueDate || null,
        lead_id: payload.leadId || null,
        cliente_id: payload.clienteId || null,
        caso_id: payload.casoId || null,
        responsavel_ids: payload.responsavelIds || [ownerId],
        concluido_em: null,
      })
      const mapped = mapTarefaRowToTarefa(tarefa)
      setState((prev) => ({ ...prev, tarefas: [mapped, ...prev.tarefas] }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [user?.id])

  const updateTarefa = useCallback(async (id, updates) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const tarefa = await tarefasService.updateTarefa(id, {
        titulo: updates.title,
        descricao: updates.description,
        prioridade: updates.priority,
        status: updates.status,
        data_vencimento: updates.dueDate ?? null,
        lead_id: updates.leadId ?? null,
        cliente_id: updates.clienteId ?? null,
        caso_id: updates.casoId ?? null,
        responsavel_ids: updates.responsavelIds ?? undefined,
        usuario_id: updates.ownerId ?? undefined,
        concluido_em: updates.completedAt ?? undefined,
      })
      const mapped = mapTarefaRowToTarefa(tarefa)
      setState((prev) => ({
        ...prev,
        tarefas: prev.tarefas.map((item) => (item.id === id ? mapped : item)),
      }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  const deleteTarefa = useCallback(async (id) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await tarefasService.deleteTarefa(id)
      setState((prev) => ({
        ...prev,
        tarefas: prev.tarefas.filter((item) => item.id !== id),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  useEffect(() => {
    fetchTarefas()
  }, [fetchTarefas])

  return {
    ...state,
    fetchTarefas,
    fetchTarefasByEntidade,
    createTarefa,
    updateTarefa,
    deleteTarefa,
  }
}
