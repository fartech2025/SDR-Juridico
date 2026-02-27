import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { financeiroService } from '@/services/financeiroService'
import type {
  TimesheetEntry,
  TimesheetCreateInput,
  TimesheetUpdateInput,
  FaturamentoResult,
} from '@/types/timesheet'

// ── Tipo interno do DB ─────────────────────────────────────────────────────────
type DbTimesheetRow = {
  id: string
  org_id: string
  responsavel_user_id: string
  caso_id: string | null
  data: string
  horas: number
  descricao: string
  taxa_horaria: number
  valor_total: number
  tipo: 'billable' | 'non_billable'
  status: 'rascunho' | 'aprovado' | 'faturado'
  lancamento_id: string | null
  created_at: string
  updated_at: string
  // JOINs opcionais
  responsavel?: { nome_completo: string; role?: string } | null
  caso?: { titulo: string } | null
}

// ── Mapper DB → Domínio ────────────────────────────────────────────────────────
function mapRowToEntry(row: DbTimesheetRow): TimesheetEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    responsavelUserId: row.responsavel_user_id,
    responsavelNome: row.responsavel?.nome_completo,
    responsavelRole: row.responsavel?.role,
    casoId: row.caso_id ?? undefined,
    casoTitulo: row.caso?.titulo ?? undefined,
    data: row.data,
    horas: Number(row.horas),
    descricao: row.descricao,
    taxaHoraria: Number(row.taxa_horaria),
    valorTotal: Number(row.valor_total),
    tipo: row.tipo,
    status: row.status,
    lancamentoId: row.lancamento_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Service ────────────────────────────────────────────────────────────────────
export const timesheetService = {
  // Listar todas as entradas da org (com JOINs em usuarios e casos)
  async listEntries(): Promise<TimesheetEntry[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      let query = supabase
        .from('timesheet_entries')
        .select(`
          *,
          responsavel:usuarios!timesheet_entries_responsavel_user_id_fkey(nome_completo),
          caso:casos!timesheet_entries_caso_id_fkey(titulo)
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (orgId) query = query.eq('org_id', orgId)

      const { data, error } = await query
      if (error) throw new AppError(error.message, 'database_error')

      return (data ?? []).map((row) => mapRowToEntry(row as DbTimesheetRow))
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao listar entradas de timesheet', 'database_error')
    }
  },

  // Criar nova entrada (status inicial: rascunho)
  async createEntry(input: TimesheetCreateInput): Promise<TimesheetEntry> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert({
          org_id: orgId,
          responsavel_user_id: input.responsavelUserId,
          caso_id: input.casoId ?? null,
          data: input.data,
          horas: input.horas,
          descricao: input.descricao,
          taxa_horaria: input.taxaHoraria,
          tipo: input.tipo,
          status: 'rascunho',
        })
        .select(`
          *,
          responsavel:usuarios!timesheet_entries_responsavel_user_id_fkey(nome_completo),
          caso:casos!timesheet_entries_caso_id_fkey(titulo)
        `)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapRowToEntry(data as DbTimesheetRow)
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao criar entrada de timesheet', 'database_error')
    }
  },

  // Atualizar entrada (somente rascunhos — validado pelo service)
  async updateEntry(id: string, updates: TimesheetUpdateInput): Promise<TimesheetEntry> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      // Verifica se é rascunho antes de editar
      const { data: current } = await supabase
        .from('timesheet_entries')
        .select('status')
        .eq('id', id)
        .eq('org_id', orgId)
        .single()

      if (!current) throw new AppError('Entrada nao encontrada', 'database_error')
      if (current.status !== 'rascunho') {
        throw new AppError('Apenas entradas em rascunho podem ser editadas', 'validation_error')
      }

      const dbUpdates: Record<string, unknown> = {}
      if (updates.data !== undefined) dbUpdates.data = updates.data
      if (updates.horas !== undefined) dbUpdates.horas = updates.horas
      if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao
      if (updates.taxaHoraria !== undefined) dbUpdates.taxa_horaria = updates.taxaHoraria
      if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo

      const { data, error } = await supabase
        .from('timesheet_entries')
        .update(dbUpdates)
        .eq('id', id)
        .eq('org_id', orgId)
        .select(`
          *,
          responsavel:usuarios!timesheet_entries_responsavel_user_id_fkey(nome_completo),
          caso:casos!timesheet_entries_caso_id_fkey(titulo)
        `)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      return mapRowToEntry(data as DbTimesheetRow)
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao atualizar entrada de timesheet', 'database_error')
    }
  },

  // Hard delete — somente rascunhos (validado pelo service)
  async deleteEntry(id: string): Promise<void> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const { data: current } = await supabase
        .from('timesheet_entries')
        .select('status')
        .eq('id', id)
        .eq('org_id', orgId)
        .single()

      if (!current) throw new AppError('Entrada nao encontrada', 'database_error')
      if (current.status !== 'rascunho') {
        throw new AppError('Apenas entradas em rascunho podem ser excluidas', 'validation_error')
      }

      const { error } = await supabase
        .from('timesheet_entries')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao excluir entrada de timesheet', 'database_error')
    }
  },

  // Aprovar entradas selecionadas (rascunho → aprovado)
  async aprovarEntradas(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const { error } = await supabase
        .from('timesheet_entries')
        .update({ status: 'aprovado' })
        .in('id', ids)
        .eq('org_id', orgId)
        .eq('status', 'rascunho')

      if (error) throw new AppError(error.message, 'database_error')
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao aprovar entradas', 'database_error')
    }
  },

  // Faturar período: agrupa entradas aprovadas por caso, cria lançamentos em financeiro_lancamentos
  // e marca as entradas como 'faturado' com o lancamento_id correspondente.
  async faturarPeriodo(entries: TimesheetEntry[]): Promise<FaturamentoResult> {
    const aprovadas = entries.filter((e) => e.status === 'aprovado' && e.tipo === 'billable')
    if (aprovadas.length === 0) {
      return { lancamentosIds: [], totalFaturado: 0, entradasFaturadas: 0 }
    }

    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      // Agrupa por caso (ou "Geral" para entradas sem caso)
      const grupos = aprovadas.reduce<Record<string, TimesheetEntry[]>>((acc, entry) => {
        const key = entry.casoId ?? '__geral__'
        if (!acc[key]) acc[key] = []
        acc[key].push(entry)
        return acc
      }, {})

      const lancamentosIds: string[] = []
      const hoje = new Date().toISOString().slice(0, 10)

      for (const [casoId, grupoEntries] of Object.entries(grupos)) {
        const totalHoras = grupoEntries.reduce((s, e) => s + e.horas, 0)
        const totalValor = grupoEntries.reduce((s, e) => s + e.valorTotal, 0)
        const casoTitulo = grupoEntries[0].casoTitulo ?? 'Geral'
        const responsavelId = grupoEntries[0].responsavelUserId

        // Cria lançamento de honorários no módulo Financeiro
        const lancamentos = await financeiroService.createTransaction({
          type: 'receita',
          category: 'Honorários',
          description: `Honorários — ${casoTitulo} (${totalHoras.toFixed(1)}h)`,
          amount: totalValor,
          dueDate: hoje,
          casoId: casoId !== '__geral__' ? casoId : undefined,
          responsavelUserId: responsavelId,
          recurring: false,
        })

        const lancamentoId = lancamentos[0]?.id
        if (!lancamentoId) continue

        lancamentosIds.push(lancamentoId)

        // Marca todas as entradas do grupo como faturadas
        const idsDoGrupo = grupoEntries.map((e) => e.id)
        await supabase
          .from('timesheet_entries')
          .update({ status: 'faturado', lancamento_id: lancamentoId })
          .in('id', idsDoGrupo)
          .eq('org_id', orgId)
      }

      return {
        lancamentosIds,
        totalFaturado: aprovadas.reduce((s, e) => s + e.valorTotal, 0),
        entradasFaturadas: aprovadas.length,
      }
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao faturar periodo', 'database_error')
    }
  },
}
