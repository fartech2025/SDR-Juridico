/**
 * Servico de Leads
 * CRUD operations para gerenciar leads
 */

import { supabase, type LeadRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'
import { calculateLeadScore, leadRowToScoringInput, type LeadScoreConfig } from '@/services/leadScoringService'
import { casosService } from '@/services/casosService'

type DbLeadRow = {
  id: string
  created_at: string
  org_id?: string | null
  status: string
  canal?: string | null
  nome: string | null
  telefone?: string | null
  email?: string | null
  origem?: string | null
  assunto?: string | null
  resumo?: string | null
  qualificacao?: Record<string, any> | null
  assigned_user_id?: string | null
  cliente_id?: string | null
  remote_id?: string | null
  last_contact_at?: string | null
}

const mapDbLeadStatusToUiStatus = (status?: string | null): LeadRow['status'] => {
  if (status === 'novo') return 'novo'
  if (status === 'em_triagem') return 'em_contato'
  if (status === 'qualificado') return 'qualificado'
  if (status === 'proposta') return 'proposta'
  if (status === 'nao_qualificado') return 'perdido'
  if (status === 'convertido') return 'ganho'
  if (status === 'perdido') return 'perdido'
  return 'novo'
}

const mapUiStatusToDbStatus = (status?: LeadRow['status'] | null): string => {
  if (status === 'em_contato') return 'em_triagem'
  if (status === 'qualificado') return 'qualificado'
  if (status === 'proposta') return 'proposta'
  if (status === 'ganho') return 'convertido'
  if (status === 'perdido') return 'perdido'
  return 'novo'
}

const mapUiStatusToDbFilter = (status: LeadRow['status']) => {
  if (status === 'em_contato') return ['em_triagem']
  if (status === 'qualificado') return ['qualificado']
  if (status === 'proposta') return ['proposta']
  if (status === 'ganho') return ['convertido']
  if (status === 'perdido') return ['perdido', 'nao_qualificado']
  return ['novo']
}

const mapDbLeadToLeadRow = (row: DbLeadRow): LeadRow => {
  const qualificacao = row.qualificacao || {}
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.created_at,
    org_id: row.org_id ?? null,
    nome: row.nome || '',
    email: row.email || '',
    telefone: row.telefone || null,
    empresa: qualificacao.empresa ?? null,
    area: qualificacao.area ?? null,
    origem: row.origem || null,
    status: mapDbLeadStatusToUiStatus(row.status),
    heat: (qualificacao.heat as LeadRow['heat']) || 'frio',
    ultimo_contato: row.last_contact_at || null,
    responsavel: qualificacao.responsavel ?? null,
    observacoes: row.resumo || qualificacao.observacoes || null,
    last_contact_at: row.last_contact_at || null,
    assigned_user_id: row.assigned_user_id || null,
  }
}

const buildLeadPayload = (lead: Partial<LeadRow>, applyDefaults: boolean) => {
  const payload: Partial<DbLeadRow> = {}

  if (lead.nome !== undefined) payload.nome = lead.nome
  if (lead.email !== undefined) payload.email = lead.email
  if (lead.telefone !== undefined) payload.telefone = lead.telefone
  if (lead.origem !== undefined) payload.origem = lead.origem
  if (lead.status !== undefined) payload.status = mapUiStatusToDbStatus(lead.status)
  if (lead.ultimo_contato !== undefined) payload.last_contact_at = lead.ultimo_contato
  if (lead.observacoes !== undefined) payload.resumo = lead.observacoes
  if (lead.area !== undefined && lead.area) payload.assunto = lead.area

  const qualificacao: Record<string, any> = {}
  if (lead.empresa !== undefined) qualificacao.empresa = lead.empresa
  if (lead.area !== undefined) qualificacao.area = lead.area
  if (lead.heat !== undefined) qualificacao.heat = lead.heat
  if (lead.responsavel !== undefined) qualificacao.responsavel = lead.responsavel
  if (lead.observacoes !== undefined) qualificacao.observacoes = lead.observacoes
  if (Object.keys(qualificacao).length > 0) payload.qualificacao = qualificacao

  if (applyDefaults) {
    if (!payload.status) payload.status = 'novo'
    if (!payload.canal) payload.canal = 'whatsapp'
  }

  return payload
}

/**
 * Applies lead scoring to a DbLeadRow and returns updated qualificacao with score data.
 */
const applyScoring = async (row: DbLeadRow, orgId: string | null): Promise<Record<string, any>> => {
  // Count interactions from lead_status_history
  let interactionCount = 0
  try {
    const { count } = await supabase
      .from('lead_status_history')
      .select('id', { count: 'exact', head: true })
      .eq('lead_id', row.id)
    interactionCount = count || 0
  } catch {
    // Non-critical — continue with 0
  }

  // Load org-specific scoring config if available
  let config: LeadScoreConfig | undefined
  if (orgId) {
    try {
      const { data } = await supabase
        .from('lead_scoring_configs')
        .select('config')
        .eq('org_id', orgId)
        .maybeSingle()
      if (data?.config) config = data.config as LeadScoreConfig
    } catch {
      // Use default config
    }
  }

  const scoringInput = leadRowToScoringInput(row, interactionCount)
  const result = calculateLeadScore(scoringInput, config)

  return {
    ...(row.qualificacao || {}),
    score: result.score,
    heat: result.heat,
    scoreFactors: result.factors,
    scoredAt: result.scoredAt,
  }
}

export const leadsService = {
  async assignLeadAdvogado(leadId: string, advogadoId: string, advogadoNome: string) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const currentQuery = supabase
        .from('leads')
        .select('qualificacao')
        .eq('id', leadId)
      const { data: current, error: currentError } = isFartechAdmin
        ? await currentQuery.single()
        : await currentQuery.eq('org_id', orgId).single()

      if (currentError) throw new AppError(currentError.message, 'database_error')

      const qualificacao = {
        ...(current?.qualificacao || {}),
        responsavel: advogadoNome,
        responsavel_id: advogadoId,
      }

      const updateQuery = supabase
        .from('leads')
        .update({ assigned_user_id: advogadoId, qualificacao })
        .eq('id', leadId)
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
      const { data, error } = isFartechAdmin
        ? await updateQuery.single()
        : await updateQuery.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      const auditOrgId = orgId || (data as DbLeadRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'update',
        entity: 'leads',
        entityId: leadId,
        details: { fields: ['assigned_user_id', 'qualificacao'] },
      })
      return mapDbLeadToLeadRow(data as DbLeadRow)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao encaminhar lead',
        'database_error'
      )
    }
  },
  // Buscar todos os leads (apenas não deletados)
  async getLeads() {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('leads')
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbLeadRow) => mapDbLeadToLeadRow(row))
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
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('leads')
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
        .eq('id', id)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapDbLeadToLeadRow(data as DbLeadRow)
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
      const statusFilter = mapUiStatusToDbFilter(status)
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('leads')
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
        .in('status', statusFilter)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbLeadRow) => mapDbLeadToLeadRow(row))
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
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildLeadPayload(lead, true)
      if (!isFartechAdmin) {
        payload.org_id = orgId
      }
      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      const createdRow = data as DbLeadRow
      const auditOrgId = orgId || createdRow.org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'create',
        entity: 'leads',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      // Apply scoring to the newly created lead
      try {
        const scoredQualificacao = await applyScoring(createdRow, auditOrgId)
        const { data: scored } = await supabase
          .from('leads')
          .update({ qualificacao: scoredQualificacao })
          .eq('id', createdRow.id)
          .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
          .single()
        if (scored) return mapDbLeadToLeadRow(scored as DbLeadRow)
      } catch {
        // Scoring failure is non-critical
      }

      return mapDbLeadToLeadRow(createdRow)
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
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildLeadPayload(updates, false)
      const query = supabase
        .from('leads')
        .update(payload)
        .eq('id', id)
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
      const { data, error } = isFartechAdmin
        ? await query.single()
        : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      const updatedRow = data as DbLeadRow
      const auditOrgId = orgId || updatedRow.org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'update',
        entity: 'leads',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      // Re-score the lead after update
      try {
        const scoredQualificacao = await applyScoring(updatedRow, auditOrgId)
        const { data: scored } = await supabase
          .from('leads')
          .update({ qualificacao: scoredQualificacao })
          .eq('id', updatedRow.id)
          .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
          .single()
        if (scored) return mapDbLeadToLeadRow(scored as DbLeadRow)
      } catch {
        // Scoring failure is non-critical
      }

      return mapDbLeadToLeadRow(updatedRow)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar lead',
        'database_error'
      )
    }
  },

  // Deletar lead (Soft Delete)
  async deleteLead(id: string) {
    try {
      const { orgId, isFartechAdmin, userId } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      // Soft delete: apenas marca deleted_at
      const query = supabase
        .from('leads')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: userId 
        })
        .eq('id', id)
        .select('id')
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      void logAuditChange({
        orgId,
        action: 'soft_delete',
        entity: 'leads',
        entityId: id,
        details: {},
      })
      return data
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao deletar lead',
        'database_error'
      )
    }
  },

  // Restaurar lead soft deleted
  async restoreLead(id: string) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('leads')
        .update({ 
          deleted_at: null,
          deleted_by: null 
        })
        .eq('id', id)
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at'
        )
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      void logAuditChange({
        orgId,
        action: 'restore',
        entity: 'leads',
        entityId: id,
        details: {},
      })
      return mapDbLeadToLeadRow(data as DbLeadRow)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao restaurar lead',
        'database_error'
      )
    }
  },

  // Buscar leads deletados (para lixeira)
  async getDeletedLeads() {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('leads')
        .select(
          'id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at, deleted_at'
        )
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbLeadRow) => mapDbLeadToLeadRow(row))
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar leads deletados',
        'database_error'
      )
    }
  },

  // Converter lead em caso
  async convertLeadToCaso(
    leadId: string,
    casoOverrides?: { titulo?: string; area?: string; valor?: number; descricao?: string }
  ) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      // 1. Fetch the lead
      const query = supabase
        .from('leads')
        .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
        .eq('id', leadId)
      const { data: leadData, error: leadError } = isFartechAdmin
        ? await query.single()
        : await query.eq('org_id', orgId).single()

      if (leadError) throw new AppError(leadError.message, 'database_error')
      const lead = leadData as DbLeadRow
      const qualificacao = lead.qualificacao || {}

      // 2. Create caso from lead data
      const caso = await casosService.createCaso({
        titulo: casoOverrides?.titulo || `Caso - ${lead.nome || 'Sem nome'}`,
        area: casoOverrides?.area || qualificacao.area || lead.assunto || '',
        valor: casoOverrides?.valor ?? qualificacao.estimatedValue ?? null,
        descricao: casoOverrides?.descricao || lead.resumo || null,
        lead_id: leadId,
        cliente_id: lead.cliente_id || null,
        status: 'ativo',
        stage: 'triagem',
        prioridade: 'media',
      } as any)

      // 3. Update lead to convertido + store caso_id
      const updatedQualificacao = {
        ...qualificacao,
        caso_id: caso.id,
        converted_at: new Date().toISOString(),
      }
      const updateQuery = supabase
        .from('leads')
        .update({
          status: 'convertido',
          qualificacao: updatedQualificacao,
        })
        .eq('id', leadId)
        .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
      const { data: updatedLead, error: updateError } = isFartechAdmin
        ? await updateQuery.single()
        : await updateQuery.eq('org_id', orgId).single()

      if (updateError) throw new AppError(updateError.message, 'database_error')

      // 4. Audit log
      void logAuditChange({
        orgId: orgId || lead.org_id || null,
        action: 'convert',
        entity: 'leads',
        entityId: leadId,
        details: { caso_id: caso.id },
      })

      return {
        lead: mapDbLeadToLeadRow(updatedLead as DbLeadRow),
        caso,
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao converter lead em caso',
        'database_error'
      )
    }
  },

  // Re-score um lead manualmente
  async rescoreLead(id: string) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('leads')
        .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
        .eq('id', id)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      const row = data as DbLeadRow

      const scoredQualificacao = await applyScoring(row, orgId || row.org_id || null)
      const updateQuery = supabase
        .from('leads')
        .update({ qualificacao: scoredQualificacao })
        .eq('id', id)
        .select('id, created_at, org_id, status, canal, nome, telefone, email, origem, assunto, resumo, qualificacao, assigned_user_id, cliente_id, remote_id, last_contact_at')
      const { data: scored, error: scoreError } = isFartechAdmin
        ? await updateQuery.single()
        : await updateQuery.eq('org_id', orgId).single()

      if (scoreError) throw new AppError(scoreError.message, 'database_error')
      return mapDbLeadToLeadRow(scored as DbLeadRow)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao re-pontuar lead',
        'database_error'
      )
    }
  },

  // Deletar permanentemente (hard delete)
  async hardDeleteLead(id: string) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase.from('leads').delete().eq('id', id)
      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      void logAuditChange({
        orgId,
        action: 'hard_delete',
        entity: 'leads',
        entityId: id,
        details: {},
      })
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao deletar permanentemente lead',
        'database_error'
      )
    }
  },
}
