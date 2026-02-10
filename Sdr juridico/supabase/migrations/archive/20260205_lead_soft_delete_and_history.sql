-- Migration: Soft Delete e Histórico de Status para Leads
-- Data: 2026-02-05
-- Descrição: Adiciona soft delete e histórico de mudanças de status para leads

BEGIN;

-- =====================================================
-- 1. ADICIONAR COLUNAS DE SOFT DELETE NA TABELA LEADS
-- =====================================================

-- Verifica se as colunas já existem antes de adicionar
DO $$ 
BEGIN
  -- Coluna deleted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Coluna deleted_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;
  END IF;
END $$;

-- Índice para performance em queries de soft delete
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at 
  ON public.leads(deleted_at) 
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.leads.deleted_at IS 
  'Timestamp de quando o lead foi soft deleted. NULL = ativo';

COMMENT ON COLUMN public.leads.deleted_by IS 
  'ID do usuário que deletou o lead';

-- =====================================================
-- 2. TABELA DE HISTÓRICO DE STATUS DE LEADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id),
  
  -- Status antes e depois
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  
  -- Temperatura (heat) antes e depois
  heat_anterior TEXT,
  heat_novo TEXT,
  
  -- Quem fez a mudança
  changed_by UUID REFERENCES auth.users(id),
  
  -- Contexto adicional
  motivo TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Comentários
COMMENT ON TABLE public.lead_status_history IS 
  'Histórico de todas as mudanças de status e temperatura dos leads';

COMMENT ON COLUMN public.lead_status_history.status_anterior IS 
  'Status do lead antes da mudança (NULL se for criação)';

COMMENT ON COLUMN public.lead_status_history.status_novo IS 
  'Status do lead após a mudança';

COMMENT ON COLUMN public.lead_status_history.heat_anterior IS 
  'Temperatura (quente/morno/frio) antes da mudança';

COMMENT ON COLUMN public.lead_status_history.heat_novo IS 
  'Temperatura (quente/morno/frio) após a mudança';

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead 
  ON public.lead_status_history(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_org 
  ON public.lead_status_history(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_user 
  ON public.lead_status_history(changed_by, created_at DESC);

-- =====================================================
-- 4. RLS - ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history FORCE ROW LEVEL SECURITY;

-- SELECT: Membros da org podem ver histórico
DROP POLICY IF EXISTS lead_status_history_select ON public.lead_status_history;
CREATE POLICY lead_status_history_select
ON public.lead_status_history
FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: Membros da org podem inserir
DROP POLICY IF EXISTS lead_status_history_insert ON public.lead_status_history;
CREATE POLICY lead_status_history_insert
ON public.lead_status_history
FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- =====================================================
-- 5. TRIGGER AUTOMÁTICO PARA CAPTURAR MUDANÇAS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Só registra se o status ou heat realmente mudou
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.status IS DISTINCT FROM NEW.status OR 
       OLD.heat IS DISTINCT FROM NEW.heat
     )) THEN
    
    INSERT INTO public.lead_status_history (
      lead_id,
      org_id,
      status_anterior,
      status_novo,
      heat_anterior,
      heat_novo,
      changed_by,
      metadata
    ) VALUES (
      NEW.id,
      NEW.org_id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status::TEXT END,
      NEW.status::TEXT,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.heat::TEXT END,
      NEW.heat::TEXT,
      COALESCE(auth.uid(), NEW.responsavel),
      jsonb_build_object(
        'operation', TG_OP,
        'timestamp', NOW(),
        'nome', NEW.nome
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove trigger se existir e recria
DROP TRIGGER IF EXISTS trg_lead_status_history ON public.leads;

CREATE TRIGGER trg_lead_status_history
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_lead_status_change();

COMMENT ON TRIGGER trg_lead_status_history ON public.leads IS 
  'Registra automaticamente todas as mudanças de status/heat no histórico';

-- =====================================================
-- 6. VIEW PARA TIMELINE DE LEADS
-- =====================================================

CREATE OR REPLACE VIEW v_lead_timeline AS
SELECT 
  h.id,
  h.created_at,
  h.lead_id,
  h.org_id,
  h.status_anterior,
  h.status_novo,
  h.heat_anterior,
  h.heat_novo,
  h.changed_by,
  h.motivo,
  h.metadata,
  l.nome AS lead_nome,
  u.email AS changed_by_email,
  u.raw_user_meta_data->>'name' AS changed_by_name
FROM public.lead_status_history h
LEFT JOIN public.leads l ON l.id = h.lead_id
LEFT JOIN auth.users u ON u.id = h.changed_by
ORDER BY h.created_at DESC;

COMMENT ON VIEW v_lead_timeline IS 
  'View que mostra o histórico de mudanças de status dos leads';

-- =====================================================
-- 7. FUNÇÃO PARA OBTER HISTÓRICO DE UM LEAD
-- =====================================================

CREATE OR REPLACE FUNCTION get_lead_history(p_lead_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  status_anterior TEXT,
  status_novo TEXT,
  heat_anterior TEXT,
  heat_novo TEXT,
  changed_by UUID,
  changed_by_name TEXT,
  motivo TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    h.id,
    h.created_at,
    h.status_anterior,
    h.status_novo,
    h.heat_anterior,
    h.heat_novo,
    h.changed_by,
    COALESCE(u.raw_user_meta_data->>'name', u.email)::TEXT AS changed_by_name,
    h.motivo
  FROM public.lead_status_history h
  LEFT JOIN auth.users u ON u.id = h.changed_by
  WHERE h.lead_id = p_lead_id
  ORDER BY h.created_at ASC;
$$;

COMMENT ON FUNCTION get_lead_history IS 
  'Retorna o histórico completo de um lead';

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  -- Verifica se as colunas de soft delete foram criadas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads'
    AND column_name = 'deleted_at'
  ) THEN
    RAISE NOTICE '✅ Coluna deleted_at adicionada na tabela leads';
  ELSE
    RAISE WARNING '❌ Falha ao criar coluna deleted_at';
  END IF;
  
  -- Verifica se a tabela de histórico foi criada
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'lead_status_history'
  ) THEN
    RAISE NOTICE '✅ Tabela lead_status_history criada com sucesso';
  ELSE
    RAISE WARNING '❌ Falha ao criar tabela lead_status_history';
  END IF;
  
  -- Verifica se o trigger foi criado
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_lead_status_history'
  ) THEN
    RAISE NOTICE '✅ Trigger trg_lead_status_history criado com sucesso';
  ELSE
    RAISE WARNING '❌ Falha ao criar trigger trg_lead_status_history';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 20260205_lead_soft_delete_and_history executada com sucesso!';
  RAISE NOTICE 'Soft delete e histórico de status implementados para leads';
END $$;

COMMIT;
