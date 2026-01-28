import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const {
      org_id: orgId,
      title,
      description,
      startTime,
      endTime,
      attendees,
    } = await req.json()

    if (!orgId || !title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase não configurado')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obter integração do Teams
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('org_id', orgId)
      .eq('provider', 'teams')
      .maybeSingle()

    if (integrationError || !integration) {
      throw new Error('Integração do Teams não encontrada')
    }

    let accessToken = integration.access_token

    // Verificar se token expirou e fazer refresh se necessário
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')

      if (!clientId || !clientSecret) {
        throw new Error('Credenciais Microsoft não configuradas')
      }

      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
          scope: 'Calendars.ReadWrite offline_access',
        }).toString(),
      })

      if (!refreshResponse.ok) {
        throw new Error('Erro ao renovar token do Teams')
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Atualizar token no banco
      await supabase
        .from('integrations')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('org_id', orgId)
        .eq('provider', 'teams')
    }

    // Criar evento no Teams (Calendar)
    const eventPayload = {
      subject: title,
      bodyPreview: description || '',
      body: {
        contentType: 'HTML',
        content: description || 'Reunião criada automaticamente',
      },
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: attendees
        ? attendees.map((email: string) => ({
            emailAddress: { address: email },
            type: 'required',
          }))
        : [],
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      isReminderOn: true,
      reminderMinutesBeforeStart: 15,
    }

    const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(`Erro ao criar evento no Teams: ${errorData.error?.message}`)
    }

    const teamsEvent = await createResponse.json()

    // Obter link de participação se disponível
    let joinWebUrl = teamsEvent.onlineMeeting?.joinUrl || `https://teams.microsoft.com/l/meetup-join/${teamsEvent.id}`

    return new Response(
      JSON.stringify({
        meeting: {
          id: teamsEvent.id,
          subject: teamsEvent.subject,
          joinWebUrl,
          startDateTime: teamsEvent.start.dateTime,
          endDateTime: teamsEvent.end.dateTime,
          organizerEmail: teamsEvent.organizer?.emailAddress?.address,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
})
