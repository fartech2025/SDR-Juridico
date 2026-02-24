import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // --- Autenticação ---
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

    // --- Body ---
    const body = await req.json()
    const { orgId, userId, password, sendEmail, action } = body as {
      orgId?: string
      userId?: string
      password?: string
      sendEmail?: boolean
      action?: string
    }

    if (!orgId) {
      return json({ error: 'orgId e obrigatorio' }, 400)
    }

    // --- Permissão: fartech_admin ou org admin/gestor ---
    const { data: callerUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes')
      .eq('id', callerId)
      .single()

    const isFartechAdmin = (callerUsuario?.permissoes || []).includes('fartech_admin')

    let isOrgAdmin = false
    if (!isFartechAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('org_members')
        .select('role, ativo')
        .eq('org_id', orgId)
        .eq('user_id', callerId)
        .maybeSingle()
      isOrgAdmin = !!membership && membership.ativo !== false && ['admin', 'gestor'].includes(membership.role || '')
    }

    if (!isFartechAdmin && !isOrgAdmin) {
      return json({ error: 'Sem permissao para resetar senhas nesta organizacao.' }, 403)
    }

    // --- Modo LIST: retornar membros da org ---
    if (action === 'list' || !userId) {
      const { data: members, error: membersError } = await supabaseAdmin
        .from('org_members')
        .select('user_id, role, ativo')
        .eq('org_id', orgId)

      if (membersError) {
        return json({ error: 'Erro ao buscar membros: ' + membersError.message }, 500)
      }

      // Buscar dados dos usuários
      const memberList = []
      for (const m of (members || [])) {
        let email = '\u2014'
        let nome = '\u2014'
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(m.user_id)
          if (userData?.user) {
            email = userData.user.email || '\u2014'
            nome = userData.user.user_metadata?.nome_completo || userData.user.user_metadata?.name || email
          }
        } catch { /* skip */ }
        memberList.push({
          user_id: m.user_id,
          email,
          nome,
          role: m.role || 'user',
          ativo: m.ativo !== false,
        })
      }

      return json({ ok: true, members: memberList })
    }

    // --- Verificar se o usuário alvo pertence à mesma org ---
    const { data: targetMembership } = await supabaseAdmin
      .from('org_members')
      .select('id, ativo')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!targetMembership) {
      return json({ error: 'Usuario nao pertence a esta organizacao.' }, 404)
    }

    // --- Buscar email do usuário alvo ---
    const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetUserError || !targetUser?.user) {
      return json({ error: 'Usuario nao encontrado no Auth: ' + (targetUserError?.message || 'nao encontrado') }, 404)
    }

    const targetEmail = targetUser.user.email

    // --- Modo 1: Definir senha diretamente ---
    if (password) {
      if (password.length < 6) {
        return json({ error: 'A senha deve ter no minimo 6 caracteres.' }, 400)
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      })

      if (updateError) {
        return json({ error: 'Falha ao redefinir senha: ' + updateError.message }, 500)
      }

      // Registrar no audit_log
      await supabaseAdmin.from('audit_logs').insert({
        org_id: orgId,
        user_id: callerId,
        action: 'update',
        entity_type: 'user_password',
        entity_id: userId,
        new_data: { action: 'password_reset_direct', target_email: targetEmail },
      })

      return json({
        ok: true,
        mode: 'direct',
        message: `Senha do usuario ${targetEmail} redefinida com sucesso.`,
      })
    }

    // --- Modo 2: Enviar email de recuperação (padrão) ---
    if (sendEmail !== false) {
      if (!targetEmail) {
        return json({ error: 'Usuario nao possui email cadastrado.' }, 400)
      }

      // Gerar link de recuperação via Admin API
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetEmail,
      })

      if (linkError) {
        return json({ error: 'Falha ao gerar link de recuperacao: ' + linkError.message }, 500)
      }

      // Registrar no audit_log
      await supabaseAdmin.from('audit_logs').insert({
        org_id: orgId,
        user_id: callerId,
        action: 'update',
        entity_type: 'user_password',
        entity_id: userId,
        new_data: { action: 'password_reset_email', target_email: targetEmail },
      })

      return json({
        ok: true,
        mode: 'email',
        message: `Email de recuperacao de senha enviado para ${targetEmail}.`,
        actionLink: linkData?.properties?.action_link || null,
      })
    }

    return json({ error: 'Informe "password" para redefinir diretamente ou "sendEmail: true" para enviar email de recuperacao.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na edge function reset-member-password:', message, error)
    return json({ error: message }, 500)
  }
})
