import { useCallback, useEffect, useState } from 'react'
import { tarefasService } from '@/services/tarefasService'
import { mapTarefaRowToTarefa } from '@/lib/mappers'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const resolveEntidadePayload = (link) => {
  if (link.casoId) return { entidade: 'caso', entidade_id: link.casoId }
  if (link.clienteId) return { entidade: 'cliente', entidade_id: link.clienteId }
  if (link.leadId) return { entidade: 'lead', entidade_id: link.leadId }
  return { entidade: null, entidade_id: null }
}

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
      const entidadePayload = resolveEntidadePayload({
        leadId: payload.leadId ?? null,
        clienteId: payload.clienteId ?? null,
        casoId: payload.casoId ?? null,
      })
      setState((prev) => ({ ...prev, error: null }))
      const tarefa = await tarefasService.createTarefa({
        assigned_user_id: ownerId,
        titulo: payload.title,
        descricao: payload.description || null,
        priority: payload.priority || 'normal',
        status: payload.status || 'pendente',
        due_at: payload.dueDate || null,
        completed_at: null,
        ...entidadePayload,
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
      const linkUpdates = 'leadId' in updates || 'clienteId' in updates || 'casoId' in updates
      const entidadePayload = linkUpdates
        ? resolveEntidadePayload({
            leadId: updates.leadId ?? null,
            clienteId: updates.clienteId ?? null,
            casoId: updates.casoId ?? null,
          })
        : {}
      setState((prev) => ({ ...prev, error: null }))
      const tarefa = await tarefasService.updateTarefa(id, {
        titulo: updates.title,
        descricao: updates.description,
        priority: updates.priority,
        status: updates.status,
        due_at: updates.dueDate,
        assigned_user_id: updates.ownerId ?? undefined,
        completed_at: updates.completedAt ?? undefined,
        ...entidadePayload,
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
