import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })

/**
 * Renovar access token do Google
 */
const refreshAccessToken = async (
  refreshToken: string,
): Promise<{
  accessToken: string
  expiresAt: string | null
  scope?: string
  tokenType?: string
}> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Falha ao renovar token: ${errorData}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token as string,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    scope: data.scope as string | undefined,
    tokenType: data.token_type as string | undefined,
  }
}

/**
 * Verificar e renovar token se necessário
 */
const ensureValidToken = async (
  supabase: ReturnType<typeof createClient>,
  integrationId: string,
  secrets: Record<string, unknown>,
) => {
  const accessToken = secrets.access_token as string | undefined
  const expiresAt = secrets.expires_at as string | undefined
  const refreshToken = secrets.refresh_token as string | undefined

  // Verificar se token expirou ou vai expirar em menos de 1 minuto
  if (!expiresAt || new Date(expiresAt).getTime() - Date.now() < 60_000) {
    if (!refreshToken) {
      throw new Error('Token expirado e sem refresh token disponível')
    }

    const refreshed = await refreshAccessToken(refreshToken)

    // Atualizar secrets no banco
    const updatedSecrets = {
      ...secrets,
      access_token: refreshed.accessToken,
      expires_at: refreshed.expiresAt,
      scope: refreshed.scope || secrets.scope,
      token_type: refreshed.tokenType || secrets.token_type,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('integrations').update({ secrets: updatedSecrets }).eq('id', integrationId)

    return refreshed.accessToken
  }

  return accessToken
}

/**
 * Criar evento no Google Calendar
 */
const createGoogleCalendarEvent = async (
  accessToken: string,
  eventData: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...eventData,
      conferenceDataVersion: eventData.conferenceData ? 1 : 0,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      `Erro ao criar evento no Google Calendar: ${
        (errorData as Record<string, unknown>).message || response.statusText
      }`
    )
  }

  return await response.json()
}

/**
 * Handler principal
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500)
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return jsonResponse({ error: 'Missing Google OAuth env vars' }, 500)
  }

  try {
    const { org_id, event: eventData } = await req.json()

    if (!org_id) {
      return jsonResponse({ error: 'org_id é obrigatório' }, 400)
    }

    if (!eventData) {
      return jsonResponse({ error: 'event é obrigatório' }, 400)
    }

    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Buscar integração do Google Calendar
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id, secrets')
      .eq('org_id', org_id)
      .eq('provider', 'google_calendar')
      .single()

    if (integrationError || !integration) {
      return jsonResponse(
        { error: 'Google Calendar não configurado para esta organização' },
        401
      )
    }

    const secrets = integration.secrets || {}

    // Garantir token válido
    const accessToken = await ensureValidToken(supabase, integration.id, secrets)

    // Criar evento no Google Calendar
    const createdEvent = await createGoogleCalendarEvent(accessToken, eventData)

    return jsonResponse({
      success: true,
      event: createdEvent,
    })
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      500
    )
  }
})
