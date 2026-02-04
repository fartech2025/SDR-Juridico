-- Add Missing Indexes for Performance
-- Date: 2026-02-03
-- Purpose: Adicionar índices faltantes para melhorar performance de queries comuns

BEGIN;

-- ================================================================================
-- USUARIOS TABLE
-- ================================================================================

-- Índice GIN para busca em arrays de permissões (se não existir)
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes_gin
  ON usuarios USING GIN(permissoes);

-- Nota: usuarios não tem coluna 'status', removido índice

-- ================================================================================
-- ORG_MEMBERS TABLE
-- ================================================================================

-- Índice composto para queries de membership (user_id, org_id, ativo)
CREATE INDEX IF NOT EXISTS idx_org_members_user_org_ativo
  ON org_members(user_id, org_id, ativo);

-- Índice para filtrar membros ativos por role
CREATE INDEX IF NOT EXISTS idx_org_members_role_ativo
  ON org_members(role, ativo) WHERE ativo = true;

-- Índice composto para contagem de membros por org
CREATE INDEX IF NOT EXISTS idx_org_members_org_ativo
  ON org_members(org_id, ativo);

-- ================================================================================
-- CASOS TABLE
-- ================================================================================

-- Índice composto para queries por org e status (sem filtro - status é ENUM case_status)
CREATE INDEX IF NOT EXISTS idx_casos_org_status
  ON casos(org_id, status);

-- Índice para ordenação por data de criação (DESC para queries mais recentes)
CREATE INDEX IF NOT EXISTS idx_casos_created_at
  ON casos(created_at DESC);

-- Índice para busca por número de processo (já existe UNIQUE mas adicionar index explícito)
CREATE INDEX IF NOT EXISTS idx_casos_numero_processo
  ON casos(numero_processo) WHERE numero_processo IS NOT NULL;

-- Índice para casos com integração DataJud
CREATE INDEX IF NOT EXISTS idx_casos_datajud_processo_id
  ON casos(datajud_processo_id) WHERE datajud_processo_id IS NOT NULL;

-- Índice composto para responsável por org
CREATE INDEX IF NOT EXISTS idx_casos_org_responsavel
  ON casos(org_id, responsavel_user_id);

-- ================================================================================
-- DOCUMENTOS TABLE
-- ================================================================================

-- Índice composto para queries de documentos por caso (ordenado por data)
CREATE INDEX IF NOT EXISTS idx_documentos_caso_created
  ON documentos(caso_id, created_at DESC);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_created
  ON documentos(cliente_id, created_at DESC) WHERE cliente_id IS NOT NULL;

-- Índice para filtrar por status (sem filtro específico - pode ser ENUM)
CREATE INDEX IF NOT EXISTS idx_documentos_status
  ON documentos(status);

-- Índice para busca por tipo
CREATE INDEX IF NOT EXISTS idx_documentos_tipo
  ON documentos(tipo) WHERE tipo IS NOT NULL;

-- ================================================================================
-- TIMELINE_EVENTS TABLE (se existir - pular se não existir)
-- ================================================================================

-- Verificar se a tabela existe antes de criar índices
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
    CREATE INDEX IF NOT EXISTS idx_timeline_caso_data
      ON timeline_events(caso_id, data_evento DESC);

    CREATE INDEX IF NOT EXISTS idx_timeline_categoria
      ON timeline_events(categoria, data_evento DESC);

    RAISE NOTICE 'Índices criados em timeline_events';
  ELSE
    RAISE NOTICE 'Tabela timeline_events não existe, pulando índices';
  END IF;
END $$;

-- ================================================================================
-- AGENDAMENTOS TABLE (pode ser 'agenda' ou 'agendamentos' dependendo da versão)
-- ================================================================================

-- Verificar qual tabela existe e criar índices apropriados
DO $$
BEGIN
  -- Tentar agendamentos primeiro
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agendamentos') THEN
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio
      ON agendamentos(start_at, org_id);

    CREATE INDEX IF NOT EXISTS idx_agendamentos_status_tipo
      ON agendamentos(status, tipo);

    CREATE INDEX IF NOT EXISTS idx_agendamentos_caso
      ON agendamentos(caso_id) WHERE caso_id IS NOT NULL;

    RAISE NOTICE 'Índices criados em agendamentos';

  -- Caso contrário, tentar agenda
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agenda') THEN
    CREATE INDEX IF NOT EXISTS idx_agenda_data_inicio
      ON agenda(data_inicio, org_id);

    CREATE INDEX IF NOT EXISTS idx_agenda_status_tipo
      ON agenda(status, tipo);

    CREATE INDEX IF NOT EXISTS idx_agenda_caso
      ON agenda(caso_id) WHERE caso_id IS NOT NULL;

    RAISE NOTICE 'Índices criados em agenda';
  ELSE
    RAISE NOTICE 'Tabela agendamentos/agenda não existe, pulando índices';
  END IF;
END $$;

-- ================================================================================
-- LEADS TABLE
-- ================================================================================

-- Índice composto para queries por org e status
CREATE INDEX IF NOT EXISTS idx_leads_org_status
  ON leads(org_id, status);

-- Índice para busca por responsável
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user
  ON leads(assigned_user_id) WHERE assigned_user_id IS NOT NULL;

-- Índice para ordenação por última interação
CREATE INDEX IF NOT EXISTS idx_leads_last_contact
  ON leads(last_contact_at DESC NULLS LAST);

-- ================================================================================
-- CLIENTES TABLE
-- ================================================================================

-- Índice composto para queries por org e status
CREATE INDEX IF NOT EXISTS idx_clientes_org_status
  ON clientes(org_id, status);

-- Índice para busca por responsável
CREATE INDEX IF NOT EXISTS idx_clientes_owner
  ON clientes(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- ================================================================================
-- TAREFAS TABLE
-- ================================================================================

-- Índice composto para queries por org e status
CREATE INDEX IF NOT EXISTS idx_tarefas_org_status
  ON tarefas(org_id, status);

-- Índice para tarefas atribuídas a um usuário
CREATE INDEX IF NOT EXISTS idx_tarefas_assigned_user
  ON tarefas(assigned_user_id, status) WHERE assigned_user_id IS NOT NULL;

-- Índice para tarefas por prazo (sem filtro de status - status é ENUM task_status)
CREATE INDEX IF NOT EXISTS idx_tarefas_due_at
  ON tarefas(due_at) WHERE due_at IS NOT NULL;

-- Índice composto para entidade
CREATE INDEX IF NOT EXISTS idx_tarefas_entidade
  ON tarefas(entidade, entidade_id) WHERE entidade IS NOT NULL;

-- ================================================================================
-- ANALYTICS_EVENTS TABLE (para cleanup futuro)
-- ================================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_org_user
  ON analytics_events(org_id, user_id, created_at DESC);

-- ================================================================================
-- DATAJUD TABLES
-- ================================================================================

-- DataJud Processos
CREATE INDEX IF NOT EXISTS idx_datajud_processos_org
  ON datajud_processos(org_id, cached_at DESC);

CREATE INDEX IF NOT EXISTS idx_datajud_processos_numero
  ON datajud_processos(numero_processo, tribunal);

-- DataJud Movimentações
CREATE INDEX IF NOT EXISTS idx_datajud_movimentacoes_processo
  ON datajud_movimentacoes(datajud_processo_id, data_hora DESC);

CREATE INDEX IF NOT EXISTS idx_datajud_movimentacoes_notified
  ON datajud_movimentacoes(notified, detected_at DESC)
  WHERE notified = false;

-- DataJud API Calls (para cleanup)
CREATE INDEX IF NOT EXISTS idx_datajud_api_calls_created
  ON datajud_api_calls(created_at DESC);

-- DataJud Sync Jobs
CREATE INDEX IF NOT EXISTS idx_datajud_sync_jobs_status
  ON datajud_sync_jobs(status, proximo_retry)
  WHERE status = 'pendente';

COMMIT;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Índices criados com sucesso. Execute ANALYZE para atualizar estatísticas.';
END $$;

-- Atualizar estatísticas do PostgreSQL
DO $$
BEGIN
  ANALYZE usuarios;
  ANALYZE org_members;
  ANALYZE casos;
  ANALYZE documentos;
  ANALYZE leads;
  ANALYZE clientes;
  ANALYZE tarefas;

  -- Analisar agendamentos/agenda se existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agendamentos') THEN
    ANALYZE agendamentos;
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agenda') THEN
    ANALYZE agenda;
  END IF;

  -- Analisar timeline_events se existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
    ANALYZE timeline_events;
  END IF;

  RAISE NOTICE 'Estatísticas atualizadas com sucesso';
END $$;

-- Log na tabela de migração
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20260203_add_missing_indexes',
  'success',
  'Adicionados ~40 índices para melhorar performance de queries comuns em todas as tabelas principais.'
)
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'success';
