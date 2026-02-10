-- ============================================================
-- MIGRATION: 20260128_critical_fixes.sql
-- Descricao: Correcoes criticas de RLS, indices e schema
-- Data: 28 de janeiro de 2026
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: FUNCOES HELPER RLS
-- Usa CREATE OR REPLACE para funcoes que ja existem
-- Dropa apenas as que tem conflito de nome de parametro
-- ============================================================

-- 1.1 is_fartech_admin - Admin global da plataforma (ja existe, apenas atualiza)
CREATE OR REPLACE FUNCTION public.is_fartech_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND 'fartech_admin' = ANY(u.permissoes)
  );
$$;

-- 1.2 is_global_admin (alias para compatibilidade)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_fartech_admin();
$$;

-- 1.3 is_org_member - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_org_member(UUID) CASCADE;
CREATE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
  );
$$;

-- 1.4 is_member - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_member(UUID) CASCADE;
CREATE FUNCTION public.is_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_org_member(_org_id);
$$;

-- 1.5 is_org_staff - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_org_staff(UUID) CASCADE;
CREATE FUNCTION public.is_org_staff(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
      AND om.role IN ('admin', 'gestor', 'secretaria')
  );
$$;

-- 1.6 is_staff - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_staff(UUID) CASCADE;
CREATE FUNCTION public.is_staff(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_org_staff(_org_id);
$$;

-- 1.7 is_org_adminish - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_org_adminish(UUID) CASCADE;
CREATE FUNCTION public.is_org_adminish(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
      AND om.role IN ('admin', 'gestor')
  );
$$;

-- 1.8 is_adminish - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_adminish(UUID) CASCADE;
CREATE FUNCTION public.is_adminish(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_org_adminish(_org_id);
$$;

-- 1.9 is_advogado - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.is_advogado(UUID) CASCADE;
CREATE FUNCTION public.is_advogado(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = _org_id
      AND om.user_id = auth.uid()
      AND om.ativo = true
      AND om.role = 'advogado'
  );
$$;

-- 1.10 can_read_cliente - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.can_read_cliente(UUID, UUID) CASCADE;
CREATE FUNCTION public.can_read_cliente(_org_id UUID, _cliente_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.is_org_member(_org_id)
    AND (
      public.is_org_staff(_org_id)
      OR EXISTS (
        SELECT 1 FROM public.advogado_carteira_clientes acc
        WHERE acc.org_id = _org_id
          AND acc.cliente_id = _cliente_id
          AND acc.advogado_user_id = auth.uid()
          AND acc.ativo = true
      )
    );
$$;

-- 1.11 can_read_caso - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.can_read_caso(UUID, UUID) CASCADE;
CREATE FUNCTION public.can_read_caso(_org_id UUID, _caso_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.is_org_member(_org_id)
    AND (
      public.is_org_staff(_org_id)
      OR EXISTS (
        SELECT 1 FROM public.casos c
        WHERE c.id = _caso_id
          AND c.org_id = _org_id
          AND (
            c.responsavel_user_id = auth.uid()
            OR (c.cliente_id IS NOT NULL AND public.can_read_cliente(_org_id, c.cliente_id))
          )
      )
    );
$$;

-- 1.12 can_read_conversa - Dropa e recria (conflito de nome de parametro)
DROP FUNCTION IF EXISTS public.can_read_conversa(UUID, UUID) CASCADE;
CREATE FUNCTION public.can_read_conversa(_org_id UUID, _conversa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.is_org_member(_org_id)
    AND (
      public.is_org_staff(_org_id)
      OR EXISTS (
        SELECT 1 FROM public.conversas cv
        WHERE cv.id = _conversa_id
          AND cv.org_id = _org_id
          AND (
            (cv.cliente_id IS NOT NULL AND public.can_read_cliente(_org_id, cv.cliente_id))
            OR (cv.caso_id IS NOT NULL AND public.can_read_caso(_org_id, cv.caso_id))
          )
      )
    );
$$;

-- ============================================================
-- PARTE 2: RLS EM TABELAS DESPROTEGIDAS
-- ============================================================

-- 2.1 atendimento_estado (sem org_id - acesso apenas via service role)
ALTER TABLE atendimento_estado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atendimento_estado_service_only" ON atendimento_estado;
CREATE POLICY "atendimento_estado_service_only"
ON atendimento_estado FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "atendimento_estado_service_role" ON atendimento_estado;
CREATE POLICY "atendimento_estado_service_role"
ON atendimento_estado FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2.2 conversa_buffer (tem org como TEXT - acesso apenas via service role ate migrar)
ALTER TABLE conversa_buffer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversa_buffer_service_only" ON conversa_buffer;
CREATE POLICY "conversa_buffer_service_only"
ON conversa_buffer FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "conversa_buffer_service_role" ON conversa_buffer;
CREATE POLICY "conversa_buffer_service_role"
ON conversa_buffer FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PARTE 3: ADICIONAR COLUNAS FALTANTES
-- ============================================================

-- 3.1 clientes: status e health
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'ok';

-- Constraints para clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_status_check'
  ) THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_status_check
      CHECK (status IS NULL OR status IN ('ativo', 'inativo', 'prospecto'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_health_check'
  ) THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_health_check
      CHECK (health IS NULL OR health IN ('ok', 'atencao', 'critico'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint ja existe ou erro ao criar: %', SQLERRM;
END $$;

-- 3.2 leads: heat
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS heat TEXT DEFAULT 'morno';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_heat_check'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_heat_check
      CHECK (heat IS NULL OR heat IN ('quente', 'morno', 'frio'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint ja existe ou erro ao criar: %', SQLERRM;
END $$;

-- 3.3 casos: heat e sla_risk
ALTER TABLE casos
  ADD COLUMN IF NOT EXISTS heat TEXT DEFAULT 'morno',
  ADD COLUMN IF NOT EXISTS sla_risk TEXT DEFAULT 'ok';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'casos_heat_check'
  ) THEN
    ALTER TABLE casos ADD CONSTRAINT casos_heat_check
      CHECK (heat IS NULL OR heat IN ('quente', 'morno', 'frio'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'casos_sla_risk_check'
  ) THEN
    ALTER TABLE casos ADD CONSTRAINT casos_sla_risk_check
      CHECK (sla_risk IS NULL OR sla_risk IN ('ok', 'atencao', 'critico'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint ja existe ou erro ao criar: %', SQLERRM;
END $$;

-- 3.4 documentos: status e tipo (extrair de meta JSONB)
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS tipo TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentos_status_check'
  ) THEN
    ALTER TABLE documentos ADD CONSTRAINT documentos_status_check
      CHECK (status IS NULL OR status IN ('pendente', 'aprovado', 'rejeitado', 'expirado', 'solicitado'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint ja existe ou erro ao criar: %', SQLERRM;
END $$;

-- 3.5 agendamentos: tipo e status (extrair de meta JSONB)
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'reuniao',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'agendado';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_tipo_check'
  ) THEN
    ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_tipo_check
      CHECK (tipo IS NULL OR tipo IN ('reuniao', 'audiencia', 'prazo', 'lembrete', 'ligacao', 'visita', 'outro'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_status_check'
  ) THEN
    ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_status_check
      CHECK (status IS NULL OR status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'pendente'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint ja existe ou erro ao criar: %', SQLERRM;
END $$;

-- ============================================================
-- PARTE 4: MIGRAR DADOS DE JSONB PARA COLUNAS
-- ============================================================

-- 4.1 Migrar status/health de tags[] para colunas em clientes
UPDATE clientes
SET
  status = COALESCE(
    (SELECT regexp_replace(t, 'status:', '')
     FROM unnest(tags) t
     WHERE t LIKE 'status:%' LIMIT 1),
    status,
    'ativo'
  ),
  health = COALESCE(
    (SELECT regexp_replace(t, 'health:', '')
     FROM unnest(tags) t
     WHERE t LIKE 'health:%' LIMIT 1),
    health,
    'ok'
  )
WHERE status IS NULL OR health IS NULL;

-- 4.2 Migrar heat de qualificacao JSONB para coluna em leads
UPDATE leads
SET heat = COALESCE(qualificacao->>'heat', heat, 'morno')
WHERE heat IS NULL OR heat = 'morno';

-- 4.3 Migrar status/tipo de meta JSONB para colunas em documentos
UPDATE documentos
SET
  status = COALESCE(meta->>'status', status, 'pendente'),
  tipo = COALESCE(meta->>'tipo', tipo)
WHERE status IS NULL OR tipo IS NULL;

-- 4.4 Migrar tipo/status de meta JSONB para colunas em agendamentos
UPDATE agendamentos
SET
  tipo = COALESCE(meta->>'tipo', tipo, 'reuniao'),
  status = COALESCE(meta->>'status', status, 'agendado')
WHERE tipo IS NULL OR status IS NULL;

-- ============================================================
-- PARTE 5: INDICES COMPOSTOS PARA PERFORMANCE
-- ============================================================

-- Casos
CREATE INDEX IF NOT EXISTS idx_casos_org_status ON casos(org_id, status);
CREATE INDEX IF NOT EXISTS idx_casos_org_cliente ON casos(org_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_casos_org_responsavel ON casos(org_id, responsavel_user_id);
CREATE INDEX IF NOT EXISTS idx_casos_org_prioridade ON casos(org_id, prioridade);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_assigned ON leads(org_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_heat ON leads(org_id, heat);

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_org_status ON clientes(org_id, status);
CREATE INDEX IF NOT EXISTS idx_clientes_org_owner ON clientes(org_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);

-- Tarefas
CREATE INDEX IF NOT EXISTS idx_tarefas_org_status ON tarefas(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tarefas_org_assigned ON tarefas(org_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_due_at_pending ON tarefas(due_at)
  WHERE status NOT IN ('concluida', 'cancelada');
CREATE INDEX IF NOT EXISTS idx_tarefas_entidade ON tarefas(entidade, entidade_id)
  WHERE entidade IS NOT NULL;

-- Agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_org_start ON agendamentos(org_id, start_at);
CREATE INDEX IF NOT EXISTS idx_agendamentos_org_owner ON agendamentos(org_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_start_at ON agendamentos(start_at);

-- Documentos
CREATE INDEX IF NOT EXISTS idx_documentos_org_caso ON documentos(org_id, caso_id);
CREATE INDEX IF NOT EXISTS idx_documentos_org_cliente ON documentos(org_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_org_status ON documentos(org_id, status);

-- Mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_created ON mensagens(conversa_id, created_at DESC);

-- Conversas
CREATE INDEX IF NOT EXISTS idx_conversas_org_remote ON conversas(org_id, remote_id);
CREATE INDEX IF NOT EXISTS idx_conversas_org_aberto ON conversas(org_id, aberto);

-- Org Members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_ativo ON org_members(org_id, ativo);

-- Advogado Carteira
CREATE INDEX IF NOT EXISTS idx_advogado_carteira_advogado ON advogado_carteira_clientes(advogado_user_id);
CREATE INDEX IF NOT EXISTS idx_advogado_carteira_cliente ON advogado_carteira_clientes(cliente_id);

-- Notas
CREATE INDEX IF NOT EXISTS idx_notas_entidade ON notas(entidade, entidade_id);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);

-- ============================================================
-- PARTE 6: CONSTRAINTS DE INTEGRIDADE
-- ============================================================

-- Unicidade em org_members (um usuario por org)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'org_members_unique_user_org'
  ) THEN
    ALTER TABLE org_members ADD CONSTRAINT org_members_unique_user_org
      UNIQUE (org_id, user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint org_members_unique_user_org ja existe: %', SQLERRM;
END $$;

-- Unicidade em advogado_carteira_clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'advogado_carteira_unique'
  ) THEN
    ALTER TABLE advogado_carteira_clientes ADD CONSTRAINT advogado_carteira_unique
      UNIQUE (org_id, cliente_id, advogado_user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint advogado_carteira_unique ja existe: %', SQLERRM;
END $$;

-- Validacao de entidade em tarefas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tarefas_entidade_check'
  ) THEN
    ALTER TABLE tarefas ADD CONSTRAINT tarefas_entidade_check
      CHECK (
        (entidade IS NULL AND entidade_id IS NULL) OR
        (entidade IS NOT NULL AND entidade_id IS NOT NULL)
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint tarefas_entidade_check ja existe: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tarefas_entidade_type_check'
  ) THEN
    ALTER TABLE tarefas ADD CONSTRAINT tarefas_entidade_type_check
      CHECK (entidade IS NULL OR entidade IN ('lead', 'cliente', 'caso'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint tarefas_entidade_type_check ja existe: %', SQLERRM;
END $$;

-- ============================================================
-- PARTE 7: REMOVER POLICIES REDUNDANTES DE TAREFAS
-- ============================================================

-- Remove policies redundantes (ja cobertas por tarefas_select e tarefas_write)
DROP POLICY IF EXISTS "tarefas_select_admin" ON tarefas;
DROP POLICY IF EXISTS "tarefas_select_advogado" ON tarefas;
DROP POLICY IF EXISTS "tarefas_update_admin" ON tarefas;
DROP POLICY IF EXISTS "tarefas_update_advogado" ON tarefas;
DROP POLICY IF EXISTS "tarefas_insert_advogado" ON tarefas;

-- ============================================================
-- PARTE 8: POLICY PARA DOCUMENTOS VIA TAREFA
-- ============================================================

-- Permite que advogado veja documentos de suas tarefas
DROP POLICY IF EXISTS "documentos_via_tarefa_select" ON documentos;
CREATE POLICY "documentos_via_tarefa_select"
ON documentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tarefa_documentos td
    JOIN tarefas t ON t.id = td.tarefa_id
    WHERE td.documento_id = documentos.id
      AND t.assigned_user_id = auth.uid()
  )
);

-- ============================================================
-- PARTE 9: GRANTS PARA SERVICE ROLE
-- ============================================================

-- Garante que service_role pode executar as funcoes
GRANT EXECUTE ON FUNCTION public.is_fartech_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_member(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_org_staff(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_org_adminish(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_adminish(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_advogado(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_read_cliente(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_read_caso(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_read_conversa(UUID, UUID) TO service_role;

-- Garante que authenticated pode executar as funcoes
GRANT EXECUTE ON FUNCTION public.is_fartech_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_adminish(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_adminish(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_advogado(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_cliente(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_caso(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_conversa(UUID, UUID) TO authenticated;

COMMIT;

-- ============================================================
-- VERIFICACAO POS-MIGRACAO
-- ============================================================

-- Execute separadamente para verificar:
/*
-- 1. Verificar funcoes criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name LIKE 'is_%' OR routine_name LIKE 'can_%';

-- 2. Verificar indices criados
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 3. Verificar constraints
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname LIKE '%check%' OR conname LIKE '%unique%';

-- 4. Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Verificar policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
