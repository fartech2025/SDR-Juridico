import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import {
  createSupabaseAdminClient,
  syncGoogleCalendarForOrg,
  type SyncLogger,
} from "../_shared/googleCalendarSync.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''
const SYNC_CRON_SECRET = Deno.env.get('SYNC_CRON_SECRET') ?? ''

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const createLogger = (runId: string): SyncLogger => {
  return (level, message, meta = {}) => {
    const payload = {
      level,
      runId,
      message,
      ...meta,
    }
    if (level === 'error') {
      console.error(JSON.stringify(payload))
    } else {
      console.log(JSON.stringify(payload))
    }
  }
}

serve(async (req) => {
  const runId = crypto.randomUUID()
  const log = createLogger(runId)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500)
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return jsonResponse({ error: 'Missing Google OAuth env vars' }, 500)
  }

  if (SYNC_CRON_SECRET) {
    const provided = req.headers.get('x-sync-secret')
    if (provided !== SYNC_CRON_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
  }

  const supabase = createSupabaseAdminClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data: integrations, error: integrationError } = await supabase
    .from('integrations')
    .select('id, org_id, enabled, secrets, settings')
    .eq('provider', 'google_calendar')
    .eq('enabled', true)

  if (integrationError) {
    log('error', 'Failed to load integrations', { error: integrationError.message })
    return jsonResponse({ error: 'Integration query failed' }, 500)
  }

  const rows = integrations || []
  log('info', 'Cron sync start', { totalIntegrations: rows.length })

  const results: Record<string, unknown>[] = []
  let success = 0
  let failed = 0

  for (const integration of rows) {
    const orgId = integration.org_id as string
    try {
      const result = await syncGoogleCalendarForOrg({
        supabase,
        orgId,
        integration: {
          id: integration.id,
          org_id: orgId,
          secrets: (integration.secrets || {}) as Record<string, unknown>,
          settings: (integration.settings || {}) as Record<string, unknown>,
        },
        googleClientId: GOOGLE_CLIENT_ID,
        googleClientSecret: GOOGLE_CLIENT_SECRET,
        logger: log,
      })
      results.push({ status: 'ok', ...result })
      success += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      log('error', 'Cron sync failed', { orgId, error: message })
      results.push({ status: 'error', orgId, error: message })
      failed += 1
    }
  }

  log('info', 'Cron sync finished', { success, failed })

  return jsonResponse({ success, failed, results })
})
