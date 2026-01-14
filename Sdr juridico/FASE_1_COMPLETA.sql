-- ============================================
-- FASE 1 COMPLETA: SETUP MULTI-TENANT
-- Execute este arquivo completo no Supabase SQL Editor
-- Tempo estimado: 1 minuto
-- ============================================

-- ============================================
-- PARTE 1: ADICIONAR COLUNAS EM PROFILES
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

-- ============================================
-- PARTE 2: ADICIONAR ORG_ID EM OUTRAS TABELAS
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

-- ============================================
-- PARTE 3: RLS EM PROFILES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os profiles
DROP POLICY IF EXISTS "fartech_admin_all_profiles" ON profiles;
CREATE POLICY "fartech_admin_all_profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.is_fartech_admin = true
    )
  );

-- Org admins veem profiles da mesma org
DROP POLICY IF EXISTS "org_admin_own_org_profiles" ON profiles;
CREATE POLICY "org_admin_own_org_profiles"
  ON profiles FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários veem seus próprios dados
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
CREATE POLICY "users_own_profile"
  ON profiles FOR ALL
  USING (user_id = auth.uid());

-- Usuários veem outros profiles da mesma org
DROP POLICY IF EXISTS "users_same_org_profiles" ON profiles;
CREATE POLICY "users_same_org_profiles"
  ON profiles FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 4: RLS EM ORGS
-- ============================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todas as orgs
DROP POLICY IF EXISTS "fartech_admin_all_orgs" ON orgs;
CREATE POLICY "fartech_admin_all_orgs"
  ON orgs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Org admins veem e editam sua própria org
DROP POLICY IF EXISTS "org_admin_own_org" ON orgs;
CREATE POLICY "org_admin_own_org"
  ON orgs FOR ALL
  USING (
    id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários veem sua própria org (somente leitura)
DROP POLICY IF EXISTS "users_own_org_readonly" ON orgs;
CREATE POLICY "users_own_org_readonly"
  ON orgs FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 5: RLS EM LEADS
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os leads
DROP POLICY IF EXISTS "fartech_admin_all_leads" ON leads;
CREATE POLICY "fartech_admin_all_leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Usuários veem apenas leads da sua org
DROP POLICY IF EXISTS "users_own_org_leads" ON leads;
CREATE POLICY "users_own_org_leads"
  ON leads FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 6: RLS EM CLIENTES
-- ============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os clientes
DROP POLICY IF EXISTS "fartech_admin_all_clientes" ON clientes;
CREATE POLICY "fartech_admin_all_clientes"
  ON clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Usuários veem apenas clientes da sua org
DROP POLICY IF EXISTS "users_own_org_clientes" ON clientes;
CREATE POLICY "users_own_org_clientes"
  ON clientes FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 7: RLS EM CASOS
-- ============================================

ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os casos
DROP POLICY IF EXISTS "fartech_admin_all_casos" ON casos;
CREATE POLICY "fartech_admin_all_casos"
  ON casos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Usuários veem apenas casos da sua org
DROP POLICY IF EXISTS "users_own_org_casos" ON casos;
CREATE POLICY "users_own_org_casos"
  ON casos FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 8: RLS EM DOCUMENTOS
-- ============================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os documentos
DROP POLICY IF EXISTS "fartech_admin_all_documentos" ON documentos;
CREATE POLICY "fartech_admin_all_documentos"
  ON documentos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND is_fartech_admin = true
    )
  );

-- Usuários veem apenas documentos da sua org
DROP POLICY IF EXISTS "users_own_org_documentos" ON documentos;
CREATE POLICY "users_own_org_documentos"
  ON documentos FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 9: CRIAR ORGANIZAÇÃO DE TESTE
-- ============================================

-- Inserir organização de teste (se não existir)
INSERT INTO orgs (id, nome, created_at)
VALUES (
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  'Demo Organization',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PARTE 10: CRIAR TABELA ORG_MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_ativo ON org_members(ativo);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(role);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_org_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_org_members_updated_at ON org_members;
CREATE TRIGGER trigger_update_org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_org_members_updated_at();

-- ============================================
-- PARTE 11: RLS EM ORG_MEMBERS
-- ============================================

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Fartech admins veem todos os membros
DROP POLICY IF EXISTS "fartech_admin_all_members" ON org_members;
CREATE POLICY "fartech_admin_all_members"
  ON org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.is_fartech_admin = true
    )
  );

-- Org admins veem e gerenciam membros da sua org
DROP POLICY IF EXISTS "org_admin_own_org_members" ON org_members;
CREATE POLICY "org_admin_own_org_members"
  ON org_members FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Usuários veem membros da mesma org (somente leitura)
DROP POLICY IF EXISTS "users_same_org_members" ON org_members;
CREATE POLICY "users_same_org_members"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Usuários veem seus próprios dados de membro
DROP POLICY IF EXISTS "users_own_member_record" ON org_members;
CREATE POLICY "users_own_member_record"
  ON org_members FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICAÇÃO: MOSTRAR RESULTADO
-- ============================================

SELECT '✅✅✅ SETUP MULTI-TENANT COMPLETO!' AS status;

-- Verificar colunas adicionadas em profiles
SELECT 
  '✅ Colunas em profiles' AS verificacao,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('org_id', 'role', 'is_fartech_admin')
ORDER BY column_name;

-- Verificar tabela org_members criada
SELECT 
  '✅ Tabela org_members' AS verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'org_members'
    ) THEN 'Criada com sucesso'
    ELSE 'ERRO: não foi criada'
  END AS status;

-- Verificar RLS habilitado
SELECT 
  '✅ RLS Habilitado' AS verificacao,
  tablename,
  rowsecurity AS ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orgs', 'org_members', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tablename;

-- Verificar organização de teste
SELECT 
  '✅ Organização Demo' AS verificacao,
  id,
  nome,
  created_at
FROM orgs
WHERE id = 'c1e7b3a0-0000-0000-0000-000000000001';

-- ============================================
-- PRÓXIMOS PASSOS
-- ============================================

/*
🎉 SETUP COMPLETO!

📌 AGORA FAÇA:

1️⃣ CRIAR 3 USUÁRIOS NO SUPABASE AUTH:
   Supabase Dashboard → Authentication → Users → Create User
   
   a) admin@fartech.com.br / Fartech@2024 [✓ Auto Confirm]
   b) gestor@demo.local / Demo@2024 [✓ Auto Confirm]
   c) user@demo.local / Demo@2024 [✓ Auto Confirm]

2️⃣ DEPOIS EXECUTE O SQL ABAIXO para configurar os usuários:
*/

-- ============================================
-- CONFIGURAR FARTECH ADMIN
-- ============================================

UPDATE profiles 
SET 
  is_fartech_admin = true,
  role = 'admin',
  org_id = NULL
WHERE email = 'admin@fartech.com.br';

-- ============================================
-- CONFIGURAR ORG ADMIN
-- ============================================

UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'admin',
  is_fartech_admin = false
WHERE email = 'gestor@demo.local';

INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  user_id,
  'admin',
  true
FROM profiles
WHERE email = 'gestor@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET role = EXCLUDED.role, ativo = EXCLUDED.ativo;

-- ============================================
-- CONFIGURAR USER REGULAR
-- ============================================

UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'advogado',
  is_fartech_admin = false
WHERE email = 'user@demo.local';

INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  user_id,
  'advogado',
  true
FROM profiles
WHERE email = 'user@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET role = EXCLUDED.role, ativo = EXCLUDED.ativo;

-- ============================================
-- VERIFICAÇÃO FINAL DOS USUÁRIOS
-- ============================================

SELECT 
  '🎯 USUÁRIOS CONFIGURADOS' AS resultado,
  p.email,
  p.role,
  p.is_fartech_admin,
  om.role AS member_role,
  o.nome AS org_name,
  CASE 
    WHEN p.is_fartech_admin = true THEN '🔴 FARTECH ADMIN'
    WHEN p.role = 'admin' THEN '🟡 ORG ADMIN'
    ELSE '🟢 USER'
  END AS tipo
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.user_id
LEFT JOIN orgs o ON o.id = p.org_id
WHERE p.email IN (
  'admin@fartech.com.br',
  'gestor@demo.local',
  'user@demo.local'
)
ORDER BY 
  CASE 
    WHEN p.is_fartech_admin = true THEN 1
    WHEN p.role = 'admin' THEN 2
    ELSE 3
  END;

/*
✅ FASE 1 COMPLETA!

📋 CREDENCIAIS DE TESTE:

🔴 FARTECH ADMIN: admin@fartech.com.br / Fartech@2024
🟡 ORG ADMIN: gestor@demo.local / Demo@2024
🟢 USER: user@demo.local / Demo@2024

🚀 PRÓXIMO: Avisar para iniciar FASE 2 (Backend)
*/
