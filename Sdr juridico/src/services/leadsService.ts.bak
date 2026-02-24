/**
 * Serviço de Leads
 * CRUD operations para gerenciar leads
 */

import { supabase, type LeadRow } from '@/lib/supabaseClient'
import type { LeadStatus } from '@/types/domain'
import { AppError } from '@/utils/errors'

const uiStatusBySqlStatus: Record<LeadRow['status'], LeadStatus> = {
  novo: 'novo',
  em_triagem: 'em_contato',
  qualificado: 'qualificado',
  nao_qualificado: 'perdido',
  convertido: 'ganho',
  perdido: 'perdido',
}

export const leadsService = {
  // Buscar todos os leads
  async getLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*, cliente:clientes(nome), assigned_user:profiles!assigned_user_id(nome)')
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
        .select('*, cliente:clientes(nome), assigned_user:profiles!assigned_user_id(nome)')
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
        .select('*, cliente:clientes(nome), assigned_user:profiles!assigned_user_id(nome)')
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
      return leads.filter((lead) => {
        if (!lead.qualificacao || typeof lead.qualificacao !== 'object') return false
        return (lead.qualificacao as { heat?: string }).heat === 'quente'
      })
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads quentes',
        'database_error'
      )
    }
  },

  // Criar novo lead
  async createLead(lead: Omit<LeadRow, 'id' | 'created_at'>) {
    try {
      const existingQualificacao =
        lead.qualificacao && typeof lead.qualificacao === 'object'
          ? (lead.qualificacao as Record<string, unknown>)
          : {}
      const qualStatus =
        (existingQualificacao.status as LeadStatus | undefined) ??
        uiStatusBySqlStatus[lead.status]
      const qualHeat =
        (existingQualificacao.heat as string | undefined) ?? 'morno'

      const payload = {
        ...lead,
        qualificacao: {
          ...existingQualificacao,
          status: qualStatus,
          heat: qualHeat,
        },
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
