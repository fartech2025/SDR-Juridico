-- ============================================
-- FASE 1.3: CRIAR USUARIOS DE TESTE
-- ============================================

-- IMPORTANTE: Antes de executar este script, criar os usuarios manualmente em:
-- Supabase Dashboard > Authentication > Users > Create User

/*
PASSO 1: Criar 3 usuarios manualmente no Supabase Authentication:

1. FARTECH ADMIN:
   Email: admin@fartech.com.br
   Password: Fartech@2024
   [X] Auto Confirm User

2. ORG ADMIN:
   Email: gestor@demo.local
   Password: Demo@2024
   [X] Auto Confirm User

3. USER REGULAR:
   Email: user@demo.local
   Password: Demo@2024
   [X] Auto Confirm User

PASSO 2: Depois de criar os 3 usuarios, execute o SQL abaixo:
*/

-- ============================================
-- GARANTIR ENTRADAS EM USUARIOS (caso o trigger nao tenha criado)
-- ============================================

INSERT INTO usuarios (id, email, nome_completo, permissoes, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'nome_completo', email),
  ARRAY['user']::text[],
  NOW(),
  NOW()
FROM auth.users
WHERE email IN ('admin@fartech.com.br', 'gestor@demo.local', 'user@demo.local')
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  nome_completo = EXCLUDED.nome_completo,
  updated_at = NOW();

-- ============================================
-- CONFIGURAR FARTECH ADMIN
-- ============================================

UPDATE usuarios
SET permissoes = ARRAY['fartech_admin']::text[],
    updated_at = NOW()
WHERE email = 'admin@fartech.com.br';

SELECT
  id,
  email,
  nome_completo,
  permissoes,
  created_at
FROM usuarios
WHERE email = 'admin@fartech.com.br';

-- ============================================
-- CONFIGURAR ORG ADMIN
-- ============================================

UPDATE usuarios
SET permissoes = ARRAY['gestor']::text[],
    updated_at = NOW()
WHERE email = 'gestor@demo.local';

INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'admin',
  true
FROM usuarios
WHERE email = 'gestor@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo;

SELECT
  u.id,
  u.email,
  u.nome_completo,
  u.permissoes,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name
FROM usuarios u
LEFT JOIN org_members om ON om.user_id = u.id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE u.email = 'gestor@demo.local';

-- ============================================
-- CONFIGURAR USER REGULAR
-- ============================================

UPDATE usuarios
SET permissoes = ARRAY['user']::text[],
    updated_at = NOW()
WHERE email = 'user@demo.local';

INSERT INTO org_members (org_id, user_id, role, ativo)
SELECT
  'c1e7b3a0-0000-0000-0000-000000000001'::uuid,
  id,
  'advogado',
  true
FROM usuarios
WHERE email = 'user@demo.local'
ON CONFLICT (org_id, user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  ativo = EXCLUDED.ativo;

SELECT
  u.id,
  u.email,
  u.nome_completo,
  u.permissoes,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name
FROM usuarios u
LEFT JOIN org_members om ON om.user_id = u.id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE u.email = 'user@demo.local';

-- ============================================
-- VERIFICACAO FINAL DE TODOS OS USUARIOS
-- ============================================

SELECT
  u.id,
  u.email,
  u.nome_completo,
  u.permissoes,
  om.role AS member_role,
  om.ativo,
  o.nome AS org_name,
  CASE
    WHEN u.permissoes @> ARRAY['fartech_admin']::text[] THEN 'FARTECH ADMIN'
    WHEN om.role IN ('admin', 'gestor') THEN 'ORG ADMIN'
    ELSE 'USER'
  END AS tipo_usuario
FROM usuarios u
LEFT JOIN org_members om ON om.user_id = u.id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE u.email IN (
  'admin@fartech.com.br',
  'gestor@demo.local',
  'user@demo.local'
)
ORDER BY
  CASE
    WHEN u.permissoes @> ARRAY['fartech_admin']::text[] THEN 1
    WHEN om.role IN ('admin', 'gestor') THEN 2
    ELSE 3
  END;

SELECT
  id,
  nome,
  slug,
  created_at,
  'Organizacao de teste existe' AS status
FROM orgs
WHERE id = 'c1e7b3a0-0000-0000-0000-000000000001';

/*
CREDENCIAIS PARA TESTES:

FARTECH ADMIN
  Email: admin@fartech.com.br
  Senha: Fartech@2024
  Acesso: /admin/organizations

ORG ADMIN (Demo Organization)
  Email: gestor@demo.local
  Senha: Demo@2024
  Acesso: /org/users, /org/settings

USER (Demo Organization)
  Email: user@demo.local
  Senha: Demo@2024
  Acesso: /app/dashboard
*/

