-- ============================================
-- ROLLBACK E FIX MULTI-TENANT
-- ============================================
-- Este script:
-- 1. Remove a tabela 'users' que criamos
-- 2. Adapta a tabela 'usuarios' existente para multi-tenant
-- 3. Mantém tudo funcionando com a estrutura original
-- ============================================

-- ============================================
-- PARTE 1: REMOVER TABELA 'users' CRIADA
-- ============================================

-- Drop policies da tabela users
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Fartech admins see all users" ON public.users;
DROP POLICY IF EXISTS "Fartech admins manage all users" ON public.users;

-- Drop trigger da tabela users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Drop indexes da tabela users
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_org_id;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_fartech_admin;

-- Drop a tabela users (vai falhar se tiver foreign keys, mas ok)
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- PARTE 2: ADAPTAR TABELA 'usuarios' PARA MULTI-TENANT
-- ============================================

-- Adicionar colunas multi-tenant na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_fartech_admin BOOLEAN DEFAULT FALSE;

-- Adicionar constraint de validação de role
ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS valid_user_role;

ALTER TABLE usuarios
ADD CONSTRAINT valid_user_role CHECK (role IN ('fartech_admin', 'org_admin', 'user'));

-- Criar indexes para multi-tenant
CREATE INDEX IF NOT EXISTS idx_usuarios_org_id ON usuarios(org_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_fartech_admin ON usuarios(is_fartech_admin);

-- ============================================
-- PARTE 3: ATUALIZAR RLS POLICIES
-- ============================================

-- Ativar RLS na tabela usuarios se não estiver
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Drop policies antigas
DROP POLICY IF EXISTS "Users can read own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Fartech admins see all users" ON usuarios;
DROP POLICY IF EXISTS "Fartech admins manage all users" ON usuarios;
DROP POLICY IF EXISTS "Org admins see org users" ON usuarios;
DROP POLICY IF EXISTS "Users in same org" ON usuarios;

-- Policy: Usuários veem seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- Policy: Usuários atualizam seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON usuarios FOR UPDATE
  USING (id = auth.uid());

-- Policy: Fartech admins veem todos os usuários
CREATE POLICY "Fartech admins see all users"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios AS u
      WHERE u.id = auth.uid()
      AND u.is_fartech_admin = TRUE
    )
  );

-- Policy: Fartech admins gerenciam todos os usuários
CREATE POLICY "Fartech admins manage all users"
  ON usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios AS u
      WHERE u.id = auth.uid()
      AND u.is_fartech_admin = TRUE
    )
  );

-- Policy: Org admins veem usuários da sua organização
CREATE POLICY "Org admins see org users"
  ON usuarios FOR SELECT
  USING (
    org_id IN (
      SELECT u.org_id FROM usuarios AS u
      WHERE u.id = auth.uid()
      AND u.role = 'org_admin'
    )
  );

-- Policy: Usuários veem outros da mesma organização
CREATE POLICY "Users in same org"
  ON usuarios FOR SELECT
  USING (
    org_id IN (
      SELECT u.org_id FROM usuarios AS u
      WHERE u.id = auth.uid()
    )
  );

-- ============================================
-- PARTE 4: ATUALIZAR POLICIES DE OUTRAS TABELAS
-- ============================================

-- Atualizar policies de leads para usar 'usuarios'
DROP POLICY IF EXISTS "Users access their org leads" ON leads;
DROP POLICY IF EXISTS "Fartech admins access all leads" ON leads;

CREATE POLICY "Users access their org leads"
  ON leads FOR ALL
  USING (
    org_id = (SELECT org_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- Atualizar policies de clientes
DROP POLICY IF EXISTS "Users access their org clients" ON clientes;
DROP POLICY IF EXISTS "Fartech admins access all clients" ON clientes;

CREATE POLICY "Users access their org clients"
  ON clientes FOR ALL
  USING (
    org_id = (SELECT org_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all clients"
  ON clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- Atualizar policies de casos
DROP POLICY IF EXISTS "Users access their org cases" ON casos;
DROP POLICY IF EXISTS "Fartech admins access all cases" ON casos;

CREATE POLICY "Users access their org cases"
  ON casos FOR ALL
  USING (
    org_id = (SELECT org_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all cases"
  ON casos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- Atualizar policies de documentos
DROP POLICY IF EXISTS "Users access their org documents" ON documentos;
DROP POLICY IF EXISTS "Fartech admins access all documents" ON documentos;

CREATE POLICY "Users access their org documents"
  ON documentos FOR ALL
  USING (
    org_id = (SELECT org_id FROM usuarios WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all documents"
  ON documentos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- Atualizar policies de organizations
DROP POLICY IF EXISTS "Fartech admins see all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins see their organization" ON organizations;
DROP POLICY IF EXISTS "Fartech admins manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins update their organization" ON organizations;

CREATE POLICY "Fartech admins see all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.is_fartech_admin = TRUE
    )
  );

CREATE POLICY "Org admins see their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT u.org_id FROM usuarios AS u
      WHERE u.id = auth.uid()
      AND u.role IN ('org_admin', 'user')
    )
  );

CREATE POLICY "Fartech admins manage all organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.is_fartech_admin = TRUE
    )
  );

CREATE POLICY "Org admins update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT u.org_id FROM usuarios AS u
      WHERE u.id = auth.uid()
      AND u.role = 'org_admin'
    )
  );

-- ============================================
-- PARTE 5: DADOS DE TESTE
-- ============================================

-- Criar organização de teste (se não existir)
INSERT INTO organizations (
  id,
  name,
  slug,
  email,
  status,
  plan,
  created_at
)
VALUES (
  'c1e7b3a0-0000-0000-0000-000000000001',
  'Organização de Teste',
  'minha-org-teste',
  'contato@minhaorg.com',
  'active',
  'professional',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Criar usuário Fartech Admin de teste
-- IMPORTANTE: Você precisa criar este usuário no Supabase Authentication primeiro
-- Email: admin@fartech.com.br
-- Depois executar:

-- UPDATE usuarios
-- SET 
--   is_fartech_admin = TRUE,
--   role = 'fartech_admin',
--   org_id = NULL
-- WHERE email = 'admin@fartech.com.br';

-- Criar usuário Org Admin de teste
-- IMPORTANTE: Você precisa criar este usuário no Supabase Authentication primeiro
-- Email: gestor@demo.local
-- Depois executar:

-- UPDATE usuarios
-- SET 
--   role = 'org_admin',
--   org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
--   is_fartech_admin = FALSE
-- WHERE email = 'gestor@demo.local';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar usuários
SELECT 
  id,
  nome_completo,
  email,
  role,
  is_fartech_admin,
  org_id
FROM usuarios
LIMIT 10;
