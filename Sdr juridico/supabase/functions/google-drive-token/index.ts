/**
 * google-drive-token
 *
 * Retorna um Google access_token válido para chamadas à Drive API.
 *
 * Estratégia de busca (ordem de prioridade):
 *   1. Integração provider='google_drive' (token dedicado — criado pelo google-drive-oauth)
 *   2. Integração provider='google_calendar' com scope contendo 'drive' (legado)
 *
 * Body: { org_id: string }
 * Retorna: { access_token: string }
 * Erros: { error: string, code: 'NOT_CONNECTED' | 'DRIVE_SCOPE_MISSING' | 'NEEDS_RECONNECT' | 'REFRESH_FAILED' | 'DB_ERROR' }
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')             ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID          = Deno.env.get('GOOGLE_CLIENT_ID')         ?? ''
const GOOGLE_CLIENT_SECRET      = Deno.env.get('GOOGLE_CLIENT_SECRET')     ?? ''

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

/** Considera expirado se vence em menos de 2 minutos */
function isExpired(expiresAt?: string | number | null): boolean {
  if (!expiresAt) return true
  const ts = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime()
  if (Number.isNaN(ts)) return true
  return ts - Date.now() < 120_000
}

async function refreshGoogleToken(
  supabase: ReturnType<typeof createClient>,
  integrationId: string,
  secrets: Record<string, string>,
): Promise<{ access_token: string } | { error: string; code: string }> {
  if (!secrets.refresh_token) {
    return { error: 'Token expirado e sem refresh_token. Reconecte o Google Drive.', code: 'NEEDS_RECONNECT' }
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return { error: 'Variáveis de ambiente Google não configuradas no servidor', code: 'REFRESH_FAILED' }
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: secrets.refresh_token,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  })

  if (!resp.ok) {
    console.error('Refresh Google token failed:', await resp.text())
    return { error: 'Falha ao renovar token Google. Reconecte em Configurações → Integrações.', code: 'REFRESH_FAILED' }
  }

  const data = await resp.json() as { access_token: string; expires_in?: number }
  const newExpiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null

  await supabase.from('integrations').update({
    secrets: { ...secrets, access_token: data.access_token, expires_at: newExpiresAt, updated_at: new Date().toISOString() },
  }).eq('id', integrationId)

  return { access_token: data.access_token }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  let org_id: string | undefined
  try {
    org_id = (await req.json())?.org_id
  } catch {
    return json({ error: 'Body inválido' }, 400)
  }
  if (!org_id) return json({ error: 'org_id é obrigatório' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── Prioridade 1: integração dedicada google_drive ────────────────────────
  const { data: driveInt } = await supabase
    .from('integrations')
    .select('id, secrets, enabled')
    .eq('org_id', org_id)
    .eq('provider', 'google_drive')
    .eq('enabled', true)
    .maybeSingle()

  if (driveInt?.secrets) {
    const s = driveInt.secrets as Record<string, string>
    if (s.access_token) {
      if (!isExpired(s.expires_at)) return json({ access_token: s.access_token })
      const result = await refreshGoogleToken(supabase, driveInt.id, s)
      if ('access_token' in result) return json({ access_token: result.access_token })
      return json(result, 422)
    }
  }

  // ── Prioridade 2: google_calendar com scope de Drive (legado) ─────────────
  const { data: calInt, error: dbErr } = await supabase
    .from('integrations')
    .select('id, secrets, enabled')
    .eq('org_id', org_id)
    .eq('provider', 'google_calendar')
    .eq('enabled', true)
    .maybeSingle()

  if (dbErr) return json({ error: 'Erro ao consultar banco', code: 'DB_ERROR' }, 500)

  if (!calInt?.enabled || !calInt.secrets) {
    return json({
      error: 'Google Drive não conectado. Vá em Configurações → Integrações e clique em "Conectar Google Drive".',
      code: 'NOT_CONNECTED',
    }, 422)
  }

  const s = calInt.secrets as Record<string, string>
  const hasDriveScope = typeof s.scope === 'string' && s.scope.includes('drive')
  if (!hasDriveScope) {
    return json({
      error: 'Escopos do Drive não concedidos. Conecte o Google Drive em Configurações → Integrações.',
      code: 'DRIVE_SCOPE_MISSING',
    }, 422)
  }

  if (!isExpired(s.expires_at) && s.access_token) {
    return json({ access_token: s.access_token })
  }

  const result = await refreshGoogleToken(supabase, calInt.id, s)
  if ('access_token' in result) return json({ access_token: result.access_token })
  return json(result, 422)
})
