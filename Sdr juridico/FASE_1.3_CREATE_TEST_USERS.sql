-- ============================================
-- FASE 1.3: CRIAR USUÁRIOS DE TESTE
-- ============================================

-- IMPORTANTE: Antes de executar este script, criar os usuários manualmente em:
-- Supabase Dashboard → Authentication → Users → Create User

-- ============================================
-- INSTRUÇÕES PARA CRIAR USUÁRIOS NO SUPABASE
-- ============================================

/*
PASSO 1: Criar 3 usuários manualmente no Supabase Authentication:

1. FARTECH ADMIN:
   Email: admin@fartech.com.br
   Password: Fartech@2024
   Confirm Password: Fartech@2024
   [X] Auto Confirm User
   
2. ORG ADMIN:
   Email: gestor@demo.local
   Password: Demo@2024
   Confirm Password: Demo@2024
   [X] Auto Confirm User

3. USER REGULAR:
   Email: user@demo.local
   Password: Demo@2024
   Confirm Password: Demo@2024
   [X] Auto Confirm User

PASSO 2: Depois de criar os 3 usuários, execute o SQL abaixo:
*/

-- ============================================
-- CONFIGURAR FARTECH ADMIN
-- ============================================

UPDATE profiles 
SET 
  is_fartech_admin = true,
  role = 'admin',
  org_id = NULL,  -- Fartech admins não têm org específica
  updated_at = NOW()
WHERE email = 'admin@fartech.com.br';

-- Verificar Fartech Admin
SELECT 
  id,
  email,
  nome,
  role,
  org_id,
  is_fartech_admin,
  created_at
FROM profiles
WHERE email = 'admin@fartech.com.br';

-- ============================================
-- CONFIGURAR ORG ADMIN
-- ============================================

-- Atualizar profile do Org Admin
UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'admin',
  is_fartech_admin = false,
  updated_at = NOW()
WHERE email = 'gestor@demo.local';

-- Adicionar em org_members
INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'admin',
  true
FROM profiles
WHERE email = 'gestor@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET 
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- Verificar Org Admin
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role AS profile_role,
  p.org_id,
  p.is_fartech_admin,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.id
LEFT JOIN orgs o ON o.id = p.org_id
WHERE p.email = 'gestor@demo.local';

-- ============================================
-- CONFIGURAR USER REGULAR
-- ============================================

-- Atualizar profile do User
UPDATE profiles 
SET 
  org_id = 'c1e7b3a0-0000-0000-0000-000000000001',
  role = 'advogado',
  is_fartech_admin = false,
  updated_at = NOW()
WHERE email = 'user@demo.local';

-- Adicionar em org_members
INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT 
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'advogado',
  true
FROM profiles
WHERE email = 'user@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET 
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- Verificar User Regular
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role AS profile_role,
  p.org_id,
  p.is_fartech_admin,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.id
LEFT JOIN orgs o ON o.id = p.org_id
WHERE p.email = 'user@demo.local';

-- ============================================
-- VERIFICAÇÃO FINAL DE TODOS OS USUÁRIOS
-- ============================================

-- Listar todos os usuários de teste configurados
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role AS profile_role,
  p.org_id,
  p.is_fartech_admin,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name,
  CASE 
    WHEN p.is_fartech_admin = true THEN '🔴 FARTECH ADMIN'
    WHEN p.role = 'admin' THEN '🟡 ORG ADMIN'
    ELSE '🟢 USER'
  END AS tipo_usuario
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.id
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

-- Verificar que demo organization existe
SELECT 
  id,
  nome,
  slug,
  created_at,
  '✅ Organização de teste existe' AS status
FROM orgs
WHERE id = 'c1e7b3a0-0000-0000-0000-000000000001';

-- ============================================
-- CREDENCIAIS DE TESTE - RESUMO
-- ============================================

/*
📋 CREDENCIAIS PARA TESTES:

🔴 FARTECH ADMIN (Super Admin - Gerencia todas as orgs)
   Email: admin@fartech.com.br
   Senha: Fartech@2024
   Acesso: /fartech/organizations

🟡 ORG ADMIN (Admin da Demo Organization)
   Email: gestor@demo.local
   Senha: Demo@2024
   Acesso: /app/users, /app/settings

🟢 USER (Usuário Regular da Demo Organization)
   Email: user@demo.local
   Senha: Demo@2024
   Acesso: /app/dashboard (sem menus admin)

🏢 ORGANIZAÇÃO DE TESTE:
   Nome: Demo Organization
   Slug: demo
   ID: c1e7b3a0-0000-0000-0000-000000000001
*/
