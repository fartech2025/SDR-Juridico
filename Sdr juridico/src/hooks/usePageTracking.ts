import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

let analyticsAvailable = true

export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    const track = async () => {
      try {
        if (!analyticsAvailable) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!active || !user) return
        const { data: member } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .limit(1)
          .maybeSingle()

        if (!member?.org_id) return
        const { error } = await supabase.from('audit_log').insert({
          org_id: member.org_id,
          actor_user_id: user.id,
          action: 'page_view',
          entity: 'navigation',
          entity_id: null,
          details: {
            path: location.pathname,
            search: location.search,
          },
        })
        if (error?.code === '42P01' || error?.status === 404) {
          analyticsAvailable = false
        }
      } catch {
        // Silently ignore tracking errors
      }
    }

    track()

    return () => {
      active = false
    }
  }, [location.pathname, location.search])
}
