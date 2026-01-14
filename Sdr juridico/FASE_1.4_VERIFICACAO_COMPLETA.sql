-- ============================================
-- FASE 1.4: VERIFICAÇÃO COMPLETA DO BANCO
-- Script para validar todas as mudanças da Fase 1
-- ============================================

-- ============================================
-- 1. VERIFICAR COLUNAS ADICIONADAS EM PROFILES
-- ============================================

SELECT 
  '1️⃣ COLUNAS PROFILES' AS secao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('org_id', 'role', 'is_fartech_admin') THEN '✅ Nova coluna'
    ELSE '📌 Existente'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY 
  CASE 
    WHEN column_name IN ('org_id', 'role', 'is_fartech_admin') THEN 1
    ELSE 2
  END,
  column_name;

-- ============================================
-- 2. VERIFICAR ÍNDICES EM PROFILES
-- ============================================

SELECT 
  '2️⃣ ÍNDICES PROFILES' AS secao,
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%org_id%' THEN '✅ Novo índice org_id'
    WHEN indexname LIKE '%role%' THEN '✅ Novo índice role'
    WHEN indexname LIKE '%fartech%' THEN '✅ Novo índice is_fartech_admin'
    ELSE '📌 Existente'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;

-- ============================================
-- 3. VERIFICAR COLUNA ORG_ID EM OUTRAS TABELAS
-- ============================================

SELECT 
  '3️⃣ COLUNA ORG_ID OUTRAS TABELAS' AS secao,
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = c.table_name 
        AND indexname LIKE '%org_id%'
    ) THEN '✅ Com índice'
    ELSE '⚠️ Sem índice'
  END AS index_status
FROM information_schema.columns c
WHERE table_schema = 'public' 
  AND column_name = 'org_id'
  AND table_name IN ('leads', 'clientes', 'casos', 'documentos', 'integrations', 'profiles', 'org_members')
ORDER BY table_name;

-- ============================================
-- 4. VERIFICAR TABELA ORG_MEMBERS
-- ============================================

-- Verificar se tabela existe
SELECT 
  '4️⃣ TABELA ORG_MEMBERS' AS secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'org_members'
    ) THEN '✅ Tabela existe'
    ELSE '❌ Tabela NÃO existe'
  END AS status;

-- Listar colunas de org_members
SELECT 
  '4️⃣ COLUNAS ORG_MEMBERS' AS secao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'org_members'
ORDER BY ordinal_position;

-- Verificar constraints de org_members
SELECT 
  '4️⃣ CONSTRAINTS ORG_MEMBERS' AS secao,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'org_members'
ORDER BY constraint_type, constraint_name;

-- ============================================
-- 5. VERIFICAR RLS HABILITADO
-- ============================================

SELECT 
  '5️⃣ RLS HABILITADO' AS secao,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Ativo'
    ELSE '❌ RLS Desativado'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orgs', 'org_members', 'leads', 'clientes', 'casos', 'documentos', 'integrations')
ORDER BY tablename;

-- ============================================
-- 6. CONTAR POLÍTICAS RLS
-- ============================================

SELECT 
  '6️⃣ POLÍTICAS RLS' AS secao,
  tablename,
  COUNT(*) AS total_policies,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Políticas configuradas'
    WHEN COUNT(*) = 1 THEN '⚠️ Apenas 1 política'
    ELSE '❌ Sem políticas'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orgs', 'org_members', 'leads', 'clientes', 'casos', 'documentos', 'integrations')
GROUP BY tablename
ORDER BY tablename;

-- Listar todas as políticas
SELECT 
  '6️⃣ LISTA DE POLÍTICAS' AS secao,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'orgs', 'org_members', 'leads', 'clientes', 'casos', 'documentos')
ORDER BY tablename, policyname;

-- ============================================
-- 7. VERIFICAR ORGANIZAÇÃO DE TESTE
-- ============================================

SELECT 
  '7️⃣ ORGANIZAÇÃO DEMO' AS secao,
  id,
  nome,
  slug,
  created_at,
  CASE 
    WHEN id = 'c1e7b3a0-0000-0000-0000-000000000001' THEN '✅ ID correto'
    ELSE '⚠️ ID diferente'
  END AS status
FROM orgs
WHERE slug = 'demo' OR id = 'c1e7b3a0-0000-0000-0000-000000000001'
LIMIT 1;

-- ============================================
-- 8. VERIFICAR USUÁRIOS DE TESTE
-- ============================================

SELECT 
  '8️⃣ USUÁRIOS DE TESTE' AS secao,
  p.email,
  p.role AS profile_role,
  p.is_fartech_admin,
  p.org_id IS NOT NULL AS has_org,
  om.role AS member_role,
  om.ativo AS member_active,
  o.nome AS org_name,
  CASE 
    WHEN p.is_fartech_admin = true THEN '🔴 FARTECH ADMIN'
    WHEN p.role = 'admin' AND p.org_id IS NOT NULL THEN '🟡 ORG ADMIN'
    WHEN p.org_id IS NOT NULL THEN '🟢 USER'
    ELSE '⚪ SEM CONFIGURAÇÃO'
  END AS tipo
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

-- ============================================
-- 9. CONTAGEM GERAL
-- ============================================

-- Contar registros em org_members
SELECT 
  '9️⃣ TOTAIS' AS secao,
  'org_members' AS tabela,
  COUNT(*) AS total_registros
FROM org_members
UNION ALL
SELECT 
  '9️⃣ TOTAIS',
  'orgs',
  COUNT(*)
FROM orgs
UNION ALL
SELECT 
  '9️⃣ TOTAIS',
  'profiles',
  COUNT(*)
FROM profiles;

-- ============================================
-- 10. VERIFICAÇÃO DE INTEGRIDADE
-- ============================================

-- Verificar se todos os org_id em profiles existem em orgs
SELECT 
  '🔟 INTEGRIDADE' AS secao,
  COUNT(*) AS profiles_com_org_invalida,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as org_id são válidas'
    ELSE '❌ Existem profiles com org_id inválida'
  END AS status
FROM profiles p
WHERE p.org_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM orgs o WHERE o.id = p.org_id);

-- Verificar se todos os org_members têm user_id válido
SELECT 
  '🔟 INTEGRIDADE' AS secao,
  COUNT(*) AS members_com_user_invalido,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todos os user_id são válidos'
    ELSE '❌ Existem members com user_id inválido'
  END AS status
FROM org_members om
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = om.user_id);

-- Verificar se todos os org_members têm org_id válido
SELECT 
  '🔟 INTEGRIDADE' AS secao,
  COUNT(*) AS members_com_org_invalida,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as org_id são válidas'
    ELSE '❌ Existem members com org_id inválida'
  END AS status
FROM org_members om
WHERE NOT EXISTS (SELECT 1 FROM orgs o WHERE o.id = om.org_id);

-- ============================================
-- 🎯 RESUMO FINAL
-- ============================================

SELECT 
  '🎯 RESUMO FASE 1' AS secao,
  'Status Geral' AS item,
  CASE 
    WHEN (
      -- Verificar colunas em profiles
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'org_id')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_fartech_admin')
      -- Verificar tabela org_members
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_members')
      -- Verificar org de teste
      AND EXISTS (SELECT 1 FROM orgs WHERE id = 'c1e7b3a0-0000-0000-0000-000000000001')
      -- Verificar RLS ativo
      AND (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('profiles', 'org_members', 'orgs') AND rowsecurity = true) >= 3
    ) THEN '✅✅✅ FASE 1 COMPLETA - BANCO CONFIGURADO!'
    ELSE '❌ FASE 1 INCOMPLETA - Revisar erros acima'
  END AS resultado;

-- ============================================
-- 📝 PRÓXIMOS PASSOS
-- ============================================

/*
✅ Se a verificação mostrar "FASE 1 COMPLETA", você pode prosseguir para:

📌 FASE 2: Código Backend
   - Restaurar org.ts
   - Restaurar useCurrentUser
   - Reativar filtros org_id nos services

🔗 Arquivo: STATUS_IMPLEMENTACAO.md (seção Fase 2)

❌ Se houver erros, revisar e corrigir antes de prosseguir!
*/
