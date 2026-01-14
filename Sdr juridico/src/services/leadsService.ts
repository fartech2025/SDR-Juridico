/**
 * Serviço de Leads
 * CRUD operations para gerenciar leads
 */

import { supabase, type LeadRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { getActiveOrgId } from '@/lib/org'

export const leadsService = {
  // Buscar todos os leads
  async getLeads() {
    try {
      const orgId = await getActiveOrgId()
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Filtrar por org_id se não for Fartech Admin
      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query

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
      const orgId = await getActiveOrgId()
      let query = supabase
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
      
      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query
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
        const base = lead.last_contact_at || lead.created_at
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
  async createLead(lead: Omit<LeadRow, 'id' | 'created_at' | 'org_id'>) {
    try {
      const payload = {
        ...lead,
        canal: lead.canal || 'whatsapp',
        qualificacao: lead.qualificacao || {},
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
  async updateLead(id: string, updates: Partial<Omit<LeadRow, 'id' | 'created_at'>>) {
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
