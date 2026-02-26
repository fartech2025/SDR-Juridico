import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import type {
  FinanceCreateTransactionInput,
  FinanceResponsavel,
  FinanceTransaction,
  FinanceTransactionStatus,
} from '@/types/financeiro'

type DbFinanceRow = {
  id: string
  org_id: string
  tipo: 'receita' | 'despesa'
  status: FinanceTransactionStatus
  categoria: string
  descricao: string
  valor: number
  vencimento: string
  pago_em?: string | null
  cliente?: string | null
  caso_id?: string | null
  responsavel_user_id?: string | null
  recorrente?: boolean | null
  created_at: string
  updated_at: string
}

type DbUsuarioRow = {
  id: string
  nome_completo: string | null
}

type DbOrgMemberRow = {
  user_id: string
  role: string | null
  org_id?: string | null
}

const normalizeResponsavelRole = (role: string | null | undefined): 'advogado' | 'gestor' => {
  if (role === 'advogado') return 'advogado'
  return 'gestor'
}

const mapDbToFinance = (
  row: DbFinanceRow,
  responsavelInfo?: Map<string, { nome: string; role: 'advogado' | 'gestor' }>,
): FinanceTransaction => {
  const responsavel = row.responsavel_user_id ? responsavelInfo?.get(row.responsavel_user_id) : undefined
  return {
    id: row.id,
    type: row.tipo,
    status: row.status,
    category: row.categoria,
    description: row.descricao,
    amount: row.valor,
    dueDate: row.vencimento,
    paidDate: row.pago_em || undefined,
    cliente: row.cliente || undefined,
    casoId: row.caso_id || undefined,
    responsavelUserId: row.responsavel_user_id || undefined,
    responsavelNome: responsavel?.nome,
    responsavelRole: responsavel?.role,
    recurring: row.recorrente || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const mapFinanceToDbPayload = (
  input: Partial<FinanceTransaction> & Pick<FinanceCreateTransactionInput, 'type' | 'category' | 'description' | 'amount' | 'dueDate'>,
) => ({
  tipo: input.type,
  status: input.status || 'previsto',
  categoria: input.category,
  descricao: input.description,
  valor: input.amount,
  vencimento: input.dueDate,
  pago_em: input.paidDate || null,
  cliente: input.cliente || null,
  caso_id: input.casoId || null,
  responsavel_user_id: input.responsavelUserId || null,
  recorrente: input.recurring || false,
})

const addMonths = (dateValue: string, months: number) => {
  const date = new Date(dateValue)
  const originalDay = date.getDate()
  date.setMonth(date.getMonth() + months)
  if (date.getDate() < originalDay) {
    date.setDate(0)
  }
  return date.toISOString().slice(0, 10)
}

const resolveResponsavelInfo = async (
  userIds: string[],
  orgId?: string | null,
): Promise<Map<string, { nome: string; role: 'advogado' | 'gestor' }>> => {
  if (userIds.length === 0) return new Map()

  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, nome_completo')
    .in('id', userIds)

  if (usuariosError) throw new AppError(usuariosError.message, 'database_error')

  let membersQuery = supabase
    .from('org_members')
    .select('user_id, role, org_id')
    .in('user_id', userIds)
    .eq('ativo', true)

  if (orgId) {
    membersQuery = membersQuery.eq('org_id', orgId)
  }

  const { data: members, error: membersError } = await membersQuery

  if (membersError) throw new AppError(membersError.message, 'database_error')

  const nomeMap = new Map<string, string>()
  ;((usuarios || []) as DbUsuarioRow[]).forEach((item) => {
    nomeMap.set(item.id, item.nome_completo || 'Usuario')
  })

  const roleMap = new Map<string, 'advogado' | 'gestor'>()
  ;((members || []) as DbOrgMemberRow[]).forEach((member) => {
    const normalizedRole = normalizeResponsavelRole(member.role)
    const existing = roleMap.get(member.user_id)
    if (!existing || existing === 'gestor') {
      roleMap.set(member.user_id, normalizedRole)
    }
  })

  const out = new Map<string, { nome: string; role: 'advogado' | 'gestor' }>()
  userIds.forEach((id) => {
    out.set(id, {
      nome: nomeMap.get(id) || 'Usuario',
      role: roleMap.get(id) || 'gestor',
    })
  })

  return out
}

export const financeiroService = {
  async listResponsaveis(): Promise<FinanceResponsavel[]> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) return []

      const { data: members, error: memberError } = await supabase
        .from('org_members')
        .select('user_id, role')
        .eq('org_id', orgId)
        .eq('ativo', true)
        .in('role', ['advogado', 'gestor', 'admin'])

      if (memberError) throw new AppError(memberError.message, 'database_error')
      const userIds = (members || []).map((item) => item.user_id).filter(Boolean)
      if (userIds.length === 0) return []

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome_completo')
        .in('id', userIds)

      if (usuariosError) throw new AppError(usuariosError.message, 'database_error')

      const nameMap = new Map<string, string>()
      ;((usuarios || []) as DbUsuarioRow[]).forEach((usuario) => {
        nameMap.set(usuario.id, usuario.nome_completo || 'Usuario')
      })

      return ((members || []) as Array<{ user_id: string; role: string | null }>)
        .map((member) => ({
          id: member.user_id,
          nome: nameMap.get(member.user_id) || 'Usuario',
          role: normalizeResponsavelRole(member.role),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao listar responsaveis financeiros', 'database_error')
    }
  },

  async listTransactions() {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      let query = supabase
        .from('financeiro_lancamentos')
        .select('*')
        .order('vencimento', { ascending: false })

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query
      if (error) throw new AppError(error.message, 'database_error')

      const rows = (data || []) as DbFinanceRow[]
      const userIds = [...new Set(rows.map((row) => row.responsavel_user_id).filter((value): value is string => Boolean(value)))]
      const responsavelInfo = await resolveResponsavelInfo(userIds, orgId)

      return rows.map((row) => mapDbToFinance(row, responsavelInfo))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao listar lancamentos financeiros', 'database_error')
    }
  },

  async createTransaction(input: FinanceCreateTransactionInput & { status?: FinanceTransactionStatus }) {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const recurrenceCount = input.recurring ? Math.max(1, Math.min(input.recurrenceCount || 2, 36)) : 1
      const recurrenceIntervalMonths = Math.max(1, Math.min(input.recurrenceIntervalMonths || 1, 12))

      const { data, error } = await supabase
        .from('financeiro_lancamentos')
        .insert(
          Array.from({ length: recurrenceCount }, (_, index) => ({
            ...mapFinanceToDbPayload({
              ...input,
              description:
                recurrenceCount > 1
                  ? `${input.description} - Parcela ${index + 1}/${recurrenceCount}`
                  : input.description,
              dueDate: addMonths(input.dueDate, index * recurrenceIntervalMonths),
              status: input.status,
              recurring: input.recurring || recurrenceCount > 1,
            }),
            org_id: orgId,
          })),
        )
        .select('*')
      

      if (error) throw new AppError(error.message, 'database_error')

      const rows = (data || []) as DbFinanceRow[]
      const userIds = [...new Set(rows.map((row) => row.responsavel_user_id).filter((value): value is string => Boolean(value)))]
      const responsavelInfo = await resolveResponsavelInfo(userIds, orgId)
      return rows.map((row) => mapDbToFinance(row, responsavelInfo))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar lancamento financeiro', 'database_error')
    }
  },

  async updateTransaction(id: string, updates: Partial<Omit<FinanceTransaction, 'id' | 'createdAt'>>) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const dbUpdates: Record<string, unknown> = {}
      if (updates.type !== undefined) dbUpdates.tipo = updates.type
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.category !== undefined) dbUpdates.categoria = updates.category
      if (updates.description !== undefined) dbUpdates.descricao = updates.description
      if (updates.amount !== undefined) dbUpdates.valor = updates.amount
      if (updates.dueDate !== undefined) dbUpdates.vencimento = updates.dueDate
      if (updates.paidDate !== undefined) dbUpdates.pago_em = updates.paidDate
      if (updates.cliente !== undefined) dbUpdates.cliente = updates.cliente
      if (updates.casoId !== undefined) dbUpdates.caso_id = updates.casoId
      if (updates.responsavelUserId !== undefined) dbUpdates.responsavel_user_id = updates.responsavelUserId
      if (updates.recurring !== undefined) dbUpdates.recorrente = updates.recurring
      dbUpdates.updated_at = new Date().toISOString()

      let query = supabase
        .from('financeiro_lancamentos')
        .update(dbUpdates)
        .eq('id', id)
        .select('*')

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query.single()
      if (error) throw new AppError(error.message, 'database_error')

      const row = data as DbFinanceRow
      const userIds = row.responsavel_user_id ? [row.responsavel_user_id] : []
      const responsavelInfo = await resolveResponsavelInfo(userIds, orgId)
      return mapDbToFinance(row, responsavelInfo)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar lancamento financeiro', 'database_error')
    }
  },

  async deleteTransaction(id: string) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      let query = supabase.from('financeiro_lancamentos').delete().eq('id', id)
      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { error } = await query
      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao remover lancamento financeiro', 'database_error')
    }
  },
}
