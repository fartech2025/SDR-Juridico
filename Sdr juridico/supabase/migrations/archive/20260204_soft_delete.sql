-- Migration: Soft Delete para Tabelas Críticas
-- Data: 2026-02-04
-- Prioridade: DESEJÁVEL
-- Descrição: Adiciona suporte a soft delete (deleted_at) em tabelas críticas
--            para permitir recuperação de dados e auditoria

-- =====================================================
-- 1. ADICIONAR COLUNA deleted_at
-- =====================================================

-- Clientes
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN clientes.deleted_at IS 
  'Data de exclusão lógica. NULL = ativo, preenchido = excluído';

COMMENT ON COLUMN clientes.deleted_by IS 
  'Usuário que realizou a exclusão';

-- Casos
ALTER TABLE casos 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE casos 
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN casos.deleted_at IS 
  'Data de exclusão lógica. NULL = ativo, preenchido = excluído';

-- Leads
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN leads.deleted_at IS 
  'Data de exclusão lógica. NULL = ativo, preenchido = excluído';

-- Documentos
ALTER TABLE documentos 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE documentos 
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN documentos.deleted_at IS 
  'Data de exclusão lógica. NULL = ativo, preenchido = excluído';

-- Tarefas
ALTER TABLE tarefas 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE tarefas 
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN tarefas.deleted_at IS 
  'Data de exclusão lógica. NULL = ativo, preenchido = excluído';

-- =====================================================
-- 2. ÍNDICES PARCIAIS PARA DADOS ATIVOS
-- =====================================================
-- Estes índices otimizam queries que filtram apenas registros não excluídos

CREATE INDEX IF NOT EXISTS idx_clientes_active 
  ON clientes(org_id, nome) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_casos_active 
  ON casos(org_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_active 
  ON leads(org_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_active 
  ON documentos(org_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_active 
  ON tarefas(org_id, status) 
  WHERE deleted_at IS NULL;

-- =====================================================
-- 3. VIEWS PARA DADOS ATIVOS (COMPATIBILIDADE)
-- =====================================================
-- Queries existentes podem usar estas views sem modificação

CREATE OR REPLACE VIEW v_clientes_ativos AS 
  SELECT * FROM clientes WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_casos_ativos AS 
  SELECT * FROM casos WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_leads_ativos AS 
  SELECT * FROM leads WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_documentos_ativos AS 
  SELECT * FROM documentos WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_tarefas_ativas AS 
  SELECT * FROM tarefas WHERE deleted_at IS NULL;

-- Comentários nas views
COMMENT ON VIEW v_clientes_ativos IS 
  'View de clientes não excluídos. Use para queries padrão.';

COMMENT ON VIEW v_casos_ativos IS 
  'View de casos não excluídos. Use para queries padrão.';

COMMENT ON VIEW v_leads_ativos IS 
  'View de leads não excluídos. Use para queries padrão.';

COMMENT ON VIEW v_documentos_ativos IS 
  'View de documentos não excluídos. Use para queries padrão.';

COMMENT ON VIEW v_tarefas_ativas IS 
  'View de tarefas não excluídas. Use para queries padrão.';

-- =====================================================
-- 4. FUNÇÕES DE SOFT DELETE
-- =====================================================

/**
 * Função para soft delete de um registro
 * 
 * Uso: SELECT soft_delete('clientes', 'uuid-do-registro');
 */
CREATE OR REPLACE FUNCTION soft_delete(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query TEXT;
  v_affected INTEGER;
BEGIN
  -- Validar tabelas permitidas
  IF p_table_name NOT IN ('clientes', 'casos', 'leads', 'documentos', 'tarefas') THEN
    RAISE EXCEPTION 'Tabela "%" não suporta soft delete', p_table_name;
  END IF;
  
  -- Construir e executar query
  v_query := format(
    'UPDATE %I SET deleted_at = NOW(), deleted_by = auth.uid() WHERE id = %L AND deleted_at IS NULL',
    p_table_name,
    p_record_id
  );
  
  EXECUTE v_query;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  -- Registrar no audit log
  IF v_affected > 0 THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, metadata)
    VALUES (p_table_name, p_record_id, 'SOFT_DELETE', auth.uid(), 
            jsonb_build_object('deleted_at', NOW()));
  END IF;
  
  RETURN v_affected > 0;
END;
$$;

COMMENT ON FUNCTION soft_delete IS 
  'Realiza exclusão lógica (soft delete) de um registro.
   Retorna TRUE se o registro foi excluído, FALSE se não encontrado ou já excluído.';

/**
 * Função para restaurar um registro soft deleted
 * 
 * Uso: SELECT restore_deleted('clientes', 'uuid-do-registro');
 */
CREATE OR REPLACE FUNCTION restore_deleted(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query TEXT;
  v_affected INTEGER;
BEGIN
  -- Validar tabelas permitidas
  IF p_table_name NOT IN ('clientes', 'casos', 'leads', 'documentos', 'tarefas') THEN
    RAISE EXCEPTION 'Tabela "%" não suporta soft delete', p_table_name;
  END IF;
  
  -- Construir e executar query
  v_query := format(
    'UPDATE %I SET deleted_at = NULL, deleted_by = NULL WHERE id = %L AND deleted_at IS NOT NULL',
    p_table_name,
    p_record_id
  );
  
  EXECUTE v_query;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  -- Registrar no audit log
  IF v_affected > 0 THEN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, metadata)
    VALUES (p_table_name, p_record_id, 'RESTORE', auth.uid(), 
            jsonb_build_object('restored_at', NOW()));
  END IF;
  
  RETURN v_affected > 0;
END;
$$;

COMMENT ON FUNCTION restore_deleted IS 
  'Restaura um registro que foi excluído logicamente.
   Retorna TRUE se o registro foi restaurado, FALSE se não encontrado ou já ativo.';

/**
 * Função para hard delete de registros antigos
 * 
 * Uso: SELECT hard_delete_old('clientes', 90); -- Exclui deletados há mais de 90 dias
 */
CREATE OR REPLACE FUNCTION hard_delete_old(
  p_table_name TEXT,
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query TEXT;
  v_affected INTEGER;
BEGIN
  -- Validar tabelas permitidas
  IF p_table_name NOT IN ('clientes', 'casos', 'leads', 'documentos', 'tarefas') THEN
    RAISE EXCEPTION 'Tabela "%" não suporta soft delete', p_table_name;
  END IF;
  
  -- Apenas admin pode fazer hard delete
  IF NOT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND 'fartech_admin' = ANY(permissoes)
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem fazer hard delete';
  END IF;
  
  -- Construir e executar query
  v_query := format(
    'DELETE FROM %I WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL ''%s days''',
    p_table_name,
    p_days_old
  );
  
  EXECUTE v_query;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  -- Registrar no audit log
  INSERT INTO audit_log (table_name, record_id, action, changed_by, metadata)
  VALUES (p_table_name, gen_random_uuid(), 'HARD_DELETE_BATCH', auth.uid(), 
          jsonb_build_object('deleted_count', v_affected, 'days_old', p_days_old));
  
  RETURN v_affected;
END;
$$;

COMMENT ON FUNCTION hard_delete_old IS 
  'Exclui permanentemente registros que foram soft deleted há mais de X dias.
   Apenas fartech_admin pode executar esta função.';

-- =====================================================
-- 5. ATUALIZAR RLS POLICIES PARA EXCLUIR DELETADOS
-- =====================================================
-- As policies existentes serão atualizadas para ignorar registros deletados

-- Nota: As policies existentes já usam WHERE em algumas operações
-- Vamos criar policies adicionais que filtram deleted_at

-- Exemplo para clientes (aplicar padrão similar para outras tabelas se necessário)
DO $$
BEGIN
  -- Verifica se a policy existe antes de criar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND policyname = 'clientes_hide_deleted'
  ) THEN
    -- Esta policy adiciona uma condição extra para esconder deletados
    -- para usuários normais (admins ainda podem ver via query direta)
    EXECUTE 'CREATE POLICY clientes_hide_deleted ON clientes
      FOR SELECT
      USING (deleted_at IS NULL OR EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND ''fartech_admin'' = ANY(permissoes)
      ))';
  END IF;
END $$;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['clientes', 'casos', 'leads', 'documentos', 'tarefas'];
  v_table TEXT;
  v_has_column BOOLEAN;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = v_table
      AND column_name = 'deleted_at'
    ) INTO v_has_column;
    
    IF v_has_column THEN
      RAISE NOTICE '✅ Tabela % tem coluna deleted_at', v_table;
    ELSE
      RAISE WARNING '❌ Tabela % NÃO tem coluna deleted_at', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 20260204_soft_delete executada com sucesso!';
  RAISE NOTICE 'Soft delete implementado para: clientes, casos, leads, documentos, tarefas';
END $$;
