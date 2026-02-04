import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
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
      return json({ error: 'Variaveis de ambiente nao configuradas' }, 500)
    }

    // Validate caller token
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return json({ error: 'Token ausente' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      return json({ error: 'Token invalido: ' + (authError?.message || 'Usuario nao encontrado') }, 401)
    }

    const callerId = authData.user.id

    // Parse request body
    const body = await req.json()
    const { orgId, email, nome, role } = body

    if (!orgId || !email || !nome || !role) {
      return json({ error: 'orgId, email, nome e role sao obrigatorios' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return json({ error: 'Email invalido' }, 400)
    }

    // Validate role
    const validRoles = ['admin', 'gestor', 'advogado', 'secretaria', 'leitura']
    if (!validRoles.includes(role)) {
      return json({ error: 'Role invalido. Valores aceitos: ' + validRoles.join(', ') }, 400)
    }

    // Check caller is org_admin or fartech_admin for this org
    const { data: callerMember } = await supabaseAdmin
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', callerId)
      .eq('ativo', true)
      .single()

    const { data: callerUser } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes')
      .eq('id', callerId)
      .single()

    const isFartechAdmin = (callerUser?.permissoes || []).includes('fartech_admin')
    const isOrgAdmin = callerMember?.role === 'admin' || callerMember?.role === 'gestor'

    if (!isFartechAdmin && !isOrgAdmin) {
      return json({ error: 'Sem permissao. Apenas administradores da organizacao podem convidar membros.' }, 403)
    }

    // Verify organization exists and check max_users
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('id, name, max_users')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return json({ error: 'Organizacao nao encontrada' }, 404)
    }

    // Check user count limit
    const { count: currentUserCount } = await supabaseAdmin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('ativo', true)

    if (org.max_users && currentUserCount !== null && currentUserCount >= org.max_users) {
      return json({ error: `Limite de usuarios atingido (${org.max_users}). Entre em contato para aumentar o plano.` }, 400)
    }

    // Invite or create user
    let userId: string | null = null
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedNome = nome.trim()

    // Try invite by email first
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmedEmail, {
      data: {
        nome_completo: trimmedNome,
        org_id: orgId,
        role,
      },
    })

    if (inviteResult.error) {
      // User may already exist - check
      const { data: existingAuth, error: existingAuthError } =
        await supabaseAdmin.auth.admin.getUserByEmail(trimmedEmail)

      if (!existingAuthError && existingAuth?.user) {
        userId = existingAuth.user.id
      } else {
        // Create user manually
        const { data: createdUser, error: createdUserError } =
          await supabaseAdmin.auth.admin.createUser({
            email: trimmedEmail,
            email_confirm: false,
            user_metadata: {
              nome_completo: trimmedNome,
              org_id: orgId,
              role,
            },
          })

        if (createdUserError) {
          return json({ error: 'Erro ao criar usuario: ' + createdUserError.message }, 400)
        }

        userId = createdUser.user?.id ?? null
      }
    } else {
      userId = inviteResult.data?.user?.id ?? null
    }

    if (!userId) {
      return json({ error: 'Nao foi possivel determinar o usuario' }, 400)
    }

    // Determine permissoes based on role
    const permissoes = role === 'admin' || role === 'gestor' ? ['org_admin'] : ['user']

    // Upsert to usuarios table
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .upsert(
        {
          id: userId,
          email: trimmedEmail,
          nome_completo: trimmedNome,
          permissoes,
        },
        { onConflict: 'id' },
      )

    if (usuarioError) {
      return json({ error: 'Erro ao atualizar usuario: ' + usuarioError.message }, 400)
    }

    // Upsert to org_members table
    const { error: memberError } = await supabaseAdmin
      .from('org_members')
      .upsert(
        {
          org_id: orgId,
          user_id: userId,
          role,
          ativo: true,
        },
        { onConflict: 'org_id,user_id' },
      )

    if (memberError) {
      return json({ error: 'Erro ao adicionar membro: ' + memberError.message }, 400)
    }

    return json({
      ok: true,
      userId,
      message: `Usuario ${trimmedNome} convidado com sucesso para ${org.name || 'a organizacao'}.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na edge function invite-org-member:', message, error)
    return json({ error: message }, 500)
  }
})
