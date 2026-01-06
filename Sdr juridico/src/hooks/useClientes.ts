import { useCallback, useEffect, useState } from 'react'
import { clientesService } from '@/services/clientesService'
import type { Clientes } from '@/lib/supabaseClient'

interface UseClientesState {
  clientes: Clientes[]
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
      const clientes = await clientesService.getClientes()
      setState((prev) => ({ ...prev, clientes, loading: false }))
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
      return cliente
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
      setState((prev) => ({ ...prev, clientes, loading: false }))
      return clientes
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Cria um novo cliente (com atualização otimista)
   */
  const createCliente = useCallback(async (cliente: Omit<Clientes, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoCliente = await clientesService.createCliente(cliente)
      setState((prev) => ({ ...prev, clientes: [novoCliente, ...prev.clientes] }))
      return novoCliente
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um cliente (com atualização otimista)
   */
  const updateCliente = useCallback(async (id: string, updates: Partial<Omit<Clientes, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const clienteAtualizado = await clientesService.updateCliente(id, updates)
      setState((prev) => ({
        ...prev,
        clientes: prev.clientes.map((c) => (c.id === id ? clienteAtualizado : c)),
      }))
      return clienteAtualizado
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

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
  }
}
