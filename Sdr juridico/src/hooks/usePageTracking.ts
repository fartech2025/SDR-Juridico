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
        if (!active) return
        const { error } = await supabase.from('audit_log').insert({
          org_id: null,
          actor_user_id: user?.id ?? null,
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
