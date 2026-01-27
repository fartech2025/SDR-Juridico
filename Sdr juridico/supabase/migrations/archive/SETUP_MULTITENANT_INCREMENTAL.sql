-- ============================================
-- SETUP MULTI-TENANT INCREMENTAL
-- Padronizado para usuarios + org_members
-- ============================================

-- Parte 1: Adicionar org_id nas tabelas principais (se nao existir)
-- ============================================

-- Adicionar org_id em leads (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_leads_org_id ON leads(org_id);
  END IF;
END $$;

-- Adicionar org_id em clientes (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clientes'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE clientes ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_clientes_org_id ON clientes(org_id);
  END IF;
END $$;

-- Adicionar org_id em casos (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'casos'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE casos ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_casos_org_id ON casos(org_id);
  END IF;
END $$;

-- Adicionar org_id em documentos (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'documentos'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_documentos_org_id ON documentos(org_id);
  END IF;
END $$;

-- Parte 2: Funcoes auxiliares (usuarios + org_members)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_fartech_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.permissoes @> ARRAY['fartech_admin']::text[]
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
    AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = auth.uid()
      AND ativo = true
      AND role IN ('admin', 'gestor')
  );
$$;

-- Parte 3: Configurar RLS em orgs
-- ============================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_orgs" ON orgs;
CREATE POLICY "fartech_admin_all_orgs"
  ON orgs
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "org_admin_own_org" ON orgs;
CREATE POLICY "org_admin_own_org"
  ON orgs
  FOR ALL
  USING (
    id = public.get_user_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "users_own_org_readonly" ON orgs;
CREATE POLICY "users_own_org_readonly"
  ON orgs
  FOR SELECT
  USING (id = public.get_user_org_id());

-- Parte 4: Configurar RLS em leads
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_leads" ON leads;
CREATE POLICY "fartech_admin_all_leads"
  ON leads
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "users_own_org_leads" ON leads;
CREATE POLICY "users_own_org_leads"
  ON leads
  FOR ALL
  USING (org_id = public.get_user_org_id());

-- Parte 5: Configurar RLS em clientes
-- ============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_clientes" ON clientes;
CREATE POLICY "fartech_admin_all_clientes"
  ON clientes
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "users_own_org_clientes" ON clientes;
CREATE POLICY "users_own_org_clientes"
  ON clientes
  FOR ALL
  USING (org_id = public.get_user_org_id());

-- Parte 6: Configurar RLS em casos
-- ============================================

ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_casos" ON casos;
CREATE POLICY "fartech_admin_all_casos"
  ON casos
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "users_own_org_casos" ON casos;
CREATE POLICY "users_own_org_casos"
  ON casos
  FOR ALL
  USING (org_id = public.get_user_org_id());

-- Parte 7: Configurar RLS em documentos
-- ============================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fartech_admin_all_documentos" ON documentos;
CREATE POLICY "fartech_admin_all_documentos"
  ON documentos
  FOR ALL
  USING (public.is_fartech_admin());

DROP POLICY IF EXISTS "users_own_org_documentos" ON documentos;
CREATE POLICY "users_own_org_documentos"
  ON documentos
  FOR ALL
  USING (org_id = public.get_user_org_id());

-- Parte 8: Criar organizacao de teste
-- ============================================

INSERT INTO orgs (id, nome, slug, created_at)
VALUES (
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  'Demo Organization',
  'demo',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICACAO FINAL
-- ============================================

SELECT
  'org_id in other tables' AS verification,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'org_id'
  AND table_name IN ('leads', 'clientes', 'casos', 'documentos')
ORDER BY table_name;

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orgs', 'leads', 'clientes', 'casos', 'documentos', 'org_members')
ORDER BY tablename;

SELECT
  id,
  nome AS name,
  slug,
  created_at
FROM orgs
WHERE slug = 'demo';

-- ============================================
-- INSTRUCOES PARA PROXIMO PASSO
-- ============================================

-- 1. Criar usuario gestor em Supabase Authentication:
--    Email: gestor@demo.local
--    Password: Demo@2024

-- 2. Vincular ao org_members:
/*
INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT
  'c1e7b3a0-0000-0000-0000-000000000001',
  id,
  'admin',
  true
FROM usuarios
WHERE email = 'gestor@demo.local'
ON CONFLICT (org_id, user_id)
DO UPDATE SET role = EXCLUDED.role, ativo = true;
*/

-- 3. Verificar se funcionou:
/*
SELECT
  om.org_id,
  om.user_id,
  om.role,
  om.ativo
FROM org_members om
JOIN usuarios u ON u.id = om.user_id
WHERE u.email = 'gestor@demo.local';
*/

