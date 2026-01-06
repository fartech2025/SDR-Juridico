/**
 * Serviço de Leads
 * CRUD operations para gerenciar leads
 */

import { supabase, type Leads } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const leadsService = {
  // Buscar todos os leads
  async getLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads[]
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads',
        'database_error'
      )
    }
  },

  // Buscar lead por ID
  async getLead(id: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar lead',
        'database_error'
      )
    }
  },

  // Buscar leads por status
  async getLeadsByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads[]
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads',
        'database_error'
      )
    }
  },

  // Buscar leads quentes
  async getHotLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('heat', 'quente')
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads[]
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads quentes',
        'database_error'
      )
    }
  },

  // Criar novo lead
  async createLead(lead: Omit<Leads, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao criar lead',
        'database_error'
      )
    }
  },

  // Atualizar lead
  async updateLead(id: string, updates: Partial<Leads>) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data as Leads
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar lead',
        'database_error'
      )
    }
  },

  // Deletar lead
  async deleteLead(id: string) {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao deletar lead',
        'database_error'
      )
    }
  },
}
