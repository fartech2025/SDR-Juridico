import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

type AuditEventInput = {
  org_id: string
  actor_user_id?: string | null
  action: string
  entity?: string | null
  entity_id?: string | null
  details?: Record<string, any> | null
}

type AnalyticsEventInput = {
  org_id?: string | null
  user_id?: string | null
  session_id?: string | null
  event_name: string
  event_type: string
  properties?: Record<string, any> | null
  device_info?: Record<string, any> | null
}

type AuditTable = 'audit_log' | 'audit_logs'

let auditTable: AuditTable | null = 'audit_log'
let analyticsEnabled = true

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

const insertAuditEvent = async (table: AuditTable, payload: AuditEventInput) => {
  return supabase.from(table).insert({
    ...payload,
    details: payload.details ?? {},
  })
}

export const telemetryService = {
  async logAuditEvent(payload: AuditEventInput): Promise<boolean> {
    if (!isSupabaseConfigured || !auditTable) return false
    const { error } = await insertAuditEvent(auditTable, payload)
    if (!error) return true

    if (!isMissingTable(error)) {
      console.warn('[telemetry] audit insert failed:', error)
      return false
    }

    if (auditTable === 'audit_log') {
      auditTable = 'audit_logs'
      const fallback = await insertAuditEvent('audit_logs', payload)
      if (!fallback.error) return true
      if (isMissingTable(fallback.error)) {
        auditTable = null
      } else {
        console.warn('[telemetry] audit insert failed:', fallback.error)
      }
      return false
    }

    auditTable = null
    return false
  },

  async logAnalyticsEvent(payload: AnalyticsEventInput): Promise<boolean> {
    if (!isSupabaseConfigured || !analyticsEnabled) return false
    const { error } = await supabase.from('analytics_events').insert({
      ...payload,
      properties: payload.properties ?? {},
      device_info: payload.device_info ?? {},
    })

    if (!error) return true
    if (isMissingTable(error)) {
      analyticsEnabled = false
      return false
    }

    console.warn('[telemetry] analytics insert failed:', error)
    return false
  },
}
