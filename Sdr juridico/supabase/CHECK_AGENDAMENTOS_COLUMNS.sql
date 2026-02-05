-- Script para verificar estrutura da tabela agendamentos
-- Execute este script no Supabase SQL Editor para ver as colunas reais

-- 1. Verificar se a tabela existe e suas colunas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 2. Verificar colunas relacionadas a data em todas as tabelas
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND (
    column_name ILIKE '%data%' 
    OR column_name ILIKE '%date%'
    OR column_name ILIKE '%time%'
    OR column_name ILIKE '%at%'
  )
  AND table_name IN ('agendamentos', 'agenda')
ORDER BY table_name, ordinal_position;

-- 3. Listar TODAS as tabelas do schema public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
