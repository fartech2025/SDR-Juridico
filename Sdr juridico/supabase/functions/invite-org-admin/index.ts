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
    console.log('🚀 Edge Function invite-org-admin chamada')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas')
      return json({ error: 'Variáveis de ambiente não configuradas' }, 500)
    }

    console.log('✅ Variáveis de ambiente OK')

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      console.error('❌ Token ausente no header')
      return json({ error: 'Token ausente' }, 401)
    }

    console.log('🔑 Validando token...')
    
    // Criar cliente admin para operações de serviço
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validar token usando auth.getUser com o token do usuário
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      console.error('❌ Token inválido:', authError?.message)
      return json({ error: 'Token inválido: ' + (authError?.message || 'Usuário não encontrado') }, 401)
    }

    console.log('✅ Token válido para usuário:', authData.user.id)

    console.log('🔍 Verificando permissões do usuário...')
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes')
      .eq('id', authData.user.id)
      .single()

    if (requesterError) {
      console.error('❌ Erro ao buscar usuário na tabela usuarios:', requesterError.message)
      return json({ error: 'Erro ao verificar permissões: ' + requesterError.message }, 500)
    }

    if (!(requester?.permissoes || []).includes('fartech_admin')) {
      console.error('❌ Usuário sem permissão fartech_admin:', requester?.permissoes)
      return json({ error: 'Sem permissão para convidar admin. Permissão fartech_admin necessária.' }, 403)
    }

    console.log('✅ Usuário tem permissão fartech_admin')

    const body = await req.json()
    const { orgId, adminEmail, adminName, responsavelEmail } = body
    
    console.log('📦 Dados recebidos:', { orgId, adminEmail, adminName, responsavelEmail })

    if (!orgId || !adminEmail) {
      console.error('❌ Parâmetros obrigatórios ausentes')
      return json({ error: 'orgId e adminEmail são obrigatórios' }, 400)
    }

    console.log('🔍 Buscando organização:', orgId)
    const { data: orgRow, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('settings')
      .eq('id', orgId)
      .single()

    if (orgError) {
      console.error('❌ Organização não encontrada:', orgError.message)
      return json({ error: `Organização não encontrada: ${orgError.message}` }, 404)
    }

    console.log('✅ Organização encontrada')

    let userId: string | null = null
    
    console.log('📧 Enviando convite por e-mail para:', adminEmail)
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
      data: {
        nome_completo: adminName || adminEmail,
        org_id: orgId,
        role: 'org_admin',
      },
    })

    if (inviteResult.error) {
      console.log('⚠️ Erro ao enviar convite (usuário pode já existir):', inviteResult.error.message)
      
      console.log('🔍 Verificando se usuário já existe...')
      const { data: existingAuth, error: existingAuthError } =
        await supabaseAdmin.auth.admin.getUserByEmail(adminEmail)

      if (!existingAuthError && existingAuth?.user) {
        console.log('✅ Usuário já existe, usando ID:', existingAuth.user.id)
        userId = existingAuth.user.id
      } else {
        console.log('⚠️ Criando novo usuário manualmente...')
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
          console.error('❌ Erro ao criar usuário:', createdUserError.message)
          return json({ error: 'Erro ao criar usuário: ' + createdUserError.message }, 400)
        }

        console.log('✅ Usuário criado:', createdUser.user?.id)
        userId = createdUser.user?.id ?? null
      }
    } else {
      console.log('✅ Convite enviado com sucesso')
      userId = inviteResult.data?.user?.id ?? null
    }

    if (!userId) {
      console.error('❌ Não foi possível determinar o usuário admin')
      return json({ error: 'Não foi possível determinar o usuário admin' }, 400)
    }

    console.log('✅ User ID determinado:', userId)

    console.log('🔍 Buscando dados do usuário na tabela usuarios...')
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

    console.log('💾 Atualizando usuário na tabela usuarios...')
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nome_completo: nextNome,
        permissoes: Array.from(permissoes),
        status: 'ativo',
      })
      .eq('id', userId)

    if (usuarioError) {
      console.error('❌ Erro ao atualizar usuário:', usuarioError.message)
      return json({ error: 'Erro ao atualizar usuário: ' + usuarioError.message }, 400)
    }

    console.log('✅ Usuário atualizado')

    console.log('💾 Adicionando usuário ao org_members...')
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
      console.error('❌ Erro ao adicionar membro:', memberError.message)
      return json({ error: 'Erro ao adicionar membro: ' + memberError.message }, 400)
    }

    console.log('✅ Membro adicionado')

    const nextSettings = {
      ...(orgRow?.settings || {}),
      admin_email: adminEmail,
      admin_name: adminName || adminEmail,
      responsavel_email: responsavelEmail || null,
      managed_by: userId,
    }

    console.log('💾 Atualizando settings da organização...')
    const { error: updateOrgError } = await supabaseAdmin
      .from('orgs')
      .update({ settings: nextSettings })
      .eq('id', orgId)

    if (updateOrgError) {
      console.error('❌ Erro ao atualizar organização:', updateOrgError.message)
      return json({ error: 'Erro ao atualizar organização: ' + updateOrgError.message }, 400)
    }

    console.log('✅ Organização atualizada')
    console.log('🎉 Convite enviado com sucesso!')
    
    return json({ ok: true, userId, message: 'Convite enviado com sucesso' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro não capturado:', message, error)
    return json({ error: message }, 500)
  }
})
