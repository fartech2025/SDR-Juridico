import { useCallback, useEffect, useState } from 'react'
import { clientesService } from '@/services/clientesService'
import { casosService } from '@/services/casosService'
import type { CasoRow, ClienteRow } from '@/lib/supabaseClient'
import type { Cliente } from '@/types/domain'
import { mapClienteRowToCliente } from '@/lib/mappers'

interface UseClientesState {
  clientes: Cliente[]
  loading: boolean
  error: Error | null
}

export function useClientes() {
  const [state, setState] = useState<UseClientesState>({
    clientes: [],
    loading: true,
    error: null,
  })

  /**
   * Busca todos os clientes
   */
  const fetchClientes = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const [clientes, casos] = await Promise.all([
        clientesService.getClientesComCasos(),
        casosService.getCasos(),
      ])

      const casosPorCliente = new Map<string, CasoRow[]>()
      casos.forEach((caso) => {
        if (!caso.cliente_id) return
        const lista = casosPorCliente.get(caso.cliente_id) || []
        lista.push(caso)
        casosPorCliente.set(caso.cliente_id, lista)
      })

      const mapped = clientes.map((cliente) => {
        const casosCliente = casosPorCliente.get(cliente.id) || []
        const sorted = [...casosCliente].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const latest = sorted[0]
        const caseCount = cliente.casos_count ?? casosCliente.length
        
        const hasCritico = casosCliente.some((caso) =>
          ['alta', 'critica'].includes(String(caso.prioridade))
        )
        const hasAtencao = casosCliente.some((caso) => String(caso.prioridade) === 'media')

        return mapClienteRowToCliente(cliente, {
          caseCount,
          area: latest?.area || 'Geral',
          status: caseCount === 0 ? 'inativo' : hasCritico ? 'em_risco' : 'ativo',
          health: hasCritico ? 'critico' : hasAtencao ? 'atencao' : 'ok',
          lastUpdate: latest?.updated_at || latest?.created_at || cliente.updated_at,
        })
      })

      setState((prev) => ({ ...prev, clientes: mapped, loading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  /**
   * Busca um cliente específico
   */
  const fetchCliente = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const cliente = await clientesService.getCliente(id)
      return mapClienteRowToCliente(cliente, {
        caseCount: 0,
        area: 'Geral',
        status: 'ativo',
        health: 'ok',
        lastUpdate: cliente.updated_at,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca clientes por empresa
   */
  const fetchByEmpresa = useCallback(async (empresa: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const clientes = await clientesService.getClientesByEmpresa(empresa)
      const mapped = clientes.map((cliente) =>
        mapClienteRowToCliente(cliente, {
          caseCount: 0,
          area: 'Geral',
          status: 'ativo',
          health: 'ok',
          lastUpdate: cliente.updated_at,
        })
      )
      setState((prev) => ({ ...prev, clientes: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca cliente por CNPJ
   */
  const fetchByCnpj = useCallback(async (cnpj: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const cliente = await clientesService.getClienteByCnpj(cnpj)
      setState((prev) => ({ ...prev, loading: false }))
      return cliente
        ? mapClienteRowToCliente(cliente, {
            caseCount: 0,
            area: 'Geral',
            status: 'ativo',
            health: 'ok',
            lastUpdate: cliente.updated_at,
          })
        : null
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Cria um novo cliente (com atualização otimista)
   */
  const createCliente = useCallback(async (cliente: Omit<ClienteRow, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoCliente = await clientesService.createCliente(cliente)
      const mapped = mapClienteRowToCliente(novoCliente, {
        caseCount: 0,
        area: 'Geral',
        status: 'ativo',
        health: 'ok',
        lastUpdate: novoCliente.updated_at,
      })
      setState((prev) => ({ ...prev, clientes: [mapped, ...prev.clientes] }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um cliente (com atualização otimista)
   */
  const updateCliente = useCallback(
    async (id: string, updates: Partial<Omit<ClienteRow, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const clienteAtualizado = await clientesService.updateCliente(id, updates)
      const mapped = mapClienteRowToCliente(clienteAtualizado, {
        caseCount: 0,
        area: 'Geral',
        status: 'ativo',
        health: 'ok',
        lastUpdate: clienteAtualizado.updated_at,
      })
      setState((prev) => ({
        ...prev,
        clientes: prev.clientes.map((c) => (c.id === id ? mapped : c)),
      }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
    },
    []
  )

  /**
   * Deleta um cliente (com atualização otimista)
   */
  const deleteCliente = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await clientesService.deleteCliente(id)
      setState((prev) => ({
        ...prev,
        clientes: prev.clientes.filter((c) => c.id !== id),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  const assignClienteAdvogado = useCallback(async (id: string, advogadoId: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await clientesService.assignClienteAdvogado(id, advogadoId)
      await fetchClientes()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [fetchClientes])

  /**
   * Carrega clientes ao montar componente
   */
  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  return {
    ...state,
    fetchClientes,
    fetchCliente,
    fetchByEmpresa,
    fetchByCnpj,
    createCliente,
    updateCliente,
    deleteCliente,
    assignClienteAdvogado,
  }
}
