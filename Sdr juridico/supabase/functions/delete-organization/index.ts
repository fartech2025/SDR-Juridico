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
    const { orgId, confirmSlug } = body as { orgId?: string; confirmSlug?: string }

    if (!orgId) {
      return json({ error: 'orgId e obrigatorio' }, 400)
    }

    // --- Verificar se a organização existe ---
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('id, name, slug')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return json({ error: 'Organizacao nao encontrada' }, 404)
    }

    // --- Confirmação de segurança: slug deve bater ---
    if (confirmSlug && confirmSlug.trim() !== (org.slug || '').trim()) {
      return json({ error: `Slug de confirmacao nao corresponde. Esperado: "${(org.slug || '').trim()}", recebido: "${confirmSlug.trim()}". Operacao cancelada.` }, 400)
    }

    // --- Permissão: somente fartech_admin ou owner da org ---
    const { data: callerUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('permissoes')
      .eq('id', callerId)
      .single()

    const isFartechAdmin = (callerUsuario?.permissoes || []).includes('fartech_admin')

    let isOrgOwner = false
    if (!isFartechAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('org_members')
        .select('role, ativo')
        .eq('org_id', orgId)
        .eq('user_id', callerId)
        .maybeSingle()
      isOrgOwner = !!membership && membership.ativo !== false && membership.role === 'admin'
    }

    if (!isFartechAdmin && !isOrgOwner) {
      return json({ error: 'Sem permissao para excluir esta organizacao. Apenas fartech_admin ou o owner podem excluir.' }, 403)
    }

    // --- Buscar membros da org (para limpeza de auth depois) ---
    const { data: members } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)

    const memberUserIds = (members || []).map((m: { user_id: string }) => m.user_id)

    // --- Exclusão em cascata ---
    // IMPORTANTE: Respeitar ordem de FK. Algumas tabelas NÃO têm org_id,
    // referenciam outras tabelas via FK. Precisamos buscar IDs intermediários
    // e deletar filhos antes dos pais.
    const deletionLog: string[] = []

    // Helper: delete simples por org_id
    const deleteByOrg = async (table: string) => {
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq('org_id', orgId)
        if (error) {
          // Tabela pode não existir no banco
          if (error.message?.includes('does not exist') || error.code === '42P01') {
            deletionLog.push(`${table}: SKIP (tabela nao existe)`)
          } else {
            console.error(`Erro ao deletar de ${table}:`, error.message)
            deletionLog.push(`${table}: ERRO - ${error.message}`)
          }
        } else {
          deletionLog.push(`${table}: OK`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        deletionLog.push(`${table}: SKIP - ${msg}`)
      }
    }

    // Helper: delete por coluna/valor específicos (para tabelas sem org_id)
    const deleteByColumn = async (table: string, column: string, values: string[]) => {
      if (!values.length) {
        deletionLog.push(`${table}: SKIP (sem registros pais)`)
        return
      }
      try {
        const { error } = await supabaseAdmin.from(table).delete().in(column, values)
        if (error) {
          if (error.message?.includes('does not exist') || error.code === '42P01') {
            deletionLog.push(`${table}: SKIP (tabela nao existe)`)
          } else {
            console.error(`Erro ao deletar de ${table}:`, error.message)
            deletionLog.push(`${table}: ERRO - ${error.message}`)
          }
        } else {
          deletionLog.push(`${table}: OK`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        deletionLog.push(`${table}: SKIP - ${msg}`)
      }
    }

    // Helper: buscar IDs de uma tabela
    const getIds = async (table: string, column: string, value: string): Promise<string[]> => {
      try {
        const { data } = await supabaseAdmin.from(table).select('id').eq(column, value)
        return (data || []).map((r: { id: string }) => r.id)
      } catch {
        return []
      }
    }

    // ============================================================
    // PASSO 1: Buscar IDs de tabelas intermediárias que NÃO têm org_id
    //          mas são referenciadas por tabelas filhas
    // ============================================================

    // 1a. Buscar IDs de casos da org (necessário para processos_favoritos, datajud_sync_jobs)
    const casoIds = await getIds('casos', 'org_id', orgId)

    // 1b. Buscar IDs de datajud_processos da org
    const datajudProcessoIds = await getIds('datajud_processos', 'org_id', orgId)

    // 1c. Buscar IDs de dou_termos_monitorados da org
    const douTermoIds = await getIds('dou_termos_monitorados', 'org_id', orgId)

    // 1d. Buscar IDs de processos_favoritos (referenciados por caso_id)
    let processoFavoritoIds: string[] = []
    if (casoIds.length) {
      try {
        const { data } = await supabaseAdmin.from('processos_favoritos').select('id').in('caso_id', casoIds)
        processoFavoritoIds = (data || []).map((r: { id: string }) => r.id)
      } catch { /* tabela pode não existir */ }
    }
    // Também buscar por user_id dos membros (processos_favoritos usa user_id, não org_id)
    if (memberUserIds.length) {
      try {
        const { data } = await supabaseAdmin.from('processos_favoritos').select('id').in('user_id', memberUserIds)
        const extraIds = (data || []).map((r: { id: string }) => r.id)
        processoFavoritoIds = [...new Set([...processoFavoritoIds, ...extraIds])]
      } catch { /* tabela pode não existir */ }
    }

    // 1e. Buscar IDs de tarefas da org (para tarefa_documentos, tarefa_status_history)
    const tarefaIds = await getIds('tarefas', 'org_id', orgId)

    // 1f. Buscar IDs de leads da org
    const leadIds = await getIds('leads', 'org_id', orgId)

    // ============================================================
    // PASSO 2: Deletar tabelas folha (sem dependentes) primeiro
    // ============================================================

    // DataJud: datajud_movimentacoes -> datajud_processos (ON DELETE CASCADE, mas deletar explícito por segurança)
    await deleteByColumn('datajud_movimentacoes', 'datajud_processo_id', datajudProcessoIds)

    // DataJud: datajud_sync_jobs referencia casos(id) SEM CASCADE — deletar ANTES de casos
    await deleteByOrg('datajud_sync_jobs')

    // DataJud: datajud_processos (tem org_id)
    await deleteByOrg('datajud_processos')

    // DataJud: datajud_api_calls (tem org_id)
    await deleteByOrg('datajud_api_calls')

    // DOU: dou_publicacoes pode ter termo_id -> dou_termos_monitorados, deletar primeiro
    await deleteByColumn('dou_publicacoes', 'termo_id', douTermoIds)
    // Fallback: também tentar por org_id se a tabela tiver
    await deleteByOrg('dou_publicacoes')

    await deleteByOrg('dou_sync_logs')
    await deleteByOrg('dou_termos_monitorados')

    // Processos jurídicos: movimentacoes_detectadas -> processos_favoritos (ON DELETE CASCADE)
    await deleteByColumn('movimentacoes_detectadas', 'processo_favorito_id', processoFavoritoIds)

    // historico_consultas (usa user_id, não org_id)
    await deleteByColumn('historico_consultas', 'user_id', memberUserIds)

    // processos_favoritos (usa user_id, não org_id)
    await deleteByColumn('processos_favoritos', 'user_id', memberUserIds)

    // Tarefas: tarefa_documentos e tarefa_status_history (têm org_id)
    await deleteByOrg('tarefa_documentos')
    await deleteByOrg('tarefa_status_history')
    await deleteByOrg('tarefas')

    // Timeline / notificações
    await deleteByOrg('timeline_events')
    await deleteByOrg('notificacoes')
    await deleteByOrg('notas')

    // Documentos e agenda
    await deleteByOrg('documentos')
    await deleteByOrg('agendamentos')

    // Leads: lead_status_history antes de leads
    await deleteByOrg('lead_status_history')
    await deleteByOrg('lead_scoring_configs')
    await deleteByOrg('leads')

    // Casos e clientes (casos antes por FK de leads e documentos)
    await deleteByOrg('casos')
    await deleteByOrg('clientes')

    // Monitoramento e analytics
    await deleteByOrg('alertas')
    await deleteByOrg('analytics_events')
    await deleteByOrg('active_sessions')
    await deleteByOrg('org_features')
    await deleteByOrg('integrations')

    // Remover memberships
    await deleteByOrg('org_members')

    // Deletar audit_log por ÚLTIMO (tabela se chama audit_log, não audit_logs).
    // Deve ser feito DEPOIS de todas as outras exclusões, pois os triggers
    // de auditoria (audit_org_members, audit_orgs, etc.) inserem registros
    // em audit_log durante as exclusões acima. A FK audit_log.org_id -> orgs(id)
    // NÃO tem ON DELETE CASCADE, então precisamos limpar antes de deletar a org.
    await deleteByOrg('audit_log')

    // ============================================================
    // PASSO 3: Deletar a organização
    // ============================================================
    const { error: deleteOrgError } = await supabaseAdmin
      .from('orgs')
      .delete()
      .eq('id', orgId)

    if (deleteOrgError) {
      console.error('Erro ao deletar org:', deleteOrgError.message)
      return json({
        error: 'Falha ao deletar a organizacao: ' + deleteOrgError.message,
        deletionLog,
      }, 500)
    }

    deletionLog.push('orgs: OK')

    // ============================================================
    // PASSO 4: Limpar usuários que pertenciam APENAS a esta org
    // ============================================================
    const authCleanup: string[] = []
    for (const userId of memberUserIds) {
      // Não deletar o caller
      if (userId === callerId) {
        authCleanup.push(`${userId}: SKIP (caller)`)
        continue
      }

      // Verificar se o usuário pertence a outra org
      const { data: otherMemberships } = await supabaseAdmin
        .from('org_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (otherMemberships && otherMemberships.length > 0) {
        authCleanup.push(`${userId}: SKIP (pertence a outra org)`)
        continue
      }

      // Deletar do banco usuarios
      await supabaseAdmin.from('usuarios').delete().eq('id', userId)

      // Deletar do Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteAuthError) {
        authCleanup.push(`${userId}: Auth ERRO - ${deleteAuthError.message}`)
      } else {
        authCleanup.push(`${userId}: REMOVIDO`)
      }
    }

    return json({
      ok: true,
      message: `Organizacao "${org.name}" (${org.slug}) excluida com sucesso.`,
      deletionLog,
      authCleanup,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na edge function delete-organization:', message, error)
    return json({ error: message }, 500)
  }
})
