import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { telemetryService } from '@/services/telemetryService'

export const auditService = {
  async logLogout(): Promise<void> {
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
  },
}

export const sessionService = {
  end() {
    // Placeholder for session cleanup logic.
  },
}
