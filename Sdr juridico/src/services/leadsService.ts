/**
 * Serviço de Leads
 * CRUD operations para gerenciar leads
 */

import { supabase, type LeadRow } from '@/lib/supabaseClient'
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
      return data as LeadRow[]
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
      return data as LeadRow
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar lead',
        'database_error'
      )
    }
  },

  // Buscar leads por status
  async getLeadsByStatus(status: LeadRow['status']) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw new AppError(error.message, 'database_error')
      return data as LeadRow[]
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
      const leads = await this.getLeads()
      const now = Date.now()
      return leads.filter((lead) => {
        const base = lead.ultimo_contato || lead.created_at
        if (!base) return false
        const diffDays = (now - new Date(base).getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= 2
      })
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads quentes',
        'database_error'
      )
    }
  },

  // Criar novo lead
  async createLead(lead: Omit<LeadRow, 'id' | 'created_at' | 'org_id' | 'updated_at'>) {
    try {
      const payload = {
        ...lead,
        status: lead.status || 'novo',
        heat: lead.heat || 'frio',
      }
      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data as LeadRow
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao criar lead',
        'database_error'
      )
    }
  },

  // Atualizar lead
  async updateLead(
    id: string,
    updates: Partial<Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>>
  ) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return data as LeadRow
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
