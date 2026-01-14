-- Migration: Add org_id to all main tables
-- Date: 2026-01-13
-- Description: Adds org_id column and RLS policies to all main tables

-- ============================================
-- TABLE: leads - Add org_id
-- ============================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users access their org leads"
  ON leads FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: clientes - Add org_id
-- ============================================

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clientes_org_id ON clientes(org_id);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their org clients"
  ON clientes FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all clients"
  ON clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: casos - Add org_id
-- ============================================

ALTER TABLE casos
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_casos_org_id ON casos(org_id);

ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their org cases"
  ON casos FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all cases"
  ON casos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: documentos - Add org_id
-- ============================================

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documentos_org_id ON documentos(org_id);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their org documents"
  ON documentos FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all documents"
  ON documentos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: agenda_eventos - Add org_id
-- ============================================

ALTER TABLE agenda_eventos
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_agenda_eventos_org_id ON agenda_eventos(org_id);

ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their org agenda"
  ON agenda_eventos FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all agenda"
  ON agenda_eventos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: integrations - Add org_id
-- ============================================

ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(org_id);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their org integrations"
  ON integrations FOR ALL
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Fartech admins access all integrations"
  ON integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_fartech_admin = TRUE
    )
  );

-- ============================================
-- TABLE: tags - Add org_id (if exists)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
    ALTER TABLE tags
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_tags_org_id ON tags(org_id);
    
    ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "Users access their org tags"
      ON tags FOR ALL
      USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Fartech admins access all tags"
      ON tags FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND is_fartech_admin = TRUE
        )
      )';
  END IF;
END $$;

-- ============================================
-- TABLE: comentarios - Add org_id (if exists)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comentarios') THEN
    ALTER TABLE comentarios
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_comentarios_org_id ON comentarios(org_id);
    
    ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "Users access their org comments"
      ON comentarios FOR ALL
      USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Fartech admins access all comments"
      ON comentarios FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND is_fartech_admin = TRUE
        )
      )';
  END IF;
END $$;

-- ============================================
-- TABLE: historico_alteracoes - Add org_id (if exists)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_alteracoes') THEN
    ALTER TABLE historico_alteracoes
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_historico_alteracoes_org_id ON historico_alteracoes(org_id);
    
    ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "Users access their org history"
      ON historico_alteracoes FOR ALL
      USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Fartech admins access all history"
      ON historico_alteracoes FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND is_fartech_admin = TRUE
        )
      )';
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN leads.org_id IS 'Organization this lead belongs to';
COMMENT ON COLUMN clientes.org_id IS 'Organization this client belongs to';
COMMENT ON COLUMN casos.org_id IS 'Organization this case belongs to';
COMMENT ON COLUMN documentos.org_id IS 'Organization this document belongs to';
COMMENT ON COLUMN agenda_eventos.org_id IS 'Organization this event belongs to';
COMMENT ON COLUMN integrations.org_id IS 'Organization this integration belongs to';
