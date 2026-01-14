-- ============================================
-- SETUP MULTI-TENANT INCREMENTAL
-- Adiciona suporte multi-tenant usando estrutura existente
-- Sem duplicação de tabelas!
-- ============================================

-- Parte 1: Verificar e adicionar colunas em profiles
-- ============================================

-- Adicionar org_id em profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN org_id UUID REFERENCES orgs(id);
    CREATE INDEX idx_profiles_org_id ON profiles(org_id);
  END IF;
END $$;

-- Adicionar role em profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;
END $$;

-- Adicionar is_fartech_admin em profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_fartech_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_fartech_admin BOOLEAN DEFAULT false;
    CREATE INDEX idx_profiles_fartech_admin ON profiles(is_fartech_admin);
  END IF;
END $$;

-- Parte 2: Verificar e adicionar org_id em outras tabelas
-- ============================================

-- Adicionar org_id em leads (se não existir)
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

-- Adicionar org_id em clientes (se não existir)
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

-- Adicionar org_id em casos (se não existir)
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

-- Adicionar org_id em documentos (se não existir)
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

-- Parte 3: Configurar RLS em profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todos os profiles
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
CREATE POLICY "fartech_admin_all_profiles"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_fartech_admin = true
    )
  );

-- Policy: Org admins podem ver profiles da mesma org
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
CREATE POLICY "org_admin_own_org_profiles"
  ON profiles
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Usuários podem ver seus próprios dados
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
CREATE POLICY "users_own_profile"
  ON profiles
  FOR ALL
  USING (id = auth.uid());

-- Policy: Usuários podem ver outros profiles da mesma org
DROP POLICY IF EXISTS "users_same_org_profiles" ON profiles;
CREATE POLICY "users_same_org_profiles"
  ON profiles
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 4: Configurar RLS em orgs
-- ============================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todas as orgs
DROP POLICY IF EXISTS "fartech_admin_all_orgs" ON orgs;
CREATE POLICY "fartech_admin_all_orgs"
  ON orgs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_fartech_admin = true
    )
  );

-- Policy: Org admins podem ver e editar sua própria org
DROP POLICY IF EXISTS "org_admin_own_org" ON orgs;
CREATE POLICY "org_admin_own_org"
  ON orgs
  FOR ALL
  USING (
    id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Usuários podem ver sua própria org (somente leitura)
DROP POLICY IF EXISTS "users_own_org_readonly" ON orgs;
CREATE POLICY "users_own_org_readonly"
  ON orgs
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 5: Configurar RLS em leads
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todos os leads
DROP POLICY IF EXISTS "fartech_admin_all_leads" ON leads;
CREATE POLICY "fartech_admin_all_leads"
  ON leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_fartech_admin = true
    )
  );

-- Policy: Usuários veem apenas leads da sua org
DROP POLICY IF EXISTS "users_own_org_leads" ON leads;
CREATE POLICY "users_own_org_leads"
  ON leads
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 6: Configurar RLS em clientes
-- ============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todos os clientes
DROP POLICY IF EXISTS "fartech_admin_all_clientes" ON clientes;
CREATE POLICY "fartech_admin_all_clientes"
  ON clientes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_fartech_admin = true
    )
  );

-- Policy: Usuários veem apenas clientes da sua org
DROP POLICY IF EXISTS "users_own_org_clientes" ON clientes;
CREATE POLICY "users_own_org_clientes"
  ON clientes
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 7: Configurar RLS em casos
-- ============================================

ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todos os casos
DROP POLICY IF EXISTS "fartech_admin_all_casos" ON casos;
CREATE POLICY "fartech_admin_all_casos"
  ON casos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_fartech_admin = true
    )
  );

-- Policy: Usuários veem apenas casos da sua org
DROP POLICY IF EXISTS "users_own_org_casos" ON casos;
CREATE POLICY "users_own_org_casos"
  ON casos
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 8: Configurar RLS em documentos
-- ============================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Policy: Fartech admins podem ver todos os documentos
DROP POLICY IF EXISTS "fartech_admin_all_documentos" ON documentos;
CREATE POLICY "fartech_admin_all_documentos"
  ON documentos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_fartech_admin = true
    )
  );

-- Policy: Usuários veem apenas documentos da sua org
DROP POLICY IF EXISTS "users_own_org_documentos" ON documentos;
CREATE POLICY "users_own_org_documentos"
  ON documentos
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Parte 9: Criar organização de teste
-- ============================================

-- Inserir organização de teste (se não existir)
INSERT INTO orgs (id, nome, slug, created_at)
VALUES (
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  'Demo Organization',
  'demo',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar colunas adicionadas em profiles
SELECT 
  'profiles columns check' AS verification,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('org_id', 'role', 'is_fartech_admin')
ORDER BY column_name;

-- Verificar org_id nas outras tabelas
SELECT 
  'org_id in other tables' AS verification,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'org_id'
  AND table_name IN ('leads', 'clientes', 'casos', 'documentos')
ORDER BY table_name;

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orgs', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tablename;

-- Verificar organização de teste criada
SELECT 
  id,
  nome AS name,
  slug,
  created_at
FROM orgs
WHERE slug = 'demo';

-- ============================================
-- INSTRUÇÕES PARA PRÓXIMO PASSO
-- ============================================

-- 1. Criar usuário gestor em Supabase Authentication:
--    Email: gestor@demo.local
--    Password: Demo@2024

-- 2. Após criar, executar:
/*
UPDATE profiles
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'admin',
  is_fartech_admin = false
WHERE email = 'gestor@demo.local';
*/

-- 3. Verificar se funcionou:
/*
SELECT 
  id,
  email,
  nome,
  role,
  org_id,
  is_fartech_admin
FROM profiles
WHERE email = 'gestor@demo.local';
*/
