import { supabase } from '@/lib/supabaseClient'
import type { ClienteRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const clientesService = {
  /**
   * Busca todos os clientes
   */
  async getClientes(): Promise<ClienteRow[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, owner_user:profiles!owner_user_id(nome)')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },

  /**
   * Busca um cliente específico
   */
  async getCliente(id: string): Promise<ClienteRow> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, owner_user:profiles!owner_user_id(nome)')
        .eq('id', id)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Cliente não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar cliente', 'database_error')
    }
  },

  /**
   * Busca clientes por empresa
   */
  async getClientesByEmpresa(empresa: string): Promise<ClienteRow[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select()
        .ilike('nome', `%${empresa}%`)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },

  /**
   * Busca cliente por CNPJ
   */
  async getClienteByCnpj(cnpj: string): Promise<ClienteRow | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select()
        .eq('documento', cnpj)
        .single()

      if (error && error.code !== 'PGRST116') throw new AppError(error.message, 'database_error')
      return data || null
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar cliente', 'database_error')
    }
  },

  /**
   * Cria um novo cliente
   */
  async createCliente(cliente: Omit<ClienteRow, 'id' | 'created_at'>): Promise<ClienteRow> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar cliente', 'database_error')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar cliente', 'database_error')
    }
  },

  /**
   * Atualiza um cliente existente
   */
  async updateCliente(
    id: string,
    updates: Partial<Omit<ClienteRow, 'id' | 'created_at' | 'org_id'>>
  ): Promise<ClienteRow> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Cliente não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar cliente', 'database_error')
    }
  },

  /**
   * Deleta um cliente
   */
  async deleteCliente(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar cliente', 'database_error')
    }
  },

  /**
   * Busca clientes com contagem de casos
   */
  async getClientesComCasos(): Promise<(ClienteRow & { casos_count: number })[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, casos(count)')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')

      return (data || []).map((client: any) => ({
        ...client,
        casos_count: client.casos?.[0]?.count || 0,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },
}
