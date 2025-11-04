-- ====================================================================
-- Script de Verificação de Tabelas do Banco de Dados
-- Description: Lista todas as tabelas, views, funções e objetos do schema public
-- Date: 2025-11-04
-- ====================================================================

-- ====================================================================
-- 1. LISTAR TODAS AS TABELAS
-- ====================================================================
SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_name IN ('questoes', 'questoes_imagens', 'simulados', 'simulado_questoes', 
                        'resultados_simulados', 'resultados_por_tema', 'resultados_por_dificuldade', 
                        'resultados_por_hora', 'usuarios') THEN '✅ USADA'
    ELSE '❌ NÃO USADA'
  END as status_uso
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY status_uso, table_name;

-- ====================================================================
-- 2. TAMANHO DAS TABELAS
-- ====================================================================
SELECT 
  schemaname as schema,
  tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ====================================================================
-- 3. LISTAR TODAS AS VIEWS
-- ====================================================================
SELECT 
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ====================================================================
-- 4. LISTAR FUNÇÕES/PROCEDURES
-- ====================================================================
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ====================================================================
-- 5. VERIFICAR FOREIGN KEYS E DEPENDÊNCIAS
-- ====================================================================
SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ====================================================================
-- 6. LISTAR INDEXES
-- ====================================================================
SELECT
  tablename as table_name,
  indexname as index_name,
  indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ====================================================================
-- 7. VERIFICAR TRIGGERS
-- ====================================================================
SELECT
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ====================================================================
-- 8. CONTAGEM DE REGISTROS POR TABELA
-- ====================================================================
-- Execute esta query para ver quantos registros existem em cada tabela:
/*
DO $$
DECLARE
  rec RECORD;
  table_count INTEGER;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM ' || rec.table_name INTO table_count;
    RAISE NOTICE 'Table: % - Records: %', rec.table_name, table_count;
  END LOOP;
END $$;
*/

-- ====================================================================
-- 9. TABELAS VAZIAS
-- ====================================================================
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup = 0
ORDER BY tablename;

-- ====================================================================
-- 10. RESUMO DO SCHEMA
-- ====================================================================
SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Views' as object_type,
  COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Functions' as object_type,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
  'Triggers' as object_type,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema = 'public';
