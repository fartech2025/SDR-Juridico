-- ====================================================================
-- Migration: Cleanup Unused Tables
-- Description: Remove tabelas que não são usadas pelo projeto
-- Date: 2025-11-04
-- ====================================================================

-- Lista de tabelas usadas no projeto:
-- ✅ public.questoes - Questões do ENEM
-- ✅ public.questoes_imagens - Imagens das questões
-- ✅ public.simulados - Simulados criados
-- ✅ public.simulado_questoes - Questões dos simulados
-- ✅ public.resultados_simulados - Resultados dos simulados
-- ✅ public.resultados_por_tema - Análise por tema
-- ✅ public.resultados_por_dificuldade - Análise por dificuldade
-- ✅ public.resultados_por_hora - Análise por hora do dia
-- ✅ public.usuarios - Usuários do sistema

-- ====================================================================
-- VERIFICAR TABELAS EXISTENTES
-- ====================================================================
-- Execute este SELECT para ver todas as tabelas no schema public:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- ====================================================================
-- REMOVER TABELAS NÃO UTILIZADAS
-- ====================================================================

-- Drop table messages se existir (não é usada no projeto)
DROP TABLE IF EXISTS public.messages CASCADE;

-- Drop table objects se existir (não é usada no projeto)
DROP TABLE IF EXISTS public.objects CASCADE;

-- Adicione aqui outras tabelas não utilizadas que você identificar
-- DROP TABLE IF EXISTS public.nome_da_tabela CASCADE;

-- ====================================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ====================================================================

-- Comentário com query para verificar tabelas restantes
-- SELECT 
--   table_name,
--   pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;

-- ====================================================================
-- NOTAS
-- ====================================================================
-- 1. O CASCADE remove automaticamente dependências (views, constraints, etc)
-- 2. IF EXISTS evita erros se a tabela já foi removida
-- 3. Execute esta migration apenas após confirmar que as tabelas não são necessárias
-- 4. Faça backup antes de executar em produção
