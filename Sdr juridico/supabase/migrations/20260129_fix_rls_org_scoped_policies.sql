-- ============================================================
-- MIGRATION: 20260129_fix_rls_org_scoped_policies.sql
-- Descricao: Restaurar policies org-scoped para todas as tabelas
--            que atualmente so tem policies fartech_admin.
-- Problema:  Gestores e advogados nao conseguem ver dados porque
--            as policies org-scoped foram removidas/substituidas.
-- Data: 29 de janeiro de 2026
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: LEADS
-- Gestor (org_admin): manage (CRUD completo)
-- Advogado (user): create, read, update
-- ============================================================

-- SELECT: membros da org podem ver leads da sua org
DROP POLICY IF EXISTS "leads_select_org_member" ON public.leads;
CREATE POLICY "leads_select_org_member"
ON public.leads FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar leads na sua org
DROP POLICY IF EXISTS "leads_insert_org_member" ON public.leads;
CREATE POLICY "leads_insert_org_member"
ON public.leads FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar leads da sua org
DROP POLICY IF EXISTS "leads_update_org_member" ON public.leads;
CREATE POLICY "leads_update_org_member"
ON public.leads FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: somente admin/gestor da org pode deletar leads
DROP POLICY IF EXISTS "leads_delete_org_admin" ON public.leads;
CREATE POLICY "leads_delete_org_admin"
ON public.leads FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 2: CLIENTES
-- Gestor (org_admin): manage (CRUD completo)
-- Advogado (user): create, read, update
-- ============================================================

-- SELECT: membros da org podem ver clientes da sua org
DROP POLICY IF EXISTS "clientes_select_org_member" ON public.clientes;
CREATE POLICY "clientes_select_org_member"
ON public.clientes FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar clientes na sua org
DROP POLICY IF EXISTS "clientes_insert_org_member" ON public.clientes;
CREATE POLICY "clientes_insert_org_member"
ON public.clientes FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar clientes da sua org
DROP POLICY IF EXISTS "clientes_update_org_member" ON public.clientes;
CREATE POLICY "clientes_update_org_member"
ON public.clientes FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: somente admin/gestor da org pode deletar clientes
DROP POLICY IF EXISTS "clientes_delete_org_admin" ON public.clientes;
CREATE POLICY "clientes_delete_org_admin"
ON public.clientes FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 3: CASOS
-- Gestor (org_admin): manage (CRUD completo)
-- Advogado (user): create, read, update
-- ============================================================

-- SELECT: membros da org podem ver casos da sua org
DROP POLICY IF EXISTS "casos_select_org_member" ON public.casos;
CREATE POLICY "casos_select_org_member"
ON public.casos FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar casos na sua org
DROP POLICY IF EXISTS "casos_insert_org_member" ON public.casos;
CREATE POLICY "casos_insert_org_member"
ON public.casos FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar casos da sua org
DROP POLICY IF EXISTS "casos_update_org_member" ON public.casos;
CREATE POLICY "casos_update_org_member"
ON public.casos FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: somente admin/gestor da org pode deletar casos
DROP POLICY IF EXISTS "casos_delete_org_admin" ON public.casos;
CREATE POLICY "casos_delete_org_admin"
ON public.casos FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 4: DOCUMENTOS
-- Gestor (org_admin): manage (CRUD completo)
-- Advogado (user): create, read, update
-- Nota: ja existe documentos_via_tarefa_select para advogados
--       verem docs de suas tarefas, mas precisam ver docs da org tambem
-- ============================================================

-- SELECT: membros da org podem ver documentos da sua org
DROP POLICY IF EXISTS "documentos_select_org_member" ON public.documentos;
CREATE POLICY "documentos_select_org_member"
ON public.documentos FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar documentos na sua org
DROP POLICY IF EXISTS "documentos_insert_org_member" ON public.documentos;
CREATE POLICY "documentos_insert_org_member"
ON public.documentos FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar documentos da sua org
DROP POLICY IF EXISTS "documentos_update_org_member" ON public.documentos;
CREATE POLICY "documentos_update_org_member"
ON public.documentos FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: somente admin/gestor da org pode deletar documentos
DROP POLICY IF EXISTS "documentos_delete_org_admin" ON public.documentos;
CREATE POLICY "documentos_delete_org_admin"
ON public.documentos FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 5: AGENDAMENTOS
-- Gestor (org_admin): manage (CRUD completo)
-- Advogado (user): create, read, update, delete (seus proprios)
-- ============================================================

-- SELECT: membros da org podem ver agendamentos da sua org
DROP POLICY IF EXISTS "agendamentos_select_org_member" ON public.agendamentos;
CREATE POLICY "agendamentos_select_org_member"
ON public.agendamentos FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar agendamentos na sua org
DROP POLICY IF EXISTS "agendamentos_insert_org_member" ON public.agendamentos;
CREATE POLICY "agendamentos_insert_org_member"
ON public.agendamentos FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar agendamentos da sua org
DROP POLICY IF EXISTS "agendamentos_update_org_member" ON public.agendamentos;
CREATE POLICY "agendamentos_update_org_member"
ON public.agendamentos FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: admin/gestor pode deletar qualquer agendamento da org
-- advogado pode deletar seus proprios
DROP POLICY IF EXISTS "agendamentos_delete_org_admin" ON public.agendamentos;
CREATE POLICY "agendamentos_delete_org_admin"
ON public.agendamentos FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

DROP POLICY IF EXISTS "agendamentos_delete_own" ON public.agendamentos;
CREATE POLICY "agendamentos_delete_own"
ON public.agendamentos FOR DELETE
USING (
  is_org_member(org_id) AND owner_user_id = auth.uid()
);

-- ============================================================
-- PARTE 6: NOTAS
-- Membros da org podem CRUD notas da sua org
-- ============================================================

-- SELECT: membros da org podem ver notas
DROP POLICY IF EXISTS "notas_select_org_member" ON public.notas;
CREATE POLICY "notas_select_org_member"
ON public.notas FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar notas
DROP POLICY IF EXISTS "notas_insert_org_member" ON public.notas;
CREATE POLICY "notas_insert_org_member"
ON public.notas FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar notas
DROP POLICY IF EXISTS "notas_update_org_member" ON public.notas;
CREATE POLICY "notas_update_org_member"
ON public.notas FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- DELETE: admin/gestor pode deletar notas
DROP POLICY IF EXISTS "notas_delete_org_admin" ON public.notas;
CREATE POLICY "notas_delete_org_admin"
ON public.notas FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 7: CONVERSAS
-- Membros da org podem ver conversas da sua org
-- ============================================================

-- SELECT: membros da org podem ver conversas
DROP POLICY IF EXISTS "conversas_select_org_member" ON public.conversas;
CREATE POLICY "conversas_select_org_member"
ON public.conversas FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: membros da org podem criar conversas
DROP POLICY IF EXISTS "conversas_insert_org_member" ON public.conversas;
CREATE POLICY "conversas_insert_org_member"
ON public.conversas FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- UPDATE: membros da org podem atualizar conversas
DROP POLICY IF EXISTS "conversas_update_org_member" ON public.conversas;
CREATE POLICY "conversas_update_org_member"
ON public.conversas FOR UPDATE
USING (
  is_org_member(org_id)
)
WITH CHECK (
  is_org_member(org_id)
);

-- ============================================================
-- PARTE 8: MENSAGENS
-- Membros da org podem ver mensagens das conversas da sua org
-- ============================================================

-- SELECT: membros da org podem ver mensagens (via conversa)
DROP POLICY IF EXISTS "mensagens_select_org_member" ON public.mensagens;
CREATE POLICY "mensagens_select_org_member"
ON public.mensagens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND is_org_member(c.org_id)
  )
);

-- INSERT: membros da org podem criar mensagens
DROP POLICY IF EXISTS "mensagens_insert_org_member" ON public.mensagens;
CREATE POLICY "mensagens_insert_org_member"
ON public.mensagens FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND is_org_member(c.org_id)
  )
);

-- UPDATE: membros da org podem atualizar mensagens
DROP POLICY IF EXISTS "mensagens_update_org_member" ON public.mensagens;
CREATE POLICY "mensagens_update_org_member"
ON public.mensagens FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND is_org_member(c.org_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND is_org_member(c.org_id)
  )
);

-- ============================================================
-- PARTE 9: ORG_MEMBERS
-- Membros da org podem ver outros membros da mesma org
-- Admin/gestor pode gerenciar membros
-- ============================================================

-- SELECT: membros da org veem quem esta na mesma org
DROP POLICY IF EXISTS "org_members_select_org_member" ON public.org_members;
CREATE POLICY "org_members_select_org_member"
ON public.org_members FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: admin/gestor pode adicionar membros
DROP POLICY IF EXISTS "org_members_insert_org_admin" ON public.org_members;
CREATE POLICY "org_members_insert_org_admin"
ON public.org_members FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- UPDATE: admin/gestor pode atualizar membros
DROP POLICY IF EXISTS "org_members_update_org_admin" ON public.org_members;
CREATE POLICY "org_members_update_org_admin"
ON public.org_members FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DELETE: admin/gestor pode remover membros
DROP POLICY IF EXISTS "org_members_delete_org_admin" ON public.org_members;
CREATE POLICY "org_members_delete_org_admin"
ON public.org_members FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 10: ORGS
-- Membros podem ver sua org
-- Admin/gestor pode atualizar sua org
-- ============================================================

-- SELECT: membros podem ver sua organizacao
DROP POLICY IF EXISTS "orgs_select_org_member" ON public.orgs;
CREATE POLICY "orgs_select_org_member"
ON public.orgs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = orgs.id
      AND om.user_id = auth.uid()
      AND om.ativo = true
  )
);

-- UPDATE: admin/gestor pode atualizar sua org
DROP POLICY IF EXISTS "orgs_update_org_admin" ON public.orgs;
CREATE POLICY "orgs_update_org_admin"
ON public.orgs FOR UPDATE
USING (
  is_org_admin_for_org(id)
)
WITH CHECK (
  is_org_admin_for_org(id)
);

-- ============================================================
-- PARTE 11: USUARIOS
-- Membros da org podem ver outros usuarios da mesma org
-- Admin/gestor pode gerenciar usuarios da org
-- ============================================================

-- SELECT: membros podem ver usuarios da mesma org
DROP POLICY IF EXISTS "usuarios_select_org_member" ON public.usuarios;
CREATE POLICY "usuarios_select_org_member"
ON public.usuarios FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.org_members om1
    JOIN public.org_members om2 ON om1.org_id = om2.org_id
    WHERE om1.user_id = auth.uid()
      AND om1.ativo = true
      AND om2.user_id = usuarios.id
      AND om2.ativo = true
  )
);

-- UPDATE: admin/gestor pode atualizar usuarios da org
DROP POLICY IF EXISTS "usuarios_update_org_admin" ON public.usuarios;
CREATE POLICY "usuarios_update_org_admin"
ON public.usuarios FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.org_members om1
    JOIN public.org_members om2 ON om1.org_id = om2.org_id
    WHERE om1.user_id = auth.uid()
      AND om1.ativo = true
      AND om1.role IN ('admin', 'gestor')
      AND om2.user_id = usuarios.id
      AND om2.ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.org_members om1
    JOIN public.org_members om2 ON om1.org_id = om2.org_id
    WHERE om1.user_id = auth.uid()
      AND om1.ativo = true
      AND om1.role IN ('admin', 'gestor')
      AND om2.user_id = usuarios.id
      AND om2.ativo = true
  )
);

-- ============================================================
-- PARTE 12: INTEGRATIONS
-- Gestor (org_admin): manage
-- Advogado (user): read
-- ============================================================

-- SELECT: membros da org podem ver integracoes
DROP POLICY IF EXISTS "integrations_select_org_member" ON public.integrations;
CREATE POLICY "integrations_select_org_member"
ON public.integrations FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: admin/gestor pode criar integracoes
DROP POLICY IF EXISTS "integrations_insert_org_admin" ON public.integrations;
CREATE POLICY "integrations_insert_org_admin"
ON public.integrations FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- UPDATE: admin/gestor pode atualizar integracoes
DROP POLICY IF EXISTS "integrations_update_org_admin" ON public.integrations;
CREATE POLICY "integrations_update_org_admin"
ON public.integrations FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DELETE: admin/gestor pode deletar integracoes
DROP POLICY IF EXISTS "integrations_delete_org_admin" ON public.integrations;
CREATE POLICY "integrations_delete_org_admin"
ON public.integrations FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 13: ADVOGADO_CARTEIRA_CLIENTES
-- Admin/gestor: manage completo
-- Advogado: ver sua propria carteira
-- ============================================================

-- SELECT: admin/gestor ve toda carteira da org
DROP POLICY IF EXISTS "carteira_select_org_admin" ON public.advogado_carteira_clientes;
CREATE POLICY "carteira_select_org_admin"
ON public.advogado_carteira_clientes FOR SELECT
USING (
  is_org_admin_for_org(org_id)
);

-- SELECT: advogado ve sua propria carteira
DROP POLICY IF EXISTS "carteira_select_own" ON public.advogado_carteira_clientes;
CREATE POLICY "carteira_select_own"
ON public.advogado_carteira_clientes FOR SELECT
USING (
  advogado_user_id = auth.uid() AND is_org_member(org_id)
);

-- INSERT: admin/gestor pode atribuir clientes
DROP POLICY IF EXISTS "carteira_insert_org_admin" ON public.advogado_carteira_clientes;
CREATE POLICY "carteira_insert_org_admin"
ON public.advogado_carteira_clientes FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- UPDATE: admin/gestor pode atualizar atribuicoes
DROP POLICY IF EXISTS "carteira_update_org_admin" ON public.advogado_carteira_clientes;
CREATE POLICY "carteira_update_org_admin"
ON public.advogado_carteira_clientes FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- DELETE: admin/gestor pode remover atribuicoes
DROP POLICY IF EXISTS "carteira_delete_org_admin" ON public.advogado_carteira_clientes;
CREATE POLICY "carteira_delete_org_admin"
ON public.advogado_carteira_clientes FOR DELETE
USING (
  is_org_admin_for_org(org_id)
);

-- ============================================================
-- PARTE 14: DATAJUD (processos, movimentacoes, sync_jobs)
-- Admin/gestor da org + fartech
-- ============================================================

-- datajud_processos
DROP POLICY IF EXISTS "datajud_processos_select_org_member" ON public.datajud_processos;
CREATE POLICY "datajud_processos_select_org_member"
ON public.datajud_processos FOR SELECT
USING (
  is_org_member(org_id)
);

DROP POLICY IF EXISTS "datajud_processos_insert_org_admin" ON public.datajud_processos;
CREATE POLICY "datajud_processos_insert_org_admin"
ON public.datajud_processos FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

DROP POLICY IF EXISTS "datajud_processos_update_org_admin" ON public.datajud_processos;
CREATE POLICY "datajud_processos_update_org_admin"
ON public.datajud_processos FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

-- datajud_movimentacoes
DROP POLICY IF EXISTS "datajud_movimentacoes_select_org_member" ON public.datajud_movimentacoes;
CREATE POLICY "datajud_movimentacoes_select_org_member"
ON public.datajud_movimentacoes FOR SELECT
USING (
  is_org_member(org_id)
);

-- datajud_sync_jobs
DROP POLICY IF EXISTS "datajud_sync_jobs_select_org_admin" ON public.datajud_sync_jobs;
CREATE POLICY "datajud_sync_jobs_select_org_admin"
ON public.datajud_sync_jobs FOR SELECT
USING (
  is_org_admin_for_org(org_id)
);

DROP POLICY IF EXISTS "datajud_sync_jobs_insert_org_admin" ON public.datajud_sync_jobs;
CREATE POLICY "datajud_sync_jobs_insert_org_admin"
ON public.datajud_sync_jobs FOR INSERT
WITH CHECK (
  is_org_admin_for_org(org_id)
);

DROP POLICY IF EXISTS "datajud_sync_jobs_update_org_admin" ON public.datajud_sync_jobs;
CREATE POLICY "datajud_sync_jobs_update_org_admin"
ON public.datajud_sync_jobs FOR UPDATE
USING (
  is_org_admin_for_org(org_id)
)
WITH CHECK (
  is_org_admin_for_org(org_id)
);

COMMIT;

-- ============================================================
-- VERIFICACAO POS-MIGRACAO
-- ============================================================
-- Execute separadamente para verificar que todas as policies foram criadas:
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
