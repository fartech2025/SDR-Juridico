-- =====================================================
-- DIAGNÓSTICO: Por que o gestor não consegue acessar
-- Data: 28 de janeiro de 2026
-- =====================================================

-- 1️⃣ VERIFICAR SE EXISTEM GESTORES NO BANCO
SELECT 
  'Gestores no banco de dados' as titulo,
  COUNT(*) as total,
  STRING_AGG(DISTINCT role::text, ', ') as roles
FROM public.org_members
WHERE role IN ('admin', 'gestor');

-- 2️⃣ LISTAR TODOS OS ORG_MEMBERS COM DETALHES
SELECT 
  'Detalhes de org_members' as titulo,
  om.user_id,
  om.org_id,
  om.role,
  om.ativo,
  u.email,
  u.permissoes
FROM public.org_members om
LEFT JOIN public.usuarios u ON om.user_id = u.id
ORDER BY om.created_at DESC
LIMIT 20;

-- 3️⃣ VERIFICAR USUARIOS COM PERMISSOES
SELECT 
  'Usuários com permissões especiais' as titulo,
  u.id,
  u.email,
  u.permissoes,
  u.org_id
FROM public.usuarios u
WHERE u.permissoes IS NOT NULL AND array_length(u.permissoes, 1) > 0;

-- 4️⃣ VERIFICAR INTEGRIDADE DOS DADOS
SELECT 
  'Integridade: org_members sem role' as titulo,
  COUNT(*) as quantidade
FROM public.org_members
WHERE role IS NULL;

SELECT 
  'Integridade: usuarios sem permissoes array' as titulo,
  COUNT(*) as quantidade
FROM public.usuarios
WHERE permissoes IS NULL;

-- 5️⃣ VERIFICAR RLS POLICIES NA TABELA TAREFAS
SELECT 
  'RLS Policies em tarefas' as titulo,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tarefas'
ORDER BY policyname;

-- 6️⃣ VERIFICAR SE FUNÇÕES HELPER EXISTEM
SELECT 
  'Funções helper criadas' as titulo,
  p.proname,
  pg_get_functiondef(p.oid) as definicao
FROM pg_proc p
WHERE p.proname IN ('is_org_admin_for_org', 'is_fartech_admin')
ORDER BY p.proname;

-- 7️⃣ TESTE: Simular login como gestor
-- Substitua YOUR_GESTOR_EMAIL pelo email real
SELECT 
  'TESTE: Verificando acesso para gestor específico' as titulo,
  u.id,
  u.email,
  om.role,
  om.ativo,
  om.org_id,
  CASE 
    WHEN om.role IN ('admin', 'gestor') AND om.ativo THEN '✅ ACESSO PERMITIDO'
    WHEN om.role NOT IN ('admin', 'gestor') THEN '❌ ROLE INVÁLIDO: ' || om.role
    WHEN NOT om.ativo THEN '❌ USER INATIVO'
    ELSE '❌ DESCONHECIDO'
  END as status_acesso
FROM public.usuarios u
LEFT JOIN public.org_members om ON u.id = om.user_id
WHERE u.email = 'GESTOR_EMAIL_AQUI'  -- ← MUDE PARA EMAIL DO GESTOR
LIMIT 1;

-- 8️⃣ CONTAR DADOS POR ROLE
SELECT 
  'Distribuição de roles' as titulo,
  role,
  COUNT(*) as quantidade,
  COUNT(CASE WHEN ativo THEN 1 END) as ativos
FROM public.org_members
GROUP BY role
ORDER BY quantidade DESC;

-- 9️⃣ VERIFICAR ORGANIZAÇÕES
SELECT 
  'Organizações no sistema' as titulo,
  id,
  COALESCE(nome, name) as nome,
  slug
FROM public.orgs
LIMIT 10;

-- 🔟 VERIFICAR ENUM USER_ROLE
SELECT 
  'ENUM user_role valores' as titulo,
  enumlabel as valor
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'user_role'
ORDER BY enumsortorder;

-- =====================================================
-- PRÓXIMAS AÇÕES:
-- =====================================================
-- 1. Execute as queries acima e veja os resultados
-- 2. Procure por linhas com ❌ que indicam problemas
-- 3. Se não houver org_members para gestor, você precisa:
--    a) Inserir manualmente: INSERT INTO org_members (user_id, org_id, role, ativo)
--    b) Ou verificar se os dados foram perdidos após reset
-- 4. Se role for NULL, execute: UPDATE org_members SET role = 'gestor' WHERE user_id = ?
-- 5. Se ativo for false, execute: UPDATE org_members SET ativo = true WHERE user_id = ?
