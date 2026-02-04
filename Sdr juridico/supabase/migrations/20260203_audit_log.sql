-- Audit Log System for User Management Changes
-- Date: 2026-02-03
-- Purpose: Implementar sistema de auditoria completo para rastrear mudanças em usuários e permissões

BEGIN;

-- ================================================================================
-- TABELA DE AUDITORIA (se não existir)
-- ================================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  org_id UUID REFERENCES public.orgs(id),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Garantir que todas as colunas existam (caso tabela já exista de migração anterior)
DO $$
BEGIN
  -- Adicionar coluna table_name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'table_name'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN table_name TEXT DEFAULT 'unknown';
    -- Atualizar NOT NULL depois que a coluna foi criada
    ALTER TABLE public.audit_log ALTER COLUMN table_name SET NOT NULL;
  END IF;

  -- Adicionar coluna record_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'record_id'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN record_id UUID DEFAULT gen_random_uuid();
    -- Atualizar NOT NULL depois que a coluna foi criada
    ALTER TABLE public.audit_log ALTER COLUMN record_id SET NOT NULL;
  END IF;

  -- Adicionar coluna action se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'action'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN action TEXT DEFAULT 'UPDATE';
    -- Adicionar constraint depois
    ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_action_check
      CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'));
    ALTER TABLE public.audit_log ALTER COLUMN action SET NOT NULL;
  END IF;

  -- Adicionar coluna changed_fields se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'changed_fields'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN changed_fields TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar coluna changed_by se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'changed_by'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN changed_by UUID;
    -- Adicionar foreign key constraint separadamente
    BEGIN
      ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_changed_by_fkey
        FOREIGN KEY (changed_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Constraint já existe, ignorar
    END;
  END IF;

  -- Adicionar coluna org_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN org_id UUID;
    -- Adicionar foreign key constraint separadamente
    BEGIN
      ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Constraint já existe, ignorar
    END;
  END IF;

  -- Adicionar coluna metadata se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
  END IF;

  -- Adicionar coluna old_data se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'old_data'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN old_data JSONB;
  END IF;

  -- Adicionar coluna new_data se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'new_data'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN new_data JSONB;
  END IF;

  -- Adicionar coluna changed_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'changed_at'
  ) THEN
    ALTER TABLE public.audit_log ADD COLUMN changed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  RAISE NOTICE 'Colunas da tabela audit_log verificadas/adicionadas';
END $$;

-- Índices para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
  ON audit_log(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by
  ON audit_log(changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_id
  ON audit_log(org_id) WHERE org_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at
  ON audit_log(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON audit_log(action, changed_at DESC);

COMMENT ON TABLE public.audit_log IS
  'Tabela de auditoria que registra todas as mudanças em tabelas críticas.

   Usado para:
   - Compliance e auditoria
   - Debug de problemas de permissões
   - Histórico de mudanças em usuários
   - Rastreamento de ações administrativas';

-- ================================================================================
-- FUNÇÃO GENÉRICA DE AUDITORIA
-- ================================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changed_fields TEXT[];
  org_id_val UUID;
  actor_user_id UUID;
BEGIN
  -- Determinar org_id (se a tabela tiver essa coluna)
  IF TG_OP = 'DELETE' THEN
    BEGIN
      org_id_val := OLD.org_id;
    EXCEPTION WHEN OTHERS THEN
      org_id_val := NULL;
    END;
  ELSE
    BEGIN
      org_id_val := NEW.org_id;
    EXCEPTION WHEN OTHERS THEN
      org_id_val := NULL;
    END;
  END IF;

  -- Tentar pegar o usuário da sessão atual
  BEGIN
    actor_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor_user_id := NULL;
  END;

  -- Detectar campos alterados (apenas para UPDATE)
  IF TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key;
  END IF;

  -- Inserir log de auditoria
  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    changed_by,
    org_id,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields,
    actor_user_id,
    org_id_val,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'trigger_time', CURRENT_TIMESTAMP
    )
  );

  -- Retornar o registro apropriado
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION audit_trigger_func IS
  'Função genérica de trigger para auditoria automática.

   Captura:
   - Dados antigos e novos (JSONB)
   - Campos que mudaram (array)
   - Usuário que fez a mudança (auth.uid())
   - Organização relacionada (se existir)
   - Timestamp da mudança

   Para adicionar auditoria a uma tabela:
   CREATE TRIGGER audit_<table_name>
     AFTER INSERT OR UPDATE OR DELETE ON <table_name>
     FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();';

-- ================================================================================
-- APLICAR TRIGGERS NAS TABELAS CRÍTICAS
-- ================================================================================

-- 1. USUARIOS - Rastrear mudanças em perfis de usuário
DROP TRIGGER IF EXISTS audit_usuarios ON usuarios;
CREATE TRIGGER audit_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 2. ORG_MEMBERS - Rastrear mudanças em membros de organização (CRÍTICO!)
DROP TRIGGER IF EXISTS audit_org_members ON org_members;
CREATE TRIGGER audit_org_members
  AFTER INSERT OR UPDATE OR DELETE ON org_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 3. ORGS - Rastrear mudanças em organizações
DROP TRIGGER IF EXISTS audit_orgs ON orgs;
CREATE TRIGGER audit_orgs
  AFTER INSERT OR UPDATE OR DELETE ON orgs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Opcional: Adicionar auditoria em outras tabelas críticas
-- Descomente se quiser auditar essas tabelas também:

-- DROP TRIGGER IF EXISTS audit_casos ON casos;
-- CREATE TRIGGER audit_casos
--   AFTER INSERT OR UPDATE OR DELETE ON casos
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- DROP TRIGGER IF EXISTS audit_clientes ON clientes;
-- CREATE TRIGGER audit_clientes
--   AFTER INSERT OR UPDATE OR DELETE ON clientes
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ================================================================================
-- POLÍTICAS RLS PARA AUDIT_LOG
-- ================================================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Fartech admins podem ver todos os logs
DROP POLICY IF EXISTS "audit_log_fartech_admin" ON audit_log;
CREATE POLICY "audit_log_fartech_admin" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.permissoes @> ARRAY['fartech_admin']::text[]
    )
  );

-- Org admins podem ver logs da sua org
DROP POLICY IF EXISTS "audit_log_org_admin" ON audit_log;
CREATE POLICY "audit_log_org_admin" ON audit_log
  FOR SELECT USING (
    public.is_org_admin_for_org(org_id)
  );

-- Usuários podem ver seus próprios logs
DROP POLICY IF EXISTS "audit_log_own_records" ON audit_log;
CREATE POLICY "audit_log_own_records" ON audit_log
  FOR SELECT USING (
    record_id = auth.uid()
    OR changed_by = auth.uid()
  );

-- ================================================================================
-- VIEWS HELPER PARA CONSULTAR AUDITORIA
-- ================================================================================

-- View formatada de auditoria de usuários
CREATE OR REPLACE VIEW v_audit_user_changes AS
SELECT
  al.id,
  al.changed_at,
  al.action,
  al.table_name,

  -- Usuário que foi modificado
  u_target.email AS target_user_email,
  u_target.nome_completo AS target_user_name,

  -- Usuário que fez a modificação
  u_actor.email AS actor_email,
  u_actor.nome_completo AS actor_name,

  -- Organização
  o.name AS org_name,

  -- Campos alterados
  al.changed_fields,

  -- Dados antigos e novos (extrair apenas campos relevantes)
  CASE
    WHEN al.table_name = 'usuarios' THEN
      jsonb_build_object(
        'permissoes', al.old_data->'permissoes',
        'nome_completo', al.old_data->'nome_completo',
        'status', al.old_data->'status'
      )
    WHEN al.table_name = 'org_members' THEN
      jsonb_build_object(
        'role', al.old_data->'role',
        'ativo', al.old_data->'ativo'
      )
  END AS old_values,

  CASE
    WHEN al.table_name = 'usuarios' THEN
      jsonb_build_object(
        'permissoes', al.new_data->'permissoes',
        'nome_completo', al.new_data->'nome_completo',
        'status', al.new_data->'status'
      )
    WHEN al.table_name = 'org_members' THEN
      jsonb_build_object(
        'role', al.new_data->'role',
        'ativo', al.new_data->'ativo'
      )
  END AS new_values

FROM audit_log al
LEFT JOIN usuarios u_target ON u_target.id = al.record_id
LEFT JOIN usuarios u_actor ON u_actor.id = al.changed_by
LEFT JOIN orgs o ON o.id = al.org_id
WHERE al.table_name IN ('usuarios', 'org_members')
ORDER BY al.changed_at DESC;

COMMENT ON VIEW v_audit_user_changes IS
  'View formatada mostrando mudanças em usuários e membros de organizações.

   Útil para:
   - Ver histórico de mudanças de permissões
   - Auditar quem fez quais mudanças
   - Debug de problemas de acesso

   Exemplo:
   SELECT * FROM v_audit_user_changes
   WHERE target_user_email = ''user@example.com''
   AND changed_at > NOW() - INTERVAL ''7 days'';';

-- ================================================================================
-- FUNÇÕES HELPER PARA CONSULTAR AUDITORIA
-- ================================================================================

-- Função para buscar histórico de um usuário
CREATE OR REPLACE FUNCTION get_user_audit_history(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  changed_at TIMESTAMPTZ,
  action TEXT,
  table_name TEXT,
  changed_by_email TEXT,
  org_name TEXT,
  changed_fields TEXT[],
  old_values JSONB,
  new_values JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.changed_at,
    v.action,
    v.table_name,
    v.actor_email AS changed_by_email,
    v.org_name,
    v.changed_fields,
    v.old_values,
    v.new_values
  FROM v_audit_user_changes v
  WHERE v.target_user_email IN (SELECT email FROM usuarios WHERE id = p_user_id)
    AND v.changed_at > NOW() - (p_days_back || ' days')::INTERVAL
  ORDER BY v.changed_at DESC;
END;
$$;

COMMENT ON FUNCTION get_user_audit_history IS
  'Retorna histórico completo de auditoria de um usuário específico.

   Parâmetros:
   - p_user_id: ID do usuário
   - p_days_back: Quantos dias para trás buscar (padrão: 30)

   Exemplo:
   SELECT * FROM get_user_audit_history(''<user-id>'', 90);';

-- Função para buscar mudanças recentes em uma org
CREATE OR REPLACE FUNCTION get_org_recent_changes(
  p_org_id UUID,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
  changed_at TIMESTAMPTZ,
  action TEXT,
  table_name TEXT,
  target_user_email TEXT,
  actor_email TEXT,
  changed_fields TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.changed_at,
    v.action,
    v.table_name,
    v.target_user_email,
    v.actor_email,
    v.changed_fields
  FROM v_audit_user_changes v
  WHERE v.org_name IN (SELECT name FROM orgs WHERE id = p_org_id)
    AND v.changed_at > NOW() - (p_hours_back || ' hours')::INTERVAL
  ORDER BY v.changed_at DESC;
END;
$$;

COMMENT ON FUNCTION get_org_recent_changes IS
  'Retorna mudanças recentes em uma organização.

   Parâmetros:
   - p_org_id: ID da organização
   - p_hours_back: Quantas horas para trás buscar (padrão: 24)

   Exemplo:
   SELECT * FROM get_org_recent_changes(''<org-id>'', 48);';

COMMIT;

-- ================================================================================
-- TESTAR AUDITORIA
-- ================================================================================

DO $$
DECLARE
  audit_count INTEGER;
BEGIN
  -- Contar registros de auditoria existentes
  SELECT COUNT(*) INTO audit_count FROM audit_log;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'SISTEMA DE AUDITORIA CONFIGURADO COM SUCESSO!';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers de auditoria criados em:';
  RAISE NOTICE '  ✓ usuarios';
  RAISE NOTICE '  ✓ org_members';
  RAISE NOTICE '  ✓ orgs';
  RAISE NOTICE '';
  RAISE NOTICE 'Registros de auditoria atuais: %', audit_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Para consultar auditoria:';
  RAISE NOTICE '  SELECT * FROM v_audit_user_changes LIMIT 10;';
  RAISE NOTICE '  SELECT * FROM get_user_audit_history(''<user-id>'');';
  RAISE NOTICE '  SELECT * FROM get_org_recent_changes(''<org-id>'');';
  RAISE NOTICE '';
  RAISE NOTICE 'A partir de agora, todas as mudanças em usuários serão auditadas!';
  RAISE NOTICE '=================================================================';
END $$;

-- Log na tabela de migração (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'migration_log') THEN
    INSERT INTO migration_log (migration_name, status, notes)
    VALUES (
      '20260203_audit_log',
      'success',
      'Sistema de auditoria implementado com triggers em usuarios, org_members e orgs. Views e funções helper criadas.'
    )
    ON CONFLICT (migration_name) DO UPDATE
    SET executed_at = NOW(), status = 'success';

    RAISE NOTICE 'Log registrado em migration_log';
  ELSE
    RAISE NOTICE 'Tabela migration_log não existe - pulando log';
  END IF;
END $$;
