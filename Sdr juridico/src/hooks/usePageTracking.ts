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
        const { error } = await supabase.from('analytics_events').insert({
          org_id: null,
          user_id: user?.id ?? null,
          session_id: null,
          event_name: location.pathname,
          event_type: 'page_view',
          properties: {
            path: location.pathname,
            search: location.search,
          },
          device_info: {},
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
