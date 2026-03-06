// google-drive-oauth — Supabase Edge Function (Deno)
// Fluxo OAuth Google para Drive (drive.file scope).
// GET sem ?code → redireciona para Google
// GET com ?code  → troca código por tokens, salva em integrations, redireciona de volta

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

Deno.serve(async (req: Request) => {
  const url    = new URL(req.url)
  const code   = url.searchParams.get('code')
  const state  = url.searchParams.get('state')    // JSON: { org_id, return_to }
  const error  = url.searchParams.get('error')

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')!
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

  // Redirect URI = esta própria função
  const redirectUri = `${supabaseUrl}/functions/v1/google-drive-oauth`

  // ── Etapa 1: Inicia o OAuth ──────────────────────────────────────────────
  if (!code && !error) {
    const orgId   = url.searchParams.get('org_id')   ?? ''
    const returnTo = url.searchParams.get('return_to') ?? '/'

    const stateData = JSON.stringify({ org_id: orgId, return_to: returnTo })

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id',     clientId)
    authUrl.searchParams.set('redirect_uri',  redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope',         SCOPES)
    authUrl.searchParams.set('access_type',   'offline')
    authUrl.searchParams.set('prompt',        'consent')
    authUrl.searchParams.set('state',         stateData)

    return Response.redirect(authUrl.toString(), 302)
  }

  // ── Etapa 2: Google devolveu erro ────────────────────────────────────────
  if (error) {
    let returnTo = '/'
    try { returnTo = (JSON.parse(state ?? '{}') as { return_to?: string }).return_to ?? '/' } catch { /* */ }
    return Response.redirect(`${returnTo}?google_drive=error`, 302)
  }

  // ── Etapa 3: Troca código por tokens ─────────────────────────────────────
  let orgId = '', returnTo = '/'
  try {
    const parsed = JSON.parse(state ?? '{}') as { org_id?: string; return_to?: string }
    orgId    = parsed.org_id   ?? ''
    returnTo = parsed.return_to ?? '/'
  } catch { /* */ }

  if (!orgId) return Response.redirect(`${returnTo}?google_drive=error`, 302)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code:          code!,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    console.error('google-drive-oauth: token exchange failed', await tokenRes.text())
    return Response.redirect(`${returnTo}?google_drive=error`, 302)
  }

  const tokens = (await tokenRes.json()) as {
    access_token:  string
    refresh_token?: string
    expires_in:    number
    scope:         string
    token_type:    string
  }

  const db = createClient(supabaseUrl, serviceKey)

  // Salva/atualiza a integração google_drive
  const secrets = {
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date:   Date.now() + tokens.expires_in * 1000,
    scope:         tokens.scope,
    token_type:    tokens.token_type,
  }

  const { data: existing } = await db
    .from('integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', 'google_drive')
    .maybeSingle()

  if (existing?.id) {
    await db.from('integrations')
      .update({ secrets, enabled: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await db.from('integrations').insert({
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
