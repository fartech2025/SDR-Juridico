// supabase/functions/store-google-tokens/index.ts
// Salva os tokens OAuth do Google (provider_token) no user_metadata do Supabase Auth
// para uso posterior com Google Calendar API
// Deploy: npx supabase functions deploy store-google-tokens --no-verify-jwt --project-ref xocqcoebreoiaqxoutar
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  const headers = { 'Content-Type': 'application/json', ...corsHeaders(req) }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers })
    }

    const { user_id, access_token, refresh_token } = await req.json()

    if (!user_id || !access_token) {
      return new Response(
        JSON.stringify({ error: 'user_id e access_token são obrigatórios' }),
        { status: 400, headers },
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Salvar tokens no user_metadata (criptografado pelo Supabase Auth)
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: {
        google_calendar_tokens: {
          access_token,
          refresh_token: refresh_token || null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // ~1h
        },
      },
    })

    if (error) {
      console.error('Erro ao salvar tokens:', error)
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar tokens: ' + error.message }),
        { status: 500, headers },
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers },
    )
  } catch (err) {
    console.error('Erro:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }),
      { status: 500, headers },
    )
  }
})
