/**
 * google-drive-oauth
 *
 * Fluxo OAuth 2.0 para Google Drive (scope: drive.file + userinfo.email).
 * Cria/atualiza uma integração com provider='google_drive' na tabela integrations.
 *
 * GET /google-drive-oauth?org_id=...&return_to=...   → redireciona para Google
 * GET /google-drive-oauth?code=...&state=...          → callback do Google
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')             ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID          = Deno.env.get('GOOGLE_CLIENT_ID')         ?? ''
const GOOGLE_CLIENT_SECRET      = Deno.env.get('GOOGLE_CLIENT_SECRET')     ?? ''

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

/** URL de callback — aponta para esta própria função */
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-drive-oauth`

serve(async (req) => {
  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // ── Etapa 1: Iniciar OAuth ───────────────────────────────────────────────
  if (!code && !error) {
    const orgId    = url.searchParams.get('org_id')    ?? ''
    const returnTo = url.searchParams.get('return_to') ?? '/'

    const stateJson = JSON.stringify({ org_id: orgId, return_to: returnTo })

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id',     GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri',  REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope',         SCOPES)
    authUrl.searchParams.set('access_type',   'offline')
    authUrl.searchParams.set('prompt',        'consent')
    authUrl.searchParams.set('state',         stateJson)

    return Response.redirect(authUrl.toString(), 302)
  }

  // ── Parse state ──────────────────────────────────────────────────────────
  let orgId = '', returnTo = '/'
  try {
    const parsed = JSON.parse(state ?? '{}') as { org_id?: string; return_to?: string }
    orgId    = parsed.org_id    ?? ''
    returnTo = parsed.return_to ?? '/'
  } catch { /* */ }

  // ── Etapa 2: Google retornou erro ────────────────────────────────────────
  if (error) {
    console.error('google-drive-oauth error from Google:', error)
    return Response.redirect(`${returnTo}?google_drive=error`, 302)
  }

  if (!orgId) {
    return Response.redirect(`${returnTo}?google_drive=error`, 302)
  }

  // ── Etapa 3: Trocar código por tokens ────────────────────────────────────
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code:          code!,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    console.error('google-drive-oauth token exchange failed:', await tokenRes.text())
    return Response.redirect(`${returnTo}?google_drive=error`, 302)
  }

  const tokens = await tokenRes.json() as {
    access_token:   string
    refresh_token?: string
    expires_in:     number
    scope:          string
    token_type:     string
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const secrets = {
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at:    expiresAt,
    scope:         tokens.scope,
    token_type:    tokens.token_type,
    updated_at:    new Date().toISOString(),
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Upsert: atualiza se já existe, cria se não existe
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', 'google_drive')
    .maybeSingle()

  if (existing?.id) {
    await supabase.from('integrations')
      .update({ secrets, enabled: true })
      .eq('id', existing.id)
  } else {
    await supabase.from('integrations').insert({
      org_id:   orgId,
      provider: 'google_drive',
      name:     'Google Drive',
      enabled:  true,
      secrets,
      settings: {},
    })
  }

  return Response.redirect(`${returnTo}?google_drive=connected`, 302)
})
