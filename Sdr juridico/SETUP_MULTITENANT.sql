-- =====================================================
-- DEPRECATED: Este script usa USUARIOS. Padrao atual: usuarios + org_members.
-- Use SETUP_MULTITENANT_INCREMENTAL.sql para o fluxo atualizado.
-- =====================================================

-- ============================================
-- SETUP MULTI-TENANT - Execute no SQL Editor do Supabase
-- ============================================
-- Este script cria toda a estrutura multi-tenant:
-- 0. Criar tabela users (USUARIOS)
-- 1. Tabela organizations
-- 2. Adiciona colunas org_id nas tabelas existentes
-- 3. Configura RLS (Row Level Security)
-- 4. Cria dados de teste

-- ============================================
-- PARTE 0: Criar tabela users (public.users)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela users no schema public
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Multi-tenant
  org_id UUID,
  role VARCHAR(20) DEFAULT 'user',
  is_fartech_admin BOOLEAN DEFAULT FALSE,
  
  -- Professional Info
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_sign_in_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_user_role CHECK (role IN ('fartech_admin', 'org_admin', 'user'))
);

-- Indexes para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_fartech_admin ON public.users(is_fartech_admin);

-- Trigger para preencher email automaticamente de auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar user no public.users quando criar em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 1: Criar tabela organizations
-- ============================================

-- Criar tabela organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB DEFAULT '{}',
  
  -- Plan and Limits
  plan VARCHAR(50) DEFAULT 'trial',
  max_users INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  max_cases INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Billing
  billing_email VARCHAR(255),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  next_billing_date TIMESTAMP,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#059669',
  secondary_color VARCHAR(7),
  custom_domain VARCHAR(255),
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Management
  provisioned_by UUID,
  managed_by UUID,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  CONSTRAINT valid_plan CHECK (plan IN ('trial', 'basic', 'professional', 'enterprise')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar foreign keys de organizations para users
ALTER TABLE organizations
ADD CONSTRAINT fk_organizations_provisioned_by 
  FOREIGN KEY (provisioned_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE organizations
ADD CONSTRAINT fk_organizations_managed_by 
  FOREIGN KEY (managed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Adicionar foreign key de users.org_id para organizations
ALTER TABLE public.users
ADD CONSTRAINT fk_users_org_id
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================
-- PARTE 2: RLS - Organizations
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist (para recriar)
DROP POLICY IF EXISTS "Fartech admins see all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins see their organization" ON organizations;
DROP POLICY IF EXISTS "Fartech admins manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins update their organization" ON organizations;

-- Fartech admins veem todas organizaÃ§Ãµes
CREATE POLICY "Fartech admins see all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_fartech_admin = TRUE
    )
  );

-- Org admins veem sua prÃ³pria organizaÃ§Ã£o
CREATE POLICY "Org admins see their organization"
  ON organizations FOR SELECT
  USING (
    id = (SELECT org_id FROM public.users WHERE public.users.id = auth.uid())
  );

-- Fartech admins gerenciam todas
CREATE POLICY "Fartech admins manage all organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_fartech_admin = TRUE
    )
  );

-- Org admins atualizam sua organizaÃ§Ã£o
CREATE POLICY "Org admins update their organization"
  ON organizations FOR UPDATE
  USING (
    id = (
      SELECT org_id FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'org_admin'
    )
  );

-- ============================================
-- PARTE 3: RLS - Users
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fartech admins see all users" ON users;
DROP POLICY IF EXISTS "Org admins see their organization users" ON users;
DROP POLICY IF EXISTS "Users see their organization members" ON users;
DROP POLICY IF EXISTS "Users update their own profile" ON users;
DROP POLICY IF EXISTS "Org admins manage their org users" ON users;

-- Fartech admins veem todos usuÃ¡rios
CREATE POLICY "Fartech admins see all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.is_fartech_admin = TRUE
    )
  );

-- Org admins veem usuÃ¡rios da sua org
CREATE POLICY "Org admins see their organization users"
  ON public.users FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'fartech_admin')
    )
  );

-- UsuÃ¡rios veem membros da sua org
CREATE POLICY "Users see their organization members"
  ON public.users FOR SELECT
  USING (
    org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
  );

-- UsuÃ¡rios atualizam seu prÃ³prio perfil
CREATE POLICY "Users update their own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- Org admins gerenciam usuÃ¡rios da org
CREATE POLICY "Org admins manage their org users"
  ON public.users FOR ALL
  USING (
    org_id = (
      SELECT org_id FROM public.users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'fartech_admin')
    )
  );

-- ============================================
-- PARTE 4: Adicionar org_id Ã s tabelas existentes
-- ============================================

-- LEADS
ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access their org leads" ON leads;
DROP POLICY IF EXISTS "Fartech admins access all leads" ON leads;

CREATE POLICY "Users access their org leads"
  ON leads FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Fartech admins access all leads"
  ON leads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_fartech_admin = TRUE));

-- CLIENTES
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clientes_org_id ON clientes(org_id);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access their org clients" ON clientes;
DROP POLICY IF EXISTS "Fartech admins access all clients" ON clientes;

CREATE POLICY "Users access their org clients"
  ON clientes FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Fartech admins access all clients"
  ON clientes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_fartech_admin = TRUE));

-- CASOS
ALTER TABLE casos ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_casos_org_id ON casos(org_id);
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access their org cases" ON casos;
DROP POLICY IF EXISTS "Fartech admins access all cases" ON casos;

CREATE POLICY "Users access their org cases"
  ON casos FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Fartech admins access all cases"
  ON casos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_fartech_admin = TRUE));

-- DOCUMENTOS
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documentos_org_id ON documentos(org_id);
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access their org documents" ON documentos;
DROP POLICY IF EXISTS "Fartech admins access all documents" ON documentos;

CREATE POLICY "Users access their org documents"
  ON documentos FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Fartech admins access all documents"
  ON documentos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_fartech_admin = TRUE));

-- ============================================
-- PARTE 5: Criar dados de teste
-- ============================================

-- Criar organizaÃ§Ã£o de teste
INSERT INTO organizations (name, slug, email, plan, status)
VALUES ('Minha OrganizaÃ§Ã£o Teste', 'minha-org-teste', 'contato@minhaorg.com', 'professional', 'active')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PARTE 6: Atribuir organizaÃ§Ã£o ao usuÃ¡rio teste
-- ============================================
-- Usando email de teste: gestor@demo.local

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Pegar ID da organizaÃ§Ã£o criada
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'minha-org-teste';
  
  -- Pegar user_id pelo email de auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gestor@demo.local';
  
  -- Criar registro em public.users se nÃ£o existir
  INSERT INTO public.users (id, email, full_name, org_id, role, is_fartech_admin, created_at)
  VALUES (v_user_id, 'gestor@demo.local', 'Gestor Demo', v_org_id, 'org_admin', FALSE, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    org_id = v_org_id,
    role = 'org_admin',
    is_fartech_admin = FALSE;
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'UsuÃ¡rio atualizado com sucesso!';
  ELSE
    RAISE NOTICE 'UsuÃ¡rio nÃ£o encontrado em auth.users. Crie o usuÃ¡rio primeiro via signup.';
  END IF;
END $$;

-- ============================================
-- VERIFICAÃ‡ÃƒO: Ver o que foi criado
-- ============================================

-- Ver organizaÃ§Ãµes
SELECT id, name, slug, plan, status, created_at FROM organizations;

-- Ver usuÃ¡rios
SELECT id, email, org_id, role, is_fartech_admin, created_at 
FROM public.users 
WHERE email = 'gestor@demo.local';

-- ============================================
-- FIM DO SETUP
-- ============================================
-- Agora vocÃª pode testar a aplicaÃ§Ã£o!
-- FaÃ§a login e verÃ¡ as novas opÃ§Ãµes no menu.
