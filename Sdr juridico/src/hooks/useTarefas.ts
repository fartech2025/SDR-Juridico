import { useCallback, useEffect, useState } from 'react'
import { tarefasService } from '@/services/tarefasService'
import type { Tarefa } from '@/types/domain'
import { mapTarefaRowToTarefa } from '@/lib/mappers'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface UseTarefasState {
  tarefas: Tarefa[]
  loading: boolean
  error: Error | null
}

type CreateTarefaPayload = {
  title: string
  description?: string | null
  priority?: Tarefa['priority']
  status?: Tarefa['status']
  dueDate?: string | null
  leadId?: string | null
  clienteId?: string | null
  casoId?: string | null
  ownerId?: string
}

const resolveEntidadePayload = (link: {
  leadId?: string | null
  clienteId?: string | null
  casoId?: string | null
}) => {
  if (link.casoId) return { entidade: 'caso' as const, entidade_id: link.casoId }
  if (link.clienteId) return { entidade: 'cliente' as const, entidade_id: link.clienteId }
  if (link.leadId) return { entidade: 'lead' as const, entidade_id: link.leadId }
  return { entidade: null, entidade_id: null }
}

export function useTarefas() {
  const { user, role } = useCurrentUser()
  const [state, setState] = useState<UseTarefasState>({
    tarefas: [],
    loading: true,
    error: null,
  })

  // Determina se o usuário é gestor/admin
  const isGestor = role === 'org_admin' || role === 'fartech_admin'

  const fetchTarefas = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      // Passa userId e isGestor para filtrar por role
      const tarefas = await tarefasService.getTarefas({
        userId: user?.id,
        isGestor,
      })
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
  }, [user?.id, isGestor])

  const fetchTarefasByEntidade = useCallback(async (entidade: 'lead' | 'cliente' | 'caso', entidadeId: string) => {
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

  const createTarefa = useCallback(async (payload: CreateTarefaPayload) => {
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
        due_at: payload.dueDate || null,
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

  const updateTarefa = useCallback(async (id: string, updates: Partial<Tarefa>) => {
    try {
      const linkUpdates =
        'leadId' in updates || 'clienteId' in updates || 'casoId' in updates
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

  const deleteTarefa = useCallback(async (id: string) => {
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

  const submitForConfirmation = useCallback(async (id: string) => {
  const row = await tarefasService.submitForValidation(id)
  const updated = mapTarefaRowToTarefa(row)
  setState((prev) => ({ ...prev, tarefas: prev.tarefas.map((t) => (t.id === id ? updated : t)) }))
  return updated
}, [])

const approveTarefa = useCallback(async (id: string) => {
  const row = await tarefasService.approveTask(id)
  const updated = mapTarefaRowToTarefa(row)
  setState((prev) => ({ ...prev, tarefas: prev.tarefas.map((t) => (t.id === id ? updated : t)) }))
  return updated
}, [])

const rejectTarefa = useCallback(async (id: string, reason: string) => {
  const row = await tarefasService.rejectTask(id, reason)
  const updated = mapTarefaRowToTarefa(row)
  setState((prev) => ({ ...prev, tarefas: prev.tarefas.map((t) => (t.id === id ? updated : t)) }))
  return updated
}, [])

// Restaurar tarefa soft deleted
const restoreTarefa = useCallback(async (id: string) => {
  try {
    setState((prev) => ({ ...prev, error: null }))
    const row = await tarefasService.restoreTarefa(id)
    const restored = mapTarefaRowToTarefa(row)
    setState((prev) => ({
      ...prev,
      tarefas: [restored, ...prev.tarefas],
    }))
    return restored
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro ao restaurar tarefa')
    setState((prev) => ({ ...prev, error: err }))
    throw err
  }
}, [])

// Buscar tarefas deletadas (para gestores)
const fetchDeletedTarefas = useCallback(async () => {
  try {
    const rows = await tarefasService.getDeletedTarefas()
    return rows.map(mapTarefaRowToTarefa)
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro ao buscar tarefas deletadas')
    throw err
  }
}, [])

return {
    ...state,
    isGestor,
    fetchTarefas,
    fetchTarefasByEntidade,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    submitForConfirmation,
    approveTarefa,
    rejectTarefa,
    restoreTarefa,
    fetchDeletedTarefas,
  }
}
