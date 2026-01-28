-- =====================================================
-- MELHORIAS RECOMENDADAS PARA O BANCO DE DADOS
-- SDR Jurídico - Análise de Engenharia
-- Data: 28 de janeiro de 2026
-- =====================================================

-- =====================================================
-- 1. ÍNDICES COMPOSTOS PARA PERFORMANCE
-- =====================================================

-- Casos: queries comuns filtradas por org + status + prioridade
CREATE INDEX IF NOT EXISTS idx_casos_org_status_priority 
  ON casos(org_id, status, prioridade) WHERE org_id IS NOT NULL;

-- Casos: listagem ordenada por data
CREATE INDEX IF NOT EXISTS idx_casos_org_created 
  ON casos(org_id, created_at DESC) WHERE org_id IS NOT NULL;

-- Leads: pipeline ordenado
CREATE INDEX IF NOT EXISTS idx_leads_org_status_created 
  ON leads(org_id, status, created_at DESC) WHERE org_id IS NOT NULL;

-- Agenda: queries por responsável e data
CREATE INDEX IF NOT EXISTS idx_agenda_org_responsavel_data 
  ON agenda(org_id, responsavel, data_inicio) WHERE org_id IS NOT NULL;

-- Documentos: busca por caso e tipo
CREATE INDEX IF NOT EXISTS idx_documentos_org_caso_tipo 
  ON documentos(org_id, caso_id, tipo) WHERE org_id IS NOT NULL;

-- Tarefas: kanban view
CREATE INDEX IF NOT EXISTS idx_tarefas_org_assigned_status 
  ON tarefas(org_id, assigned_user_id, status) WHERE org_id IS NOT NULL;

-- Timeline: ordem cronológica reversa
CREATE INDEX IF NOT EXISTS idx_timeline_org_caso_data 
  ON timeline_events(org_id, caso_id, data_evento DESC) WHERE org_id IS NOT NULL;

-- Audit logs: investigação de ações
CREATE INDEX IF NOT EXISTS idx_audit_org_user_action 
  ON audit_logs(org_id, user_id, action, created_at DESC) WHERE org_id IS NOT NULL;

-- =====================================================
-- 2. FULL-TEXT SEARCH (Busca Textual)
-- =====================================================

-- Adicionar colunas de busca textual
ALTER TABLE casos ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Função para atualizar search_vector
CREATE OR REPLACE FUNCTION update_casos_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.descricao, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.area, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_clientes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.cnpj, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.cpf, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para manter search_vector atualizado
DROP TRIGGER IF EXISTS casos_search_vector_update ON casos;
CREATE TRIGGER casos_search_vector_update
  BEFORE INSERT OR UPDATE ON casos
  FOR EACH ROW EXECUTE FUNCTION update_casos_search_vector();

DROP TRIGGER IF EXISTS clientes_search_vector_update ON clientes;
CREATE TRIGGER clientes_search_vector_update
  BEFORE INSERT OR UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_clientes_search_vector();

-- Índices GIN para busca rápida
CREATE INDEX IF NOT EXISTS idx_casos_search 
  ON casos USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_clientes_search 
  ON clientes USING GIN(search_vector);

-- =====================================================
-- 3. SOFT DELETE PATTERN
-- =====================================================

-- Adicionar coluna deleted_at em tabelas principais
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Índices para soft delete
CREATE INDEX IF NOT EXISTS idx_clientes_deleted 
  ON clientes(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_casos_deleted 
  ON casos(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_deleted 
  ON leads(deleted_at) WHERE deleted_at IS NULL;

-- Views para dados ativos (mais conveniente)
CREATE OR REPLACE VIEW clientes_ativos AS 
  SELECT * FROM clientes WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW casos_ativos AS 
  SELECT * FROM casos WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW leads_ativos AS 
  SELECT * FROM leads WHERE deleted_at IS NULL;

-- Função para soft delete
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clientes SET deleted_at = NOW() WHERE id = OLD.id;
  RETURN NULL; -- Cancela o DELETE físico
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. VERSIONAMENTO DE DOCUMENTOS
-- =====================================================

-- Adicionar campos de versionamento
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES documentos(id);
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Índice para buscar versões
CREATE INDEX IF NOT EXISTS idx_documentos_parent_version 
  ON documentos(parent_id, version DESC) WHERE parent_id IS NOT NULL;

-- Função para criar nova versão
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  -- Se está atualizando documento com parent_id NULL (original)
  IF NEW.parent_id IS NULL AND OLD.id IS NOT NULL THEN
    -- Buscar maior versão
    SELECT COALESCE(MAX(version), 0) INTO max_version
    FROM documentos
    WHERE parent_id = OLD.id OR id = OLD.id;
    
    -- Marcar versões anteriores como não-latest
    UPDATE documentos 
    SET is_latest = false 
    WHERE (id = OLD.id OR parent_id = OLD.id) AND id != NEW.id;
    
    -- Criar nova versão
    NEW.parent_id := OLD.id;
    NEW.version := max_version + 1;
    NEW.is_latest := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. SISTEMA DE QUOTAS E LIMITES
-- =====================================================

-- Tabela para rastrear uso de recursos
CREATE TABLE IF NOT EXISTS org_quotas_usage (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Contadores
  cases_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  clients_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  
  -- Storage
  storage_used_bytes BIGINT DEFAULT 0,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_reset TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_quotas_updated 
  ON org_quotas_usage(last_updated DESC);

-- Função para atualizar contadores
CREATE OR REPLACE FUNCTION update_org_quota_counters()
RETURNS TRIGGER AS $$
DECLARE
  target_org_id UUID;
BEGIN
  -- Determinar org_id
  IF TG_OP = 'DELETE' THEN
    target_org_id := OLD.org_id;
  ELSE
    target_org_id := NEW.org_id;
  END IF;
  
  -- Atualizar contadores para a organização
  INSERT INTO org_quotas_usage (org_id, cases_count, users_count, leads_count, clients_count, documents_count)
  SELECT 
    target_org_id,
    (SELECT COUNT(*) FROM casos WHERE org_id = target_org_id AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM org_members WHERE org_id = target_org_id AND ativo = true),
    (SELECT COUNT(*) FROM leads WHERE org_id = target_org_id AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM clientes WHERE org_id = target_org_id AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM documentos WHERE org_id = target_org_id AND deleted_at IS NULL)
  ON CONFLICT (org_id) DO UPDATE SET
    cases_count = EXCLUDED.cases_count,
    users_count = EXCLUDED.users_count,
    leads_count = EXCLUDED.leads_count,
    clients_count = EXCLUDED.clients_count,
    documents_count = EXCLUDED.documents_count,
    last_updated = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para manter contadores atualizados
CREATE TRIGGER update_quota_on_caso_change
  AFTER INSERT OR UPDATE OR DELETE ON casos
  FOR EACH ROW EXECUTE FUNCTION update_org_quota_counters();

CREATE TRIGGER update_quota_on_lead_change
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_org_quota_counters();

-- Função para validar limites antes de inserir
CREATE OR REPLACE FUNCTION check_org_limits()
RETURNS TRIGGER AS $$
DECLARE
  org_plan VARCHAR;
  max_allowed INTEGER;
  current_count INTEGER;
BEGIN
  -- Buscar plano da organização
  SELECT plan INTO org_plan FROM orgs WHERE id = NEW.org_id;
  
  -- Definir limites por plano (exemplo)
  CASE TG_TABLE_NAME
    WHEN 'casos' THEN
      CASE org_plan
        WHEN 'trial' THEN max_allowed := 10;
        WHEN 'basic' THEN max_allowed := 50;
        WHEN 'professional' THEN max_allowed := 200;
        WHEN 'enterprise' THEN max_allowed := NULL; -- Ilimitado
      END CASE;
      SELECT cases_count INTO current_count FROM org_quotas_usage WHERE org_id = NEW.org_id;
    
    WHEN 'leads' THEN
      CASE org_plan
        WHEN 'trial' THEN max_allowed := 20;
        WHEN 'basic' THEN max_allowed := 100;
        WHEN 'professional' THEN max_allowed := 500;
        WHEN 'enterprise' THEN max_allowed := NULL;
      END CASE;
      SELECT leads_count INTO current_count FROM org_quotas_usage WHERE org_id = NEW.org_id;
  END CASE;
  
  -- Validar limite
  IF max_allowed IS NOT NULL AND current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de % atingido para o plano %. Atual: %, Máximo: %', 
      TG_TABLE_NAME, org_plan, current_count, max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CAMPOS CALCULADOS E CACHE
-- =====================================================

-- Adicionar campos desnormalizados para performance
ALTER TABLE casos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS lead_nome TEXT;
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS caso_titulo TEXT;

-- Função para sincronizar nomes de clientes
CREATE OR REPLACE FUNCTION sync_cliente_nome()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar casos relacionados
  UPDATE casos 
  SET cliente_nome = NEW.nome 
  WHERE cliente_id = NEW.id;
  
  -- Atualizar agenda relacionada
  UPDATE agenda 
  SET cliente_nome = NEW.nome 
  WHERE cliente_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cliente_nome
  AFTER INSERT OR UPDATE OF nome ON clientes
  FOR EACH ROW EXECUTE FUNCTION sync_cliente_nome();

-- =====================================================
-- 7. NOTIFICAÇÕES EM TEMPO REAL (Supabase Realtime)
-- =====================================================

-- Tabela para gerenciar subscrições de notificações
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Canal de subscrição
  channel TEXT NOT NULL, -- 'casos', 'agenda', 'notificacoes', etc.
  entity_id UUID, -- ID específico da entidade (opcional)
  
  -- Configurações
  enabled BOOLEAN DEFAULT true,
  subscription_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, org_id, channel, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_org 
  ON notification_subscriptions(user_id, org_id, enabled);

-- Habilitar Realtime nas tabelas relevantes
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE casos;
ALTER PUBLICATION supabase_realtime ADD TABLE agenda;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_events;

-- =====================================================
-- 8. CAMPOS FALTANTES IDENTIFICADOS
-- =====================================================

-- Clientes: adicionar campo health conforme schema
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'health'
  ) THEN
    ALTER TABLE clientes ADD COLUMN health VARCHAR(20) DEFAULT 'ok'
      CHECK (health IN ('ok', 'atencao', 'critico'));
    
    CREATE INDEX idx_clientes_health ON clientes(health) WHERE health != 'ok';
  END IF;
END $$;

-- Leads: adicionar campo heat conforme schema original
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'heat'
  ) THEN
    ALTER TABLE leads ADD COLUMN heat VARCHAR(20) DEFAULT 'frio'
      CHECK (heat IN ('quente', 'morno', 'frio'));
    
    CREATE INDEX idx_leads_heat ON leads(heat);
  END IF;
END $$;

-- Casos: adicionar campo sla_risk conforme schema
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'casos' AND column_name = 'sla_risk'
  ) THEN
    ALTER TABLE casos ADD COLUMN sla_risk VARCHAR(20) DEFAULT 'ok'
      CHECK (sla_risk IN ('ok', 'atencao', 'critico'));
    
    CREATE INDEX idx_casos_sla_risk ON casos(sla_risk) WHERE sla_risk != 'ok';
  END IF;
END $$;

-- =====================================================
-- 9. VIEWS MATERIALIZADAS PARA DASHBOARDS
-- =====================================================

-- Dashboard: Estatísticas gerais por organização
CREATE MATERIALIZED VIEW IF NOT EXISTS org_dashboard_stats AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  
  -- Contadores
  COUNT(DISTINCT c.id) FILTER (WHERE c.deleted_at IS NULL) as casos_ativos,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.deleted_at IS NULL) as clientes_ativos,
  COUNT(DISTINCT l.id) FILTER (WHERE l.deleted_at IS NULL AND l.status != 'ganho') as leads_ativos,
  COUNT(DISTINCT om.id) FILTER (WHERE om.ativo = true) as usuarios_ativos,
  
  -- Casos por status
  COUNT(*) FILTER (WHERE c.status = 'aberto' AND c.deleted_at IS NULL) as casos_abertos,
  COUNT(*) FILTER (WHERE c.status = 'em_andamento' AND c.deleted_at IS NULL) as casos_em_andamento,
  COUNT(*) FILTER (WHERE c.status = 'resolvido' AND c.deleted_at IS NULL) as casos_resolvidos,
  
  -- Leads por status
  COUNT(*) FILTER (WHERE l.status = 'novo' AND l.deleted_at IS NULL) as leads_novos,
  COUNT(*) FILTER (WHERE l.status = 'qualificado' AND l.deleted_at IS NULL) as leads_qualificados,
  
  -- Valor total
  SUM(c.valor) FILTER (WHERE c.deleted_at IS NULL) as valor_total_casos,
  
  -- Timestamps
  NOW() as last_updated
FROM orgs o
LEFT JOIN casos c ON c.org_id = o.id
LEFT JOIN clientes cl ON cl.org_id = o.id
LEFT JOIN leads l ON l.org_id = o.id
LEFT JOIN org_members om ON om.org_id = o.id
WHERE o.status = 'active'
GROUP BY o.id, o.name;

-- Índice para refresh rápido
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_dashboard_stats_org 
  ON org_dashboard_stats(org_id);

-- Função para refresh automático
CREATE OR REPLACE FUNCTION refresh_org_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_dashboard_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

-- Documentar propósito das tabelas principais
COMMENT ON TABLE orgs IS 'Organizações/Escritórios (multi-tenant). Cada org é isolada com RLS.';
COMMENT ON TABLE org_members IS 'Membros das organizações com seus roles. Um usuário pode pertencer a múltiplas orgs.';
COMMENT ON TABLE usuarios IS 'Perfis de usuários. Complementa auth.users do Supabase.';
COMMENT ON TABLE leads IS 'Leads/Prospects. Pipeline comercial antes de virarem clientes.';
COMMENT ON TABLE clientes IS 'Clientes ativos do escritório.';
COMMENT ON TABLE casos IS 'Casos jurídicos em andamento.';
COMMENT ON TABLE tarefas IS 'Sistema Kanban de tarefas com aprovação do gestor.';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria. Todas as ações importantes são registradas aqui.';
COMMENT ON TABLE org_features IS 'Feature flags por organização. Permite habilitar/desabilitar funcionalidades.';

-- =====================================================
-- RESUMO DE EXECUÇÃO
-- =====================================================

-- Para aplicar todas as melhorias, execute este arquivo completo.
-- Ou aplique seção por seção conforme necessidade.

-- Prioridades sugeridas:
-- 1. Índices compostos (melhoria imediata de performance)
-- 2. Soft delete (segurança e recuperação)
-- 3. Campos faltantes (consistência de schema)
-- 4. Full-text search (funcionalidade de busca)
-- 5. Sistema de quotas (controle de uso)
-- 6. Views materializadas (dashboards rápidos)
-- 7. Versionamento documentos (auditoria)
-- 8. Notificações tempo real (UX)
