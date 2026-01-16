import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export const auditService = {
  async logLogout(): Promise<void> {
    if (!isSupabaseConfigured) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_log').insert({
        org_id: null,
        actor_user_id: user?.id ?? null,
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
