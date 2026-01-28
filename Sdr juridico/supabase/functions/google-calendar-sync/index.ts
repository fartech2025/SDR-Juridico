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

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const runId = crypto.randomUUID()
  const log = createLogger(runId)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500)
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return jsonResponse({ error: 'Missing Google OAuth env vars' }, 500)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) {
    return jsonResponse({ error: 'Missing auth token' }, 401)
  }

  const supabase = createSupabaseAdminClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  )
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt)
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const payload = await req.json().catch(() => ({}))
  const orgIdFromPayload = typeof payload?.org_id === 'string' ? payload.org_id : null

  let orgId = orgIdFromPayload
  if (!orgId) {
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', authData.user.id)
      .eq('ativo', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (membershipError || !membership?.org_id) {
      return jsonResponse({ error: 'Org not found' }, 403)
    }
    orgId = membership.org_id
  }

  // ✅ SECURITY: Verificar que usuário tem permissão para sincronizar esta organização
  const { data: userOrg, error: userOrgError } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', authData.user.id)
    .eq('org_id', orgId)
    .eq('ativo', true)
    .single()

  if (userOrgError || !userOrg || !['org_admin', 'gestor'].includes(userOrg.role || '')) {
    return jsonResponse({ error: 'Permission denied. Only org admin or gestor can sync calendar' }, 403)
  }

  log('info', 'Starting manual sync', {
    userId: authData.user.id,
    orgId,
    userRole: userOrg.role,
  })

  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id, org_id, enabled, secrets, settings')
    .eq('org_id', orgId)
    .eq('provider', 'google_calendar')
    .maybeSingle()

  if (integrationError || !integration) {
    return jsonResponse({ error: 'Integration not found' }, 404)
  }

  try {
    const result = await syncGoogleCalendarForOrg({
      supabase,
      orgId,
      integration: {
        id: integration.id,
        org_id: integration.org_id,
        secrets: (integration.secrets || {}) as Record<string, unknown>,
        settings: (integration.settings || {}) as Record<string, unknown>,
      },
      googleClientId: GOOGLE_CLIENT_ID,
      googleClientSecret: GOOGLE_CLIENT_SECRET,
      logger: log,
    })

    log('info', 'Sync completed', result)
    return jsonResponse(result)
  } catch (error) {
    log('error', 'Sync failed', {
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonResponse({ error: 'Sync failed' }, 500)
  }
})
