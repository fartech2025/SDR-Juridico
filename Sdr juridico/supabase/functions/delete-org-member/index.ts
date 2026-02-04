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

    const body = await req.json()
    const { orgId, userId } = body as { orgId?: string; userId?: string }

    if (!orgId || !userId) {
      return json({ error: 'orgId e userId sao obrigatorios' }, 400)
    }

    if (callerId === userId) {
      return json({ error: 'Voce nao pode remover a si mesmo.' }, 400)
    }

    // Permissao: fartech_admin ou org admin/gestor da orgId
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
      return json({ error: 'Sem permissao para remover usuarios desta organizacao.' }, 403)
    }

    // Remover membership
    await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId)

    // Remover registro em usuarios
    await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', userId)

    // Remover do Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      // Retornar ok, mas avisar que Auth falhou
      return json({ ok: true, warning: 'Usuario removido do banco, mas falhou no Auth: ' + deleteAuthError.message })
    }

    return json({ ok: true, message: 'Usuario removido com sucesso.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na edge function delete-org-member:', message, error)
    return json({ error: message }, 500)
  }
})
