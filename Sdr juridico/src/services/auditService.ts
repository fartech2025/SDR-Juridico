import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export const auditService = {
  async logLogout(): Promise<void> {
    if (!isSupabaseConfigured) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_logs').insert({
        org_id: null,
        user_id: user?.id ?? null,
        action: 'logout',
        entity_type: 'auth',
        entity_id: null,
        metadata: {},
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
