import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
// Deploy: npx supabase functions deploy google-calendar-create-event --no-verify-jwt --project-ref xocqcoebreoiaqxoutar
// Cria eventos no Google Calendar do USUÁRIO (via token pessoal) ou da ORG (fallback)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

const jsonResponse = (body: Record<string, unknown>, status: number, req: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(req) },
  })

/**
 * Renovar access token do Google usando refresh_token
 */
const refreshGoogleToken = async (refreshToken: string) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao renovar token Google: ${text}`)
  }
  const data = await res.json()
  return {
    access_token: data.access_token as string,
    expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
  }
}

/**
 * Obter token válido do USUÁRIO (user_metadata.google_calendar_tokens)
 * Renova se expirado e atualiza o user_metadata
 */
const getUserToken = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> => {
  const { data: userData, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !userData?.user) return null

  const tokens = userData.user.user_metadata?.google_calendar_tokens
  if (!tokens?.access_token) return null

  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0
  const isExpired = Date.now() > expiresAt - 60_000 // 1 min buffer

  if (!isExpired) return tokens.access_token

  // Token expirado — tentar renovar
  if (!tokens.refresh_token) return null

  try {
    const refreshed = await refreshGoogleToken(tokens.refresh_token)
    // Atualizar user_metadata com novo token
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        google_calendar_tokens: {
          ...tokens,
          access_token: refreshed.access_token,
          expires_at: refreshed.expires_at,
          updated_at: new Date().toISOString(),
        },
      },
    })
    return refreshed.access_token
  } catch (e) {
    console.error('Erro ao renovar token do usuário:', e)
    return null
  }
}

/**
 * Obter token da ORG (tabela integrations) — fallback
 */
const getOrgToken = async (
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<string | null> => {
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('id, secrets')
    .eq('org_id', orgId)
    .eq('provider', 'google_calendar')
    .maybeSingle()

  if (error || !integration) return null

  const secrets = (integration.secrets || {}) as Record<string, unknown>
  const accessToken = secrets.access_token as string | undefined
  const expiresAt = secrets.expires_at as string | undefined
  const refreshToken = secrets.refresh_token as string | undefined

  const isExpired = !expiresAt || new Date(expiresAt).getTime() - Date.now() < 60_000

  if (!isExpired && accessToken) return accessToken

  if (!refreshToken) return null

  try {
    const refreshed = await refreshGoogleToken(refreshToken)
    await supabase.from('integrations').update({
      secrets: {
        ...secrets,
        access_token: refreshed.access_token,
        expires_at: refreshed.expires_at,
        updated_at: new Date().toISOString(),
      },
    }).eq('id', integration.id)
    return refreshed.access_token
  } catch (e) {
    console.error('Erro ao renovar token da org:', e)
    return null
  }
}

/**
 * Criar evento no Google Calendar
 */
const createGoogleCalendarEvent = async (
  accessToken: string,
  eventData: Record<string, unknown>,
) => {
  const url = eventData.conferenceData
    ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1'
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      `Erro ao criar evento: ${(errorData as any)?.error?.message || res.statusText}`,
    )
  }

  return await res.json()
}

/**
 * Handler principal
 * Aceita: { user_id?, org_id?, event }
 * Prioridade: token do user > token da org
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500, req)
  }

  try {
    const body = await req.json()
    const { user_id, org_id, event: eventData } = body

    if (!eventData) {
      return jsonResponse({ error: 'event é obrigatório' }, 400, req)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let accessToken: string | null = null
    let tokenSource = 'none'

    // 1) Tentar token pessoal do usuário
    if (user_id) {
      accessToken = await getUserToken(supabase, user_id)
      if (accessToken) tokenSource = 'user'
    }

    // 2) Fallback: token da organização
    if (!accessToken && org_id) {
      accessToken = await getOrgToken(supabase, org_id)
      if (accessToken) tokenSource = 'org'
    }

    if (!accessToken) {
      return jsonResponse(
        {
          error: 'Google Calendar não conectado. Faça login com Google para sincronizar sua agenda.',
          code: 'NO_GOOGLE_TOKEN',
        },
        401,
        req,
      )
    }

    console.log(`Criando evento via token: ${tokenSource} (user_id: ${user_id || 'N/A'})`)

    const createdEvent = await createGoogleCalendarEvent(accessToken, eventData)

    return jsonResponse({ success: true, event: createdEvent, source: tokenSource }, 200, req)
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      500,
      req,
    )
  }
})
