import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'

export type AuditLogEntry = {
  id: string
  created_at: string
  org_id: string
  actor_user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  details: Record<string, any> | null
}

type AuditLogFilters = {
  action?: string | null
  entity?: string | null
  actorUserId?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
  limit?: number
}

type AuditTable = 'audit_log' | 'audit_logs'

const auditTables: AuditTable[] = ['audit_log', 'audit_logs']

const isMissingTable = (error: { code?: string; message?: string } | null | undefined) => {
  const message = error?.message || ''
  return (
    error?.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('table')
  )
}

export const auditLogsService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
    const { orgId, isFartechAdmin } = await resolveOrgScope()
    if (!isFartechAdmin && !orgId) return []

    for (const table of auditTables) {
      const query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit ?? 200)

      if (!isFartechAdmin && orgId) {
        query.eq('org_id', orgId)
      }
      if (filters.action) {
        query.eq('action', filters.action)
      }
      if (filters.entity) {
        query.eq('entity', filters.entity)
      }
      if (filters.actorUserId) {
        query.eq('actor_user_id', filters.actorUserId)
      }
      if (filters.from) {
        query.gte('created_at', filters.from)
      }
      if (filters.to) {
        query.lte('created_at', filters.to)
      }
      if (filters.search) {
        const term = `%${filters.search}%`
        query.or(
          `entity.ilike.${term},action.ilike.${term},entity_id.ilike.${term},actor_user_id.ilike.${term}`
        )
      }

      const { data, error } = await query
      if (!error) return (data || []) as AuditLogEntry[]
      if (isMissingTable(error)) continue
      throw new AppError(error.message || 'Erro ao buscar auditoria', 'database_error')
    }

    return []
  },
}
