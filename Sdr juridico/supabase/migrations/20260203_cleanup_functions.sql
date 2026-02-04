-- Cleanup Functions for Automated Data Maintenance
-- Date: 2026-02-03
-- Purpose: Criar funções para limpeza automática de dados antigos (sessões, telemetria, etc.)

BEGIN;

-- ================================================================================
-- FUNÇÃO: Limpar Sessões Expiradas
-- ================================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(deleted_count INTEGER, execution_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := NOW();

  -- Deletar sessões expiradas há mais de 7 dias
  -- (manter 7 dias para eventual auditoria/debug)
  DELETE FROM auth.sessions
  WHERE expires_at < (NOW() - INTERVAL '7 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Sessões expiradas removidas: % em %', v_deleted_count, NOW();

  RETURN QUERY SELECT v_deleted_count, v_start_time;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_sessions IS
  'Remove sessões expiradas há mais de 7 dias do auth.sessions.

   USO: SELECT * FROM cleanup_expired_sessions();

   AGENDAMENTO RECOMENDADO: Executar diariamente às 2h AM via cron ou edge function
   Exemplo cron: 0 2 * * * (todo dia às 2h)';

-- ================================================================================
-- FUNÇÃO: Limpar Telemetria Antiga
-- ================================================================================

CREATE OR REPLACE FUNCTION cleanup_old_telemetry()
RETURNS TABLE(
  analytics_deleted INTEGER,
  api_calls_deleted INTEGER,
  execution_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analytics_count INTEGER;
  v_api_calls_count INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := NOW();

  -- Analytics events: manter últimos 90 dias
  DELETE FROM analytics_events
  WHERE created_at < (NOW() - INTERVAL '90 days');
  GET DIAGNOSTICS v_analytics_count = ROW_COUNT;

  -- DataJud API calls: manter últimos 30 dias
  -- (dados de auditoria de chamadas à API DataJud)
  DELETE FROM datajud_api_calls
  WHERE created_at < (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS v_api_calls_count = ROW_COUNT;

  RAISE NOTICE 'Telemetry cleanup executado:';
  RAISE NOTICE '  - Analytics events removidos: %', v_analytics_count;
  RAISE NOTICE '  - DataJud API calls removidos: %', v_api_calls_count;
  RAISE NOTICE '  - Tempo de execução: %', NOW();

  RETURN QUERY SELECT v_analytics_count, v_api_calls_count, v_start_time;
END;
$$;

COMMENT ON FUNCTION cleanup_old_telemetry IS
  'Remove dados de telemetria antigos:
   - analytics_events: mantém últimos 90 dias
   - datajud_api_calls: mantém últimos 30 dias

   USO: SELECT * FROM cleanup_old_telemetry();

   AGENDAMENTO RECOMENDADO: Executar semanalmente aos domingos às 3h AM
   Exemplo cron: 0 3 * * 0 (todo domingo às 3h)';

-- ================================================================================
-- FUNÇÃO: Limpar Notificações Antigas Lidas
-- ================================================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TABLE(deleted_count INTEGER, execution_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := NOW();

  -- Deletar notificações LIDAS com mais de 30 dias
  -- (manter notificações não lidas indefinidamente)
  DELETE FROM notificacoes
  WHERE lida = true
    AND created_at < (NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Notificações antigas (lidas) removidas: % em %', v_deleted_count, NOW();

  RETURN QUERY SELECT v_deleted_count, v_start_time;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS
  'Remove notificações LIDAS com mais de 30 dias.
   Notificações NÃO LIDAS são mantidas indefinidamente.

   USO: SELECT * FROM cleanup_old_notifications();

   AGENDAMENTO RECOMENDADO: Executar semanalmente
   Exemplo cron: 0 4 * * 0 (todo domingo às 4h)';

-- ================================================================================
-- FUNÇÃO: Limpar Jobs de Sincronização DataJud Antigos
-- ================================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sync_jobs()
RETURNS TABLE(deleted_count INTEGER, execution_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := NOW();

  -- Deletar jobs CONCLUÍDOS (sucesso ou erro) com mais de 60 dias
  -- Manter jobs PENDENTES indefinidamente (podem estar aguardando retry)
  DELETE FROM datajud_sync_jobs
  WHERE status IN ('sucesso', 'erro')
    AND completed_at < (NOW() - INTERVAL '60 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Jobs de sincronização antigos removidos: % em %', v_deleted_count, NOW();

  RETURN QUERY SELECT v_deleted_count, v_start_time;
END;
$$;

COMMENT ON FUNCTION cleanup_old_sync_jobs IS
  'Remove jobs de sincronização DataJud concluídos (sucesso ou erro) com mais de 60 dias.
   Jobs PENDENTES são mantidos indefinidamente.

   USO: SELECT * FROM cleanup_old_sync_jobs();

   AGENDAMENTO RECOMENDADO: Executar mensalmente
   Exemplo cron: 0 5 1 * * (dia 1 de cada mês às 5h)';

-- ================================================================================
-- FUNÇÃO AGREGADORA: Executar Todas as Limpezas
-- ================================================================================

CREATE OR REPLACE FUNCTION run_all_cleanups()
RETURNS TABLE(
  cleanup_name TEXT,
  records_deleted INTEGER,
  execution_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := NOW();

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Iniciando limpeza automática completa...';
  RAISE NOTICE '========================================';

  -- 1. Sessões expiradas
  RETURN QUERY
  SELECT
    'expired_sessions'::TEXT,
    r.deleted_count,
    r.execution_time
  FROM cleanup_expired_sessions() r;

  -- 2. Telemetria antiga
  RETURN QUERY
  SELECT
    'analytics_events'::TEXT,
    r.analytics_deleted,
    r.execution_time
  FROM cleanup_old_telemetry() r;

  RETURN QUERY
  SELECT
    'api_calls'::TEXT,
    r.api_calls_deleted,
    r.execution_time
  FROM cleanup_old_telemetry() r;

  -- 3. Notificações antigas
  RETURN QUERY
  SELECT
    'old_notifications'::TEXT,
    r.deleted_count,
    r.execution_time
  FROM cleanup_old_notifications() r;

  -- 4. Jobs de sincronização antigos
  RETURN QUERY
  SELECT
    'old_sync_jobs'::TEXT,
    r.deleted_count,
    r.execution_time
  FROM cleanup_old_sync_jobs() r;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Limpeza automática completa finalizada!';
  RAISE NOTICE '========================================';
END;
$$;

COMMENT ON FUNCTION run_all_cleanups IS
  'Executa TODAS as funções de limpeza em sequência e retorna um resumo.

   USO: SELECT * FROM run_all_cleanups();

   AGENDAMENTO RECOMENDADO: Executar semanalmente aos domingos às 2h AM
   Exemplo cron: 0 2 * * 0 (todo domingo às 2h)

   Esta é a função recomendada para agendar via cron externo ou edge function.';

-- ================================================================================
-- FUNÇÃO HELPER: Ver Tamanho das Tabelas Antes da Limpeza
-- ================================================================================

CREATE OR REPLACE FUNCTION show_cleanup_targets()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  old_records_to_cleanup BIGINT,
  retention_policy TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'analytics_events'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days')::BIGINT,
    '90 days'::TEXT
  FROM analytics_events

  UNION ALL

  SELECT
    'datajud_api_calls'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days')::BIGINT,
    '30 days'::TEXT
  FROM datajud_api_calls

  UNION ALL

  SELECT
    'notificacoes (lidas)'::TEXT,
    COUNT(*) FILTER (WHERE lida = true)::BIGINT,
    COUNT(*) FILTER (WHERE lida = true AND created_at < NOW() - INTERVAL '30 days')::BIGINT,
    '30 days (lidas)'::TEXT
  FROM notificacoes

  UNION ALL

  SELECT
    'datajud_sync_jobs'::TEXT,
    COUNT(*) FILTER (WHERE status IN ('sucesso', 'erro'))::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('sucesso', 'erro') AND completed_at < NOW() - INTERVAL '60 days')::BIGINT,
    '60 days (concluídos)'::TEXT
  FROM datajud_sync_jobs;
END;
$$;

COMMENT ON FUNCTION show_cleanup_targets IS
  'Mostra quantos registros seriam removidos se as funções de limpeza fossem executadas agora.
   Útil para estimar o impacto antes de executar a limpeza.

   USO: SELECT * FROM show_cleanup_targets();';

COMMIT;

-- ================================================================================
-- INSTRUÇÕES DE CONFIGURAÇÃO DE CRON
-- ================================================================================

DO $cleanup_instructions$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'FUNÇÕES DE LIMPEZA CRIADAS COM SUCESSO!';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Para agendar execução automática, configure um cron job:';
  RAISE NOTICE '';
  RAISE NOTICE '1. OPÇÃO: pg_cron (se disponível no Supabase)';
  RAISE NOTICE '   SELECT cron.schedule(''cleanup-all'', ''0 2 * * 0'', ''SELECT run_all_cleanups()'');';
  RAISE NOTICE '';
  RAISE NOTICE '2. OPÇÃO: Edge Function agendada (Supabase Functions)';
  RAISE NOTICE '   Criar edge function que chama: supabase.rpc(''run_all_cleanups'')';
  RAISE NOTICE '   Agendar via Supabase Dashboard > Database > Cron Jobs';
  RAISE NOTICE '';
  RAISE NOTICE '3. OPÇÃO: Cron externo (servidor/CI)';
  RAISE NOTICE '   curl -X POST https://your-project.supabase.co/rest/v1/rpc/run_all_cleanups';
  RAISE NOTICE '';
  RAISE NOTICE 'Para testar antes de agendar:';
  RAISE NOTICE '   SELECT * FROM show_cleanup_targets();  -- Ver o que seria removido';
  RAISE NOTICE '   SELECT * FROM run_all_cleanups();      -- Executar limpeza';
  RAISE NOTICE '=================================================================';
END $cleanup_instructions$;

-- Log na tabela de migração
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20260203_cleanup_functions',
  'success',
  'Criadas 6 funções para limpeza automática: sessões, telemetria, notificações, jobs. Use run_all_cleanups() para executar todas.'
)
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'success';
