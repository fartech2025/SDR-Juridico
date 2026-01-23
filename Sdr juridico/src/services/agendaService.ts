import { supabase } from '@/lib/supabaseClient'
import type { AgendaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

type DbAgendamentoRow = {
  id: string
  created_at: string
  org_id?: string | null
  title: string
  start_at: string
  end_at: string
  location?: string | null
  description?: string | null
  owner_user_id?: string | null
  lead_id?: string | null
  cliente_id?: string | null
  caso_id?: string | null
  external_provider?: string | null
  external_event_id?: string | null
  meta?: Record<string, any> | null
}

const mapDbAgendamentoToAgenda = (row: DbAgendamentoRow): AgendaRow => {
  const meta = row.meta || {}
  const durationMinutes =
    typeof meta.duracao_minutos === 'number'
      ? meta.duracao_minutos
      : Math.max(
          0,
          Math.round(
            (new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000
          )
        )

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.created_at,
    titulo: row.title,
    descricao: row.description || null,
    tipo: meta.tipo || 'reuniao',
    data_inicio: row.start_at,
    data_fim: row.end_at,
    duracao_minutos: durationMinutes || null,
    cliente_nome: meta.cliente_nome || null,
    cliente_id: row.cliente_id || null,
    caso_id: row.caso_id || null,
    responsavel: meta.responsavel || null,
    local: row.location || null,
    status: meta.status || 'pendente',
    observacoes: meta.observacoes || null,
  }
}

const buildAgendamentoPayload = (evento: Partial<AgendaRow>) => {
  const payload: Partial<DbAgendamentoRow> = {}

  if (evento.titulo !== undefined) payload.title = evento.titulo
  if (evento.descricao !== undefined) payload.description = evento.descricao
  if (evento.data_inicio !== undefined) payload.start_at = evento.data_inicio
  if (evento.data_fim !== undefined) payload.end_at = evento.data_fim
  if (evento.local !== undefined) payload.location = evento.local
  if (evento.cliente_id !== undefined) payload.cliente_id = evento.cliente_id
  if (evento.caso_id !== undefined) payload.caso_id = evento.caso_id

  const meta: Record<string, any> = {}
  if (evento.tipo !== undefined) meta.tipo = evento.tipo
  if (evento.status !== undefined) meta.status = evento.status
  if (evento.observacoes !== undefined) meta.observacoes = evento.observacoes
  if (evento.responsavel !== undefined) meta.responsavel = evento.responsavel
  if (evento.cliente_nome !== undefined) meta.cliente_nome = evento.cliente_nome
  if (evento.duracao_minutos !== undefined) meta.duracao_minutos = evento.duracao_minutos
  if (Object.keys(meta).length > 0) payload.meta = meta

  return payload
}

export const agendaService = {
  /**
   * Busca todos os eventos da agenda
   */
  async getEventos(): Promise<AgendaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('agendamentos')
        .select('*')
        .order('start_at', { ascending: true })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbAgendamentoRow) => mapDbAgendamentoToAgenda(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca um evento especifico
   */
  async getEvento(id: string): Promise<AgendaRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('agendamentos')
        .select('*')
        .eq('id', id)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Evento nao encontrado', 'not_found')

      return mapDbAgendamentoToAgenda(data as DbAgendamentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar evento', 'database_error')
    }
  },

  /**
   * Busca eventos de um periodo especifico
   */
  async getEventosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendaRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('agendamentos')
        .select('*')
        .gte('start_at', dataInicio.toISOString())
        .lte('start_at', dataFim.toISOString())
      const scopedQuery = isFartechAdmin ? query : query.eq('org_id', orgId)
      const { data, error } = await scopedQuery.order('start_at', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbAgendamentoRow) => mapDbAgendamentoToAgenda(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca eventos de hoje
   */
  async getEventosHoje(): Promise<AgendaRow[]> {
    try {
      const hoje = new Date()
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      return this.getEventosPorPeriodo(hoje, amanha)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos de hoje', 'database_error')
    }
  },

  /**
   * Busca eventos de um periodo (semana, mes)
   */
  async getEventosDaSemana(): Promise<AgendaRow[]> {
    try {
      const hoje = new Date()
      const proximoSabado = new Date(hoje)
      proximoSabado.setDate(proximoSabado.getDate() + (7 - hoje.getDay()))

      return this.getEventosPorPeriodo(hoje, proximoSabado)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos da semana', 'database_error')
    }
  },

  /**
   * Busca eventos por tipo
   */
  async getEventosByTipo(tipo: string): Promise<AgendaRow[]> {
    try {
      const eventos = await this.getEventos()
      return eventos.filter((evento) => evento.tipo === tipo)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Cria um novo evento
   */
  async createEvento(
    evento: Omit<AgendaRow, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AgendaRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildAgendamentoPayload(evento)
      if (!isFartechAdmin) {
        payload.org_id = orgId
      }
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([payload])
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar evento', 'database_error')

      const auditOrgId = orgId || (data as DbAgendamentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'create',
        entity: 'agendamentos',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbAgendamentoToAgenda(data as DbAgendamentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar evento', 'database_error')
    }
  },

  /**
   * Atualiza um evento existente
   */
  async updateEvento(
    id: string,
    updates: Partial<Omit<AgendaRow, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AgendaRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildAgendamentoPayload(updates)
      const query = supabase
        .from('agendamentos')
        .update(payload)
        .eq('id', id)
        .select()
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Evento nao encontrado', 'not_found')

      const auditOrgId = orgId || (data as DbAgendamentoRow).org_id || null
      void logAuditChange({
        orgId: auditOrgId,
        action: 'update',
        entity: 'agendamentos',
        entityId: data.id,
        details: { fields: Object.keys(payload) },
      })

      return mapDbAgendamentoToAgenda(data as DbAgendamentoRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar evento', 'database_error')
    }
  },

  /**
   * Deleta um evento
   */
  async deleteEvento(id: string): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)
      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')

      void logAuditChange({
        orgId,
        action: 'delete',
        entity: 'agendamentos',
        entityId: id,
        details: {},
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar evento', 'database_error')
    }
  },

  /**
   * Busca proximos eventos
   */
  async getProximosEventos(dias: number = 7): Promise<AgendaRow[]> {
    try {
      const hoje = new Date()
      const futuro = new Date(hoje)
      futuro.setDate(futuro.getDate() + dias)

      return this.getEventosPorPeriodo(hoje, futuro)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar proximos eventos', 'database_error')
    }
  },

  /**
   * Busca eventos passados
   */
  async getEventosPassados(dias: number = 7): Promise<AgendaRow[]> {
    try {
      const hoje = new Date()
      const passado = new Date(hoje)
      passado.setDate(passado.getDate() - dias)

      return this.getEventosPorPeriodo(passado, hoje)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos passados', 'database_error')
    }
  },

  /**
   * Busca estatisticas de agenda
   */
  async getEstatisticas(): Promise<{
    total: number
    reunioes: number
    ligacoes: number
    visitas: number
    proximos_7_dias: number
  }> {
    try {
      const [eventos, proximos] = await Promise.all([
        this.getEventos(),
        this.getProximosEventos(7),
      ])

      return {
        total: eventos.length,
        reunioes: eventos.filter((e) => e.tipo === 'reuniao').length,
        ligacoes: eventos.filter((e) => e.tipo === 'ligacao').length,
        visitas: eventos.filter((e) => e.tipo === 'visita').length,
        proximos_7_dias: proximos.length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatisticas', 'database_error')
    }
  },
}
