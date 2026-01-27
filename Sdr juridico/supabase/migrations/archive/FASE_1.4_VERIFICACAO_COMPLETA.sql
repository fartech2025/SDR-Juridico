-- ============================================
-- FASE 1.4: VERIFICACAO COMPLETA (usuarios + org_members)
-- ============================================

-- 0) Remover policies permissivas legadas (USING true / WITH CHECK true)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'usuarios',
        'leads',
        'clientes',
        'casos',
        'documentos',
        'agenda',
        'timeline_events',
        'notificacoes'
      )
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
    RAISE NOTICE 'Dropped policy %.%: %',
      policy_record.schemaname,
      policy_record.tablename,
      policy_record.policyname;
  END LOOP;
END $$;

-- 0.1) Listar policies restantes nas tabelas legadas
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'usuarios',
    'leads',
    'clientes',
    'casos',
    'documentos',
    'agenda',
    'timeline_events',
    'notificacoes'
  )
ORDER BY tablename, policyname;

-- 1) Verificar tabelas essenciais
SELECT
  'tabelas essenciais' AS verificacao,
  table_name,
  EXISTS (
    SELECT 1
    FROM information_schema.tables t2
    WHERE t2.table_schema = 'public'
      AND t2.table_name = t.table_name
  ) AS existe
FROM (VALUES
  ('usuarios'),
  ('orgs'),
  ('org_members'),
  ('leads'),
  ('clientes'),
  ('casos'),
  ('documentos')
) AS t(table_name)
ORDER BY table_name;

-- 2) Verificar colunas org_id em tabelas principais
SELECT
  'org_id columns' AS verificacao,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'org_id'
  AND table_name IN ('leads', 'clientes', 'casos', 'documentos')
ORDER BY table_name;

-- 3) Verificar RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'orgs', 'org_members', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tablename;

-- 4) Verificar politicas em org_members
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'org_members'
ORDER BY policyname;

-- 5) Verificar org_members com usuarios existentes
SELECT
  'org_members sem usuario' AS verificacao,
  COUNT(*) AS total
FROM org_members om
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios u WHERE u.id = om.user_id
);

-- 6) Verificar org_members com orgs existentes
SELECT
  'org_members sem org' AS verificacao,
  COUNT(*) AS total
FROM org_members om
WHERE NOT EXISTS (
  SELECT 1 FROM orgs o WHERE o.id = om.org_id
);

-- 7) Verificar se existe fartech_admin
SELECT
  'fartech_admin count' AS verificacao,
  COUNT(*) AS total
FROM usuarios
WHERE permissoes @> ARRAY['fartech_admin']::text[];
