import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId, requireOrgId } from '@/lib/org'
import type { ClienteRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const clientesService = {
  /**
   * Busca todos os clientes
   */
  async getClientes(): Promise<ClienteRow[]> {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase.from('clientes').select('*').order('created_at', { ascending: false })
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query

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
      const orgId = await getActiveOrgId()
      let query = supabase.from('clientes').select('*').eq('id', id)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.single()

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
      const orgId = await getActiveOrgId()
      let query = supabase.from('clientes').select().ilike('nome', `%${empresa}%`)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

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
      const orgId = await getActiveOrgId()
      let query = supabase.from('clientes').select().eq('documento', cnpj)
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') throw new AppError(error.message, 'database_error')
      return data || null
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar cliente', 'database_error')
    }
  },

  /**
   * Cria um novo cliente
   */
  async createCliente(cliente: Omit<ClienteRow, 'id' | 'created_at' | 'org_id'>): Promise<ClienteRow> {
    try {
      const orgId = await requireOrgId()
      const payload = {
        ...cliente,
        org_id: orgId,
        tipo: cliente.tipo || 'pf',
        endereco: cliente.endereco || {},
        tags: cliente.tags || [],
      }
      const { data, error } = await supabase
        .from('clientes')
        .insert([payload])
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
      const orgId = await requireOrgId()
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .eq('org_id', orgId)
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
      const orgId = await requireOrgId()
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

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
      const orgId = await getActiveOrgId()
      let query = supabase.from('clientes').select('*, casos(count)')
      if (orgId) query = query.eq('org_id', orgId)
      const { data, error } = await query.order('created_at', { ascending: false })

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
