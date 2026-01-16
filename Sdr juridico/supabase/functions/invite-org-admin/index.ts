import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: 'Variáveis de ambiente não configuradas' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return json({ error: 'Token ausente' }, 401)
    }

    const { data: authData, error: authError } = await createClient(
      supabaseUrl,
      supabaseServiceKey
    ).auth.getUser(token)

    if (authError || !authData?.user) {
      return json({ error: 'Token inválido' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes')
      .eq('id', authData.user.id)
      .single()

    if (requesterError || !(requester?.permissoes || []).includes('fartech_admin')) {
      return json({ error: 'Sem permissão para convidar admin' }, 403)
    }

    const { orgId, adminEmail, adminName, responsavelEmail } = await req.json()

    if (!orgId || !adminEmail) {
      return json({ error: 'orgId e adminEmail são obrigatórios' }, 400)
    }

    const { data: orgRow, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('settings')
      .eq('id', orgId)
      .single()

    if (orgError) {
      return json({ error: `Organização não encontrada: ${orgError.message}` }, 404)
    }

    let userId: string | null = null
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
      data: {
        nome_completo: adminName || adminEmail,
        org_id: orgId,
        role: 'org_admin',
      },
    })

    if (inviteResult.error) {
      const { data: existingAuth, error: existingAuthError } =
        await supabaseAdmin.auth.admin.getUserByEmail(adminEmail)

      if (!existingAuthError && existingAuth?.user) {
        userId = existingAuth.user.id
      } else {
        const { data: createdUser, error: createdUserError } =
          await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            email_confirm: false,
            user_metadata: {
              nome_completo: adminName || adminEmail,
              org_id: orgId,
              role: 'org_admin',
            },
          })

        if (createdUserError) {
          return json({ error: inviteResult.error.message }, 400)
        }

        userId = createdUser.user?.id ?? null
      }
    } else {
      userId = inviteResult.data?.user?.id ?? null
    }

    if (!userId) {
      return json({ error: 'Não foi possível determinar o usuário admin' }, 400)
    }

    const { data: usuarioRow } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes, nome_completo')
      .eq('id', userId)
      .single()

    const permissoes = new Set<string>(usuarioRow?.permissoes ?? [])
    permissoes.add('org_admin')

    const nextNome =
      adminName ||
      usuarioRow?.nome_completo ||
      adminEmail

    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nome_completo: nextNome,
        permissoes: Array.from(permissoes),
        status: 'ativo',
      })
      .eq('id', userId)

    if (usuarioError) {
      return json({ error: usuarioError.message }, 400)
    }

    const { error: memberError } = await supabaseAdmin
      .from('org_members')
      .upsert(
        {
          org_id: orgId,
          user_id: userId,
          role: 'admin',
          ativo: true,
        },
        { onConflict: 'org_id,user_id' }
      )

    if (memberError) {
      return json({ error: memberError.message }, 400)
    }

    const nextSettings = {
      ...(orgRow?.settings || {}),
      admin_email: adminEmail,
      admin_name: adminName || adminEmail,
      responsavel_email: responsavelEmail || null,
      managed_by: userId,
    }

    const { error: updateOrgError } = await supabaseAdmin
      .from('orgs')
      .update({ settings: nextSettings })
      .eq('id', orgId)

    if (updateOrgError) {
      return json({ error: updateOrgError.message }, 400)
    }

    return json({ ok: true, userId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return json({ error: message }, 500)
  }
})
