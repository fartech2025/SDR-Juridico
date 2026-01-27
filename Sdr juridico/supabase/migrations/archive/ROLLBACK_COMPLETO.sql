-- ============================================
-- ROLLBACK COMPLETO - REMOVER MULTI-TENANT
-- ============================================
-- Este script remove TODAS as mudanças multi-tenant
-- e restaura o banco ao estado original
-- VERSÃO SEGURA: Verifica existência antes de remover
-- ============================================

-- ============================================
-- PARTE 1: REMOVER POLICIES DE RLS
-- ============================================

-- Remover policies de usuarios (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    DROP POLICY IF EXISTS "Users can read own profile" ON usuarios;
    DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
    DROP POLICY IF EXISTS "Fartech admins see all users" ON usuarios;
    DROP POLICY IF EXISTS "Fartech admins manage all users" ON usuarios;
    DROP POLICY IF EXISTS "Org admins see org users" ON usuarios;
    DROP POLICY IF EXISTS "Users in same org" ON usuarios;
  END IF;
END $$;

-- Remover policies de leads (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    DROP POLICY IF EXISTS "Users access their org leads" ON leads;
    DROP POLICY IF EXISTS "Fartech admins access all leads" ON leads;
  END IF;
END $$;

-- Remover policies de clientes (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
    DROP POLICY IF EXISTS "Users access their org clients" ON clientes;
    DROP POLICY IF EXISTS "Fartech admins access all clients" ON clientes;
  END IF;
END $$;

-- Remover policies de casos (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'casos') THEN
    DROP POLICY IF EXISTS "Users access their org cases" ON casos;
    DROP POLICY IF EXISTS "Fartech admins access all cases" ON casos;
  END IF;
END $$;

-- Remover policies de documentos (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documentos') THEN
    DROP POLICY IF EXISTS "Users access their org documents" ON documentos;
    DROP POLICY IF EXISTS "Fartech admins access all documents" ON documentos;
  END IF;
END $$;

-- Remover policies de organizations (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    DROP POLICY IF EXISTS "Fartech admins see all organizations" ON organizations;
    DROP POLICY IF EXISTS "Org admins see their organization" ON organizations;
    DROP POLICY IF EXISTS "Fartech admins manage all organizations" ON organizations;
    DROP POLICY IF EXISTS "Org admins update their organization" ON organizations;
  END IF;
END $$;

-- Remover policies da tabela users (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Fartech admins see all users" ON public.users;
    DROP POLICY IF EXISTS "Fartech admins manage all users" ON public.users;
  END IF;
END $$;

-- ============================================
-- PARTE 2: DESABILITAR RLS NAS TABELAS
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
    ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'casos') THEN
    ALTER TABLE casos DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documentos') THEN
    ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- PARTE 3: REMOVER COLUNAS org_id DAS TABELAS
-- ============================================

-- Remover indexes de org_id
DROP INDEX IF EXISTS idx_leads_org_id;
DROP INDEX IF EXISTS idx_clientes_org_id;
DROP INDEX IF EXISTS idx_casos_org_id;
DROP INDEX IF EXISTS idx_documentos_org_id;
DROP INDEX IF EXISTS idx_usuarios_org_id;
DROP INDEX IF EXISTS idx_usuarios_role;
DROP INDEX IF EXISTS idx_usuarios_is_fartech_admin;

-- Remover colunas org_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    ALTER TABLE leads DROP COLUMN IF EXISTS org_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
    ALTER TABLE clientes DROP COLUMN IF EXISTS org_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'casos') THEN
    ALTER TABLE casos DROP COLUMN IF EXISTS org_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documentos') THEN
    ALTER TABLE documentos DROP COLUMN IF EXISTS org_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    ALTER TABLE usuarios DROP COLUMN IF EXISTS org_id CASCADE;
    ALTER TABLE usuarios DROP COLUMN IF EXISTS role CASCADE;
    ALTER TABLE usuarios DROP COLUMN IF EXISTS is_fartech_admin CASCADE;
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS valid_user_role;
  END IF;
END $$;

-- ============================================
-- PARTE 4: REMOVER TRIGGERS E FUNCTIONS
-- ============================================

-- Remover trigger da tabela users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Remover function handle_new_user (se foi criada)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- PARTE 5: REMOVER TABELAS CRIADAS
-- ============================================

-- Remover indexes da tabela users
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_org_id;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_fartech_admin;

-- Remover tabela public.users (se existir)
DROP TABLE IF EXISTS public.users CASCADE;

-- Remover indexes da tabela organizations
DROP INDEX IF EXISTS idx_organizations_slug;
DROP INDEX IF EXISTS idx_organizations_status;
DROP INDEX IF EXISTS idx_organizations_plan;

-- Remover tabela organizations
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- PARTE 6: RECRIAR TRIGGER ORIGINAL DE USUARIOS (se tabela existir)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    -- Verificar se a função create_user_profile existe e recriá-la se necessário
    CREATE OR REPLACE FUNCTION create_user_profile()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      INSERT INTO public.usuarios (id, nome_completo, email)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
        NEW.email
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recriar trigger para criar perfil automaticamente
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_user_profile();
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- Listar todas as tabelas no schema public
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- FIM DO ROLLBACK
-- ============================================
-- Se não houver tabelas, o banco está vazio
-- Execute as migrations originais: 00_create_all_tables.sql
-- ============================================
