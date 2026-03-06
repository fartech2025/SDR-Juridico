// google-drive-token — Supabase Edge Function (Deno)
// Lê o token do Google Drive da tabela integrations,
// renova se expirado e retorna { access_token }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type DriveErrorCode = 'NOT_CONNECTED' | 'REFRESH_FAILED' | 'DB_ERROR' | 'NEEDS_RECONNECT'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { org_id } = (await req.json()) as { org_id?: string }
    if (!org_id) return json({ code: 'NOT_CONNECTED' as DriveErrorCode, error: 'org_id obrigatório' }, 400)

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const clientId     = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

    const db = createClient(supabaseUrl, serviceKey)

    // Busca integração google_drive (token exclusivo de Drive)
    const { data: row, error: dbErr } = await db
      .from('integrations')
      .select('id, secrets')
      .eq('org_id', org_id)
      .eq('provider', 'google_drive')
      .eq('enabled', true)
      .maybeSingle()

    if (dbErr) return json({ code: 'DB_ERROR' as DriveErrorCode, error: dbErr.message }, 500)
    if (!row?.secrets) return json({ code: 'NOT_CONNECTED' as DriveErrorCode, error: 'Google Drive não conectado' }, 401)

    const s = row.secrets as Record<string, string | number | undefined>
    if (!s.access_token) return json({ code: 'NOT_CONNECTED' as DriveErrorCode, error: 'Token não encontrado' }, 401)

    // Token ainda válido?
    const expiryDate = (s.expiry_date as number | undefined) ?? 0
    if (!expiryDate || Date.now() < expiryDate - 60_000) {
      return json({ access_token: s.access_token })
    }

    // Precisa renovar
    if (!s.refresh_token) {
      return json({ code: 'NEEDS_RECONNECT' as DriveErrorCode, error: 'Token expirado. Reconecte o Google Drive.' }, 401)
    }
    if (!clientId || !clientSecret) {
      return json({ code: 'REFRESH_FAILED' as DriveErrorCode, error: 'Configuração Google incompleta no servidor' }, 500)
    }

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: s.refresh_token as string,
        grant_type:    'refresh_token',
      }),
    })

    if (!refreshRes.ok) {
      return json({ code: 'REFRESH_FAILED' as DriveErrorCode, error: 'Falha ao renovar token Google Drive' }, 401)
    }

    const { access_token, expires_in } = (await refreshRes.json()) as {
      access_token: string
      expires_in: number
    }

    await db.from('integrations').update({
      secrets: { ...s, access_token, expiry_date: Date.now() + expires_in * 1000 },
    }).eq('id', row.id)

    return json({ access_token })
  } catch (err) {
    return json({ code: 'NOT_CONNECTED' as DriveErrorCode, error: String(err) }, 500)
  }
})
