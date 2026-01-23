import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { telemetryService } from '@/services/telemetryService'

type AuditChangeInput = {
  orgId: string | null
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId: string | null
  details?: Record<string, any> | null
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
