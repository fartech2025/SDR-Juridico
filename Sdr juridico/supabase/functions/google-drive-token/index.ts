/**
 * google-drive-token
 *
 * Retorna um Google access_token válido para chamadas à Drive API.
 * Lê o token armazenado na tabela `integrations` (provider = 'google_calendar'),
 * faz refresh automático se expirado e persiste o novo token no banco.
 *
 * Body: { org_id: string }
 * Retorna: { access_token: string, has_drive_scope: boolean }
 * Erros (422): { error: string, code: 'NOT_CONNECTED' | 'DRIVE_SCOPE_MISSING' | 'NEEDS_RECONNECT' | 'REFRESH_FAILED' }
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')             ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const GOOGLE_CLIENT_ID         = Deno.env.get('GOOGLE_CLIENT_ID')         ?? ''
const GOOGLE_CLIENT_SECRET     = Deno.env.get('GOOGLE_CLIENT_SECRET')     ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Token expira em menos de 2 minutos → considera expirado
function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return true
  const ms = new Date(expiresAt).getTime()
  if (Number.isNaN(ms)) return true
  return ms - Date.now() < 120_000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  let org_id: string | undefined
  try {
    const body = await req.json()
    org_id = body?.org_id
  } catch {
    return json({ error: 'Body inválido' }, 400)
  }

  if (!org_id) {
    return json({ error: 'org_id é obrigatório' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Busca integração google_calendar da org (é onde os tokens do Drive ficam)
  const { data: integration, error: dbError } = await supabase
    .from('integrations')
    .select('id, secrets, enabled')
    .eq('org_id', org_id)
    .eq('provider', 'google_calendar')
    .maybeSingle()

  if (dbError) {
    return json({ error: 'Erro ao consultar banco', code: 'DB_ERROR' }, 500)
  }

  if (!integration || !integration.enabled) {
    return json({
      error: 'Google não conectado. Vá em Configurações → Integrações e vincule o Google Calendar.',
      code: 'NOT_CONNECTED',
    }, 422)
  }

  const secrets = (integration.secrets ?? {}) as Record<string, string>
  const { access_token, refresh_token, expires_at, scope } = secrets

  // Verifica se o token tem os escopos de Drive
  const hasDriveScope = typeof scope === 'string' && scope.includes('drive')
  if (!hasDriveScope) {
    return json({
      error: 'Escopos do Drive não concedidos. Reconecte o Google Calendar em Configurações → Integrações para ativar o Drive.',
      code: 'DRIVE_SCOPE_MISSING',
    }, 422)
  }

  // Token ainda válido → retorna direto
  if (!isExpired(expires_at) && access_token) {
    return json({ access_token, has_drive_scope: true })
  }

  // Token expirado → precisa renovar
  if (!refresh_token) {
    return json({
      error: 'Token expirado e sem refresh_token. Reconecte o Google Calendar.',
      code: 'NEEDS_RECONNECT',
    }, 422)
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return json({ error: 'Variáveis de ambiente Google não configuradas no servidor' }, 500)
  }

  const refreshResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refresh_token,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  })

  if (!refreshResp.ok) {
    const errBody = await refreshResp.text()
    console.error('Falha no refresh Google token:', errBody)
    return json({
      error: 'Falha ao renovar token Google. Reconecte em Configurações → Integrações.',
      code: 'REFRESH_FAILED',
    }, 422)
  }

  const refreshData = await refreshResp.json() as {
    access_token: string
    expires_in?: number
  }

  const newExpiresAt = refreshData.expires_in
    ? new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
    : null

  // Persiste o novo token no banco
  await supabase
    .from('integrations')
    .update({
      secrets: {
        ...secrets,
        access_token: refreshData.access_token,
        expires_at:   newExpiresAt,
        updated_at:   new Date().toISOString(),
      },
    })
    .eq('id', integration.id)

  return json({ access_token: refreshData.access_token, has_drive_scope: true })
})
