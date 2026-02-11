import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { telemetryService } from '@/services/telemetryService'

type AuditChangeInput = {
  orgId: string | null
  action: 'create' | 'update' | 'delete' | 'request_document' | 'attach_document' | 'submit_for_validation' | 'approve' | 'reject' | 'datajud_search' | 'datajud_link' | 'datajud_unlink' | 'datajud_sync' | 'archive' | 'restore' | 'view' | 'soft_delete' | 'hard_delete' | 'convert'
  entity: string
  entityId: string | null
  details?: Record<string, any> | null
}

type DataJudAuditInput = {
  orgId: string
  action: 'search' | 'link' | 'unlink' | 'sync'
  tribunal?: string
  searchQuery?: string
  casoId?: string
  resultado?: Record<string, any>
}

const resolveActorUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}

export async function logAuditChange(input: AuditChangeInput): Promise<boolean> {
  if (!isSupabaseConfigured || !input.orgId) return false
  try {
    const actorUserId = await resolveActorUserId()
    return await telemetryService.logAuditEvent({
      org_id: input.orgId,
      actor_user_id: actorUserId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      details: input.details ?? {},
    })
  } catch {
    return false
  }
}

/**
 * Log DataJud audit event
 */
/**
 * Log logout event (merged from auditService.ts)
 */
export async function logLogout(): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()

    if (!member?.org_id) return
    await telemetryService.logAuditEvent({
      org_id: member.org_id,
      actor_user_id: user.id,
      action: 'logout',
      entity: 'auth',
      entity_id: null,
      details: {},
    })
  } catch {
    // Silently ignore audit failures
  }
}

export async function logDataJudAudit(input: DataJudAuditInput): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  try {
    const actorUserId = await resolveActorUserId()
    if (!actorUserId) return false

    const { error } = await supabase.from('datajud_api_calls').insert({
      user_id: actorUserId,
      org_id: input.orgId,
      action: input.action,
      tribunal: input.tribunal,
      search_query: input.searchQuery,
      resultado_count: input.resultado?.total || 0,
      status_code: 200,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error logging DataJud audit:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in logDataJudAudit:', error)
    return false
  }
}

