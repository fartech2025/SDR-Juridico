import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(
        `<html><body><h1>Erro</h1><p>${error}</p></body></html>`,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }

    if (!code || !state) {
      return new Response('Parâmetros inválidos', {
        status: 400,
        headers: corsHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')

    if (!supabaseUrl || !supabaseServiceKey || !clientId || !clientSecret) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Decodificar estado para obter orgId
    const decodedState = JSON.parse(atob(state))
    const { orgId, integrationId } = decodedState

    // Trocar código por token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${supabaseUrl}/functions/v1/teams-oauth`,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Erro ao obter token: ${error}`)
    }

    const tokenData = await tokenResponse.json()

    // Obter informações do usuário
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      throw new Error('Erro ao obter dados do usuário')
    }

    const userData = await userResponse.json()

    // Atualizar integração no banco
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        provider_user_id: userData.id,
        provider_email: userData.userPrincipalName,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', integrationId)

    if (updateError) {
      throw new Error('Erro ao atualizar integração')
    }

    // Redirecionar para página de sucesso
    return new Response(
      `<html>
        <head>
          <title>Teams Conectado</title>
          <script>
            window.opener.postMessage({ type: 'teams_oauth_success', orgId: '${orgId}' }, '*');
            window.close();
          </script>
        </head>
        <body>
          <h1>✓ Microsoft Teams conectado com sucesso!</h1>
          <p>Você pode fechar esta janela.</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      `<html><body><h1>Erro</h1><p>${message}</p></body></html>`,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }
})
