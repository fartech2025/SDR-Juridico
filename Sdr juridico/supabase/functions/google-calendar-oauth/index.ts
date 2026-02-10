import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''
const GOOGLE_REDIRECT_URI =
  Deno.env.get('GOOGLE_REDIRECT_URI') ??
  `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`
const APP_URL = Deno.env.get('APP_URL') ?? ''

const oauthScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

const encodeState = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const decodeState = (value: string) => {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  return atob(padded)
}

const appendParams = (base: string, params: Record<string, string>) => {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  return url.toString()
}

const resolveReturnTo = (value?: string) => {
  if (value) return value
  if (APP_URL) return APP_URL
  return SUPABASE_URL || 'https://supabase.co'
}

serve(async (req) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Missing Supabase env vars', { status: 500 })
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response('Missing Google OAuth env vars', { status: 500 })
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')
  const stateParam = url.searchParams.get('state')

  if (!code && !oauthError) {
    const integrationId = url.searchParams.get('integration_id')
    const orgId = url.searchParams.get('org_id') ?? ''
    const returnTo = url.searchParams.get('return_to') || APP_URL

    if (!orgId) {
      return new Response('Missing org_id', { status: 400 })
    }

    const state = encodeState(
      JSON.stringify({
        integration_id: integrationId || '',
        org_id: orgId,
        return_to: returnTo,
      }),
    )

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', oauthScopes)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('include_granted_scopes', 'true')
    authUrl.searchParams.set('state', state)

    return Response.redirect(authUrl.toString(), 302)
  }

  let decodedState: {
    integration_id?: string
    org_id?: string
    return_to?: string
  } = {}

  if (stateParam) {
    try {
      decodedState = JSON.parse(decodeState(stateParam))
    } catch {
      decodedState = {}
    }
  }

  const returnTo = resolveReturnTo(decodedState.return_to)

  if (oauthError) {
    return Response.redirect(
      appendParams(returnTo, { google_calendar: 'error' }),
      302,
    )
  }

  if (!code || !decodedState.org_id) {
    return Response.redirect(
      appendParams(returnTo, { google_calendar: 'error' }),
      302,
    )
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    return Response.redirect(
      appendParams(returnTo, { google_calendar: 'error' }),
      302,
    )
  }

  const tokenData = await tokenResponse.json()
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // UPSERT: buscar integração existente por org_id + provider (não por ID do localStorage)
  const { data: existing } = await supabase
    .from('integrations')
    .select('id, secrets, settings')
    .eq('org_id', decodedState.org_id)
    .eq('provider', 'google_calendar')
    .maybeSingle()

  const existingSecrets =
    existing?.secrets && typeof existing.secrets === 'object'
      ? (existing.secrets as Record<string, unknown>)
      : {}
  const existingSettings =
    existing?.settings && typeof existing.settings === 'object'
      ? (existing.settings as Record<string, unknown>)
      : {}

  const nextSecrets: Record<string, unknown> = {
    ...existingSecrets,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || existingSecrets.refresh_token,
    scope: tokenData.scope,
    token_type: tokenData.token_type,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }

  const nextSettings: Record<string, unknown> = {
    ...existingSettings,
    connected_at: new Date().toISOString(),
  }

  if (existing) {
    // UPDATE registro existente
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        enabled: true,
        secrets: nextSecrets,
        settings: nextSettings,
      })
      .eq('id', existing.id)

    if (updateError) {
      return Response.redirect(
        appendParams(returnTo, { google_calendar: 'error' }),
        302,
      )
    }
  } else {
    // INSERT novo registro no banco
    const { error: insertError } = await supabase
      .from('integrations')
      .insert({
        org_id: decodedState.org_id,
        provider: 'google_calendar',
        name: 'Google Calendar',
        enabled: true,
        secrets: nextSecrets,
        settings: nextSettings,
      })

    if (insertError) {
      return Response.redirect(
        appendParams(returnTo, { google_calendar: 'error' }),
        302,
      )
    }
  }

  return Response.redirect(
    appendParams(returnTo, { google_calendar: 'connected' }),
    302,
  )
})
