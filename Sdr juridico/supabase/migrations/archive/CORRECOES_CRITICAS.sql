-- =====================================================
-- DEPRECATED: Este script usa USUARIOS. Padrao atual: usuarios + org_members.
-- Use SETUP_MULTITENANT_INCREMENTAL.sql para o fluxo atualizado.
-- =====================================================

-- ========================================
-- CORREÃ‡Ã•ES CRÃTICAS - BANCO DE DADOS
-- Data: 14/01/2026
-- Projeto: SDR JurÃ­dico - Multi-Tenant
-- ========================================

-- Este script resolve os problemas crÃ­ticos identificados na anÃ¡lise:
-- 1. RecursÃ£o infinita em RLS policies
-- 2. Missing CASCADE rules em Foreign Keys
-- 3. Missing UNIQUE constraint em USUARIOS.user_id
-- 4. Re-habilitaÃ§Ã£o segura de RLS em USUARIOS

-- ========================================
-- PARTE 1: CRIAR FUNÃ‡Ã•ES HELPER (Resolver RecursÃ£o)
-- ========================================

-- FunÃ§Ã£o para verificar se usuÃ¡rio Ã© Fartech Admin
-- SECURITY DEFINER permite acesso direto sem recursÃ£o RLS
CREATE OR REPLACE FUNCTION is_fartech_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM USUARIOS
    WHERE user_id = auth.uid() 
    AND is_fartech_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FunÃ§Ã£o para obter org_id do usuÃ¡rio atual
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id FROM USUARIOS
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FunÃ§Ã£o para verificar se usuÃ¡rio Ã© admin da org
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM USUARIOS
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'org_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTE 2: ADICIONAR UNIQUE CONSTRAINT
-- ========================================

-- Garantir que user_id seja Ãºnico em USUARIOS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'USUARIOS_user_id_unique'
  ) THEN
    ALTER TABLE USUARIOS 
    ADD CONSTRAINT USUARIOS_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- ========================================
-- PARTE 3: CORRIGIR CASCADE RULES EM FOREIGN KEYS
-- ========================================

-- Corrigir FK de USUARIOS.org_id -> orgs(id)
-- Se uma org for deletada, setar org_id como NULL
ALTER TABLE USUARIOS 
  DROP CONSTRAINT IF EXISTS USUARIOS_org_id_fkey;

ALTER TABLE USUARIOS 
  ADD CONSTRAINT USUARIOS_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE SET NULL;

-- Corrigir FK de leads.org_id -> orgs(id)
ALTER TABLE leads 
  DROP CONSTRAINT IF EXISTS leads_org_id_fkey;

ALTER TABLE leads 
  ADD CONSTRAINT leads_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de clientes.org_id -> orgs(id)
ALTER TABLE clientes 
  DROP CONSTRAINT IF EXISTS clientes_org_id_fkey;

ALTER TABLE clientes 
  ADD CONSTRAINT clientes_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de casos.org_id -> orgs(id)
ALTER TABLE casos 
  DROP CONSTRAINT IF EXISTS casos_org_id_fkey;

ALTER TABLE casos 
  ADD CONSTRAINT casos_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- Corrigir FK de documentos.org_id -> orgs(id)
ALTER TABLE documentos 
  DROP CONSTRAINT IF EXISTS documentos_org_id_fkey;

ALTER TABLE documentos 
  ADD CONSTRAINT documentos_org_id_fkey
  FOREIGN KEY (org_id) 
  REFERENCES orgs(id) 
  ON DELETE CASCADE;

-- ========================================
-- PARTE 4: REMOVER POLICIES ANTIGAS (Evitar Duplicatas)
-- ========================================

-- Remover todas as policies antigas de USUARIOS
DROP POLICY IF EXISTS "fartech_admin_all_USUARIOS" ON USUARIOS;
DROP POLICY IF EXISTS "org_admin_own_org_USUARIOS" ON USUARIOS;
DROP POLICY IF EXISTS "users_own_profile" ON USUARIOS;
DROP POLICY IF EXISTS "users_view_own_org" ON USUARIOS;

-- ========================================
-- PARTE 5: CRIAR NOVAS POLICIES SEM RECURSÃƒO
-- ========================================

-- Policy 1: Fartech Admin vÃª todos os USUARIOS
CREATE POLICY "fartech_admin_all_USUARIOS" ON USUARIOS
  FOR ALL
  USING (is_fartech_admin());

-- Policy 2: Org Admin vÃª USUARIOS da prÃ³pria org
CREATE POLICY "org_admin_own_org_USUARIOS" ON USUARIOS
  FOR ALL
  USING (
    is_org_admin() 
    AND org_id = get_user_org_id()
  );

-- Policy 3: UsuÃ¡rios veem apenas seu prÃ³prio profile
CREATE POLICY "users_own_profile" ON USUARIOS
  FOR ALL
  USING (user_id = auth.uid());

-- ========================================
-- PARTE 6: RE-HABILITAR RLS EM USUARIOS
-- ========================================

-- Habilitar RLS em USUARIOS (agora sem recursÃ£o!)
ALTER TABLE USUARIOS ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTE 7: VERIFICAÃ‡Ã•ES DE INTEGRIDADE
-- ========================================

-- Verificar se funÃ§Ãµes foram criadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_fartech_admin'
  ) THEN
    RAISE EXCEPTION 'FunÃ§Ã£o is_fartech_admin() nÃ£o foi criada!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_org_id'
  ) THEN
    RAISE EXCEPTION 'FunÃ§Ã£o get_user_org_id() nÃ£o foi criada!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_org_admin'
  ) THEN
    RAISE EXCEPTION 'FunÃ§Ã£o is_org_admin() nÃ£o foi criada!';
  END IF;

  RAISE NOTICE 'âœ… Todas as funÃ§Ãµes foram criadas com sucesso!';
END $$;

-- Verificar se RLS estÃ¡ habilitado
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'USUARIOS';

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS nÃ£o estÃ¡ habilitado em USUARIOS!';
  END IF;

  RAISE NOTICE 'âœ… RLS habilitado em USUARIOS!';
END $$;

-- Verificar se policies foram criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'USUARIOS';

  IF policy_count < 3 THEN
    RAISE EXCEPTION 'Policies de USUARIOS nÃ£o foram criadas corretamente!';
  END IF;

  RAISE NOTICE 'âœ… % policies criadas em USUARIOS!', policy_count;
END $$;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- Exibir resumo das correÃ§Ãµes
SELECT 
  'ðŸŽ¯ CORREÃ‡Ã•ES APLICADAS' AS status,
  'FunÃ§Ãµes helper criadas (sem recursÃ£o)' AS correcao_1,
  'CASCADE rules adicionadas em FKs' AS correcao_2,
  'UNIQUE constraint em USUARIOS.user_id' AS correcao_3,
  'RLS re-habilitado em USUARIOS' AS correcao_4;

-- Exibir policies ativas
SELECT 
  'Policies Ativas em USUARIOS:' AS info,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'âœ… Com USING'
    ELSE 'âš ï¸ Sem USING'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'USUARIOS'
ORDER BY policyname;

-- Exibir Foreign Keys com CASCADE
SELECT
  tc.table_name AS tabela,
  kcu.column_name AS coluna,
  ccu.table_name AS referencia,
  rc.delete_rule AS regra_delete,
  CASE 
    WHEN rc.delete_rule IN ('CASCADE', 'SET NULL') THEN 'âœ…'
    ELSE 'âš ï¸'
  END AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'org_id'
  AND tc.table_name IN ('USUARIOS', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tc.table_name;
