-- Migration: Índices de Performance
-- Data: 2026-02-04
-- Prioridade: IMPORTANTE
-- Descrição: Adiciona índices compostos para melhorar performance de queries comuns
--
-- ANÁLISE: Estas queries são executadas frequentemente e se beneficiam de índices compostos:
-- - Dashboard: casos por org + status + prioridade
-- - Listagem de leads com ordenação por data
-- - Kanban de tarefas
-- - Agenda por responsável
-- - Busca full-text em títulos

BEGIN;

-- =====================================================
-- 1. ÍNDICES COMPOSTOS PARA QUERIES DE DASHBOARD
-- =====================================================

-- Casos: filtro por org, status e prioridade (muito usado no dashboard)
CREATE INDEX IF NOT EXISTS idx_casos_org_status_priority 
  ON casos(org_id, status, prioridade) 
  WHERE status NOT IN ('arquivado', 'encerrado');

COMMENT ON INDEX idx_casos_org_status_priority IS
  'Otimiza queries de dashboard que filtram casos por status e prioridade';

-- Casos: filtro por responsável (para "Meus Casos")
CREATE INDEX IF NOT EXISTS idx_casos_org_responsavel 
  ON casos(org_id, responsavel_user_id, status)
  WHERE responsavel_user_id IS NOT NULL;

COMMENT ON INDEX idx_casos_org_responsavel IS
  'Otimiza queries de "Meus Casos" por responsável';

-- =====================================================
-- 2. ÍNDICES PARA LISTAGENS COM ORDENAÇÃO
-- =====================================================

-- Leads: listagem ordenada por data de criação
CREATE INDEX IF NOT EXISTS idx_leads_org_status_created 
  ON leads(org_id, status, created_at DESC);

COMMENT ON INDEX idx_leads_org_status_created IS
  'Otimiza listagem de leads com filtro de status e ordenação por data';

-- Clientes: listagem alfabética com filtro de status
CREATE INDEX IF NOT EXISTS idx_clientes_org_status_nome 
  ON clientes(org_id, status, nome);

COMMENT ON INDEX idx_clientes_org_status_nome IS
  'Otimiza listagem de clientes ordenada alfabeticamente';

-- =====================================================
-- 3. ÍNDICES PARA TAREFAS (KANBAN)
-- =====================================================

-- Tarefas: kanban por status e due date
CREATE INDEX IF NOT EXISTS idx_tarefas_org_status_due 
  ON tarefas(org_id, status, due_at) 
  WHERE status NOT IN ('concluida', 'cancelada');

COMMENT ON INDEX idx_tarefas_org_status_due IS
  'Otimiza visualização do kanban de tarefas';

-- Tarefas: por responsável (para "Minhas Tarefas")
CREATE INDEX IF NOT EXISTS idx_tarefas_org_assigned_status 
  ON tarefas(org_id, assigned_user_id, status)
  WHERE assigned_user_id IS NOT NULL;

COMMENT ON INDEX idx_tarefas_org_assigned_status IS
  'Otimiza queries de "Minhas Tarefas"';

-- =====================================================
-- 4. ÍNDICES PARA AGENDA
-- =====================================================

-- Agendamentos: por data (calendário)
-- Verifica qual coluna de data existe antes de criar o índice
DO $$
DECLARE
  v_date_column TEXT;
BEGIN
  -- Tenta encontrar a coluna de data na tabela agendamentos
  SELECT column_name INTO v_date_column
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'agendamentos'
    AND column_name IN ('data_inicio', 'start_at', 'data', 'scheduled_at', 'datetime', 'data_hora')
  LIMIT 1;
  
  IF v_date_column IS NOT NULL THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_agendamentos_org_date ON agendamentos(org_id, %I, status)',
      v_date_column
    );
    RAISE NOTICE 'Índice criado em agendamentos usando coluna: %', v_date_column;
  ELSE
    RAISE NOTICE 'Tabela agendamentos: coluna de data não encontrada. Pulando índice.';
  END IF;
END $$;

-- =====================================================
-- 5. ÍNDICES PARA DOCUMENTOS
-- =====================================================

-- Documentos: por caso
CREATE INDEX IF NOT EXISTS idx_documentos_caso_status 
  ON documentos(caso_id, status, created_at DESC)
  WHERE caso_id IS NOT NULL;

COMMENT ON INDEX idx_documentos_caso_status IS
  'Otimiza listagem de documentos por caso';

-- Documentos: por organização
CREATE INDEX IF NOT EXISTS idx_documentos_org_created 
  ON documentos(org_id, created_at DESC);

COMMENT ON INDEX idx_documentos_org_created IS
  'Otimiza listagem geral de documentos';

-- =====================================================
-- 6. ÍNDICES FULL-TEXT SEARCH
-- =====================================================

-- Full-text em títulos de casos (busca)
CREATE INDEX IF NOT EXISTS idx_casos_titulo_fts 
  ON casos USING GIN (to_tsvector('portuguese', coalesce(titulo, '')));

COMMENT ON INDEX idx_casos_titulo_fts IS
  'Full-text search em títulos de casos (português)';

-- Full-text em nomes de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nome_fts 
  ON clientes USING GIN (to_tsvector('portuguese', coalesce(nome, '')));

COMMENT ON INDEX idx_clientes_nome_fts IS
  'Full-text search em nomes de clientes (português)';

-- Full-text em leads
CREATE INDEX IF NOT EXISTS idx_leads_nome_fts 
  ON leads USING GIN (to_tsvector('portuguese', coalesce(nome, '')));

COMMENT ON INDEX idx_leads_nome_fts IS
  'Full-text search em nomes de leads (português)';

-- =====================================================
-- 7. ÍNDICES PARA AUDITORIA (queries de análise)
-- =====================================================

-- Audit log: por data e ação (relatórios)
CREATE INDEX IF NOT EXISTS idx_audit_log_date_action 
  ON audit_log(changed_at DESC, action);

COMMENT ON INDEX idx_audit_log_date_action IS
  'Otimiza relatórios de auditoria por data';

-- Analytics: por evento e data
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    CREATE INDEX IF NOT EXISTS idx_analytics_event_date 
      ON analytics_events(event_name, created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 8. ANÁLISE DE ÍNDICES (COMENTÁRIO)
-- =====================================================

/*
ÍNDICES CRIADOS NESTA MIGRATION:

| Tabela      | Índice                          | Tipo      | Uso Principal              |
|-------------|--------------------------------|-----------|----------------------------|
| casos       | idx_casos_org_status_priority  | B-tree    | Dashboard, filtros         |
| casos       | idx_casos_org_responsavel      | B-tree    | Meus Casos                 |
| casos       | idx_casos_titulo_fts           | GIN       | Busca full-text            |
| leads       | idx_leads_org_status_created   | B-tree    | Listagem com ordenação     |
| leads       | idx_leads_nome_fts             | GIN       | Busca full-text            |
| clientes    | idx_clientes_org_status_nome   | B-tree    | Listagem alfabética        |
| clientes    | idx_clientes_nome_fts          | GIN       | Busca full-text            |
| tarefas     | idx_tarefas_org_status_due     | B-tree    | Kanban                     |
| tarefas     | idx_tarefas_org_assigned_status| B-tree    | Minhas Tarefas             |
| agendamentos| idx_agendamentos_org_date      | B-tree    | Calendário                 |
| documentos  | idx_documentos_caso_status     | B-tree    | Docs por caso              |
| documentos  | idx_documentos_org_created     | B-tree    | Listagem geral             |
| audit_log   | idx_audit_log_date_action      | B-tree    | Relatórios de auditoria    |

IMPACTO ESPERADO:
- Queries de dashboard: 50-80% mais rápidas
- Listagens com filtros: 40-60% mais rápidas
- Buscas full-text: Agora possíveis e rápidas
*/

COMMIT;

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260204_add_performance_indexes executada com sucesso!';
  RAISE NOTICE 'Índices de performance criados para otimizar queries comuns';
END $$;
