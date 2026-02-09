import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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

    // MOVER PARSE DO BODY PARA AQUI (FIX: estava tentando acessar body antes de definir)
    const body = await req.json()
    const { orgId, adminEmail, adminName, responsavelEmail } = body

    console.log('📦 Dados recebidos:', { orgId, adminEmail, adminName, responsavelEmail })

    // Validar parâmetros obrigatórios
    if (!orgId || !adminEmail) {
      console.error('❌ Parâmetros obrigatórios ausentes')
      return json({ error: 'orgId e adminEmail são obrigatórios' }, 400)
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      console.error('❌ Email inválido')
      return json({ error: 'Email inválido' }, 400)
    }

    console.log('✅ Validações de parâmetros OK')
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
    let inviteLink: string | null = null
    
    console.log('📧 Enviando convite por e-mail para:', adminEmail)
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
      redirectTo: `${appUrl}/auth/callback`,
      data: {
        nome_completo: adminName || adminEmail,
        org_id: orgId,
        role: 'org_admin',
        must_change_password: true,
      },
    })

    if (inviteResult.error) {
      console.log('⚠️ inviteUserByEmail falhou (usuário pode já existir):', inviteResult.error.message)
      
      // Tentar gerar link de convite via generateLink (funciona para usuários existentes)
      console.log('🔍 Tentando generateLink para usuário existente...')
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: adminEmail,
      })

      if (!linkError && linkData?.user) {
        console.log('✅ Magic link gerado para usuário existente:', linkData.user.id)
        userId = linkData.user.id
        // O generateLink com type magiclink envia email automaticamente no Supabase
        inviteLink = linkData.properties?.action_link || null
        console.log('📧 Link de acesso gerado:', inviteLink ? 'sim' : 'não disponível')
      } else {
        console.log('⚠️ generateLink falhou:', linkError?.message)
        
        // Último recurso: buscar usuário existente via listUsers
        console.log('🔍 Buscando usuário via listUsers...')
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })
        const existingUser = listData?.users?.find(
          (u: { email?: string }) => u.email === adminEmail
        )

        if (existingUser) {
          console.log('✅ Usuário encontrado:', existingUser.id)
          userId = existingUser.id
        } else {
          // Criar novo usuário
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

          // Gerar link de convite para o novo usuário
          const { data: newLinkData } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: adminEmail,
          })
          inviteLink = newLinkData?.properties?.action_link || null
        }
      }
    } else {
      console.log('✅ Convite enviado com sucesso (email automático)')
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

    console.log('💾 Atualizando/criando usuário na tabela usuarios...')
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          nome_completo: nextNome,
          permissoes: Array.from(permissoes),
        },
        { onConflict: 'id' }
      )

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
    console.log('🎉 Convite processado com sucesso!')
    
    return json({ 
      ok: true, 
      userId, 
      inviteLink: inviteLink || null,
      message: inviteLink 
        ? 'Convite processado. Link de acesso gerado.' 
        : 'Convite enviado com sucesso por email.'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro não capturado:', message, error)
    return json({ error: message }, 500)
  }
})
