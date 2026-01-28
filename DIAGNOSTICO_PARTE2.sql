-- =====================================================
-- DIAGNÓSTICO PARTE 2: Dados Críticos
-- Execute estas queries no Supabase Studio
-- =====================================================

-- 🔴 CRÍTICO 1: Existem gestores no banco?
SELECT 
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN ativo THEN 1 END) as ativos
FROM public.org_members
GROUP BY role
ORDER BY total DESC;

-- 🔴 CRÍTICO 2: Mostrar todos os org_members com detalhes
SELECT 
  om.user_id,
  om.org_id,
  om.role::TEXT as role,
  om.ativo,
  u.email,
  u.permissoes
FROM public.org_members om
LEFT JOIN public.usuarios u ON om.user_id = u.id
ORDER BY om.created_at DESC
LIMIT 30;

-- 🔴 CRÍTICO 3: Funcionários (staff)
SELECT 
  u.email,
  u.id,
  om.role::TEXT as role,
  om.ativo,
  om.org_id
FROM public.usuarios u
LEFT JOIN public.org_members om ON u.id = om.user_id
WHERE om.role IN ('admin', 'gestor')
LIMIT 20;

-- 🔴 CRÍTICO 4: RLS Policies existem?
SELECT 
  policyname,
  qual::TEXT,
  with_check
FROM pg_policies
WHERE tablename = 'tarefas'
ORDER BY policyname;

-- 🔴 CRÍTICO 5: Funções helper foram criadas?
SELECT 
  proname as funcao_nome,
  pg_get_functiondef(oid) as definicao
FROM pg_proc
WHERE proname IN ('is_org_admin_for_org', 'is_fartech_admin')
ORDER BY proname;

-- 🔴 CRÍTICO 6: Contar org_members
SELECT 
  'Total de org_members' as metrica,
  COUNT(*) as valor
FROM public.org_members;

-- 🔴 CRÍTICO 7: Contar usuarios
SELECT 
  'Total de usuarios' as metrica,
  COUNT(*) as valor
FROM public.usuarios;
