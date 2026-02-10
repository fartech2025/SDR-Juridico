-- Migration: Histórico de Status de Tarefas
-- Data: 2026-02-05
-- Prioridade: IMPORTANTE
-- Descrição: Cria tabela para rastrear todas as mudanças de status das tarefas
--            permitindo timeline completa e auditoria detalhada

BEGIN;

-- =====================================================
-- 1. TABELA DE HISTÓRICO DE STATUS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tarefa_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id),
  
  -- Status antes e depois
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  
  -- Quem fez a mudança
  changed_by UUID REFERENCES auth.users(id),
  
  -- Contexto adicional
  motivo TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Comentários
COMMENT ON TABLE public.tarefa_status_history IS 
  'Histórico de todas as mudanças de status das tarefas para auditoria e timeline';

COMMENT ON COLUMN public.tarefa_status_history.status_anterior IS 
  'Status da tarefa antes da mudança (NULL se for criação)';

COMMENT ON COLUMN public.tarefa_status_history.status_novo IS 
  'Status da tarefa após a mudança';

COMMENT ON COLUMN public.tarefa_status_history.motivo IS 
  'Motivo da mudança (ex: rejeição, devolução)';

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tarefa_status_history_tarefa 
  ON public.tarefa_status_history(tarefa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarefa_status_history_org 
  ON public.tarefa_status_history(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarefa_status_history_user 
  ON public.tarefa_status_history(changed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarefa_status_history_status 
  ON public.tarefa_status_history(status_novo, created_at DESC);

-- =====================================================
-- 3. RLS - ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.tarefa_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefa_status_history FORCE ROW LEVEL SECURITY;

-- SELECT: Membros da org podem ver histórico
DROP POLICY IF EXISTS tarefa_status_history_select ON public.tarefa_status_history;
CREATE POLICY tarefa_status_history_select
ON public.tarefa_status_history
FOR SELECT
USING (
  is_org_member(org_id)
);

-- INSERT: Membros da org podem inserir
DROP POLICY IF EXISTS tarefa_status_history_insert ON public.tarefa_status_history;
CREATE POLICY tarefa_status_history_insert
ON public.tarefa_status_history
FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- =====================================================
-- 4. FUNÇÃO PARA REGISTRAR MUDANÇA DE STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION log_tarefa_status_change(
  p_tarefa_id UUID,
  p_org_id UUID,
  p_status_anterior TEXT,
  p_status_novo TEXT,
  p_motivo TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO public.tarefa_status_history (
    tarefa_id,
    org_id,
    status_anterior,
    status_novo,
    changed_by,
    motivo,
    metadata
  ) VALUES (
    p_tarefa_id,
    p_org_id,
    p_status_anterior,
    p_status_novo,
    auth.uid(),
    p_motivo,
    p_metadata
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;

COMMENT ON FUNCTION log_tarefa_status_change IS 
  'Registra uma mudança de status no histórico da tarefa.
   Retorna o ID do registro criado.';

-- =====================================================
-- 5. TRIGGER AUTOMÁTICO PARA CAPTURAR MUDANÇAS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_log_tarefa_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Só registra se o status realmente mudou
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    INSERT INTO public.tarefa_status_history (
      tarefa_id,
      org_id,
      status_anterior,
      status_novo,
      changed_by,
      motivo,
      metadata
    ) VALUES (
      NEW.id,
      NEW.org_id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status::TEXT END,
      NEW.status::TEXT,
      COALESCE(auth.uid(), NEW.assigned_user_id),
      CASE 
        WHEN NEW.rejected_reason IS NOT NULL AND NEW.rejected_reason != COALESCE(OLD.rejected_reason, '') 
        THEN NEW.rejected_reason
        ELSE NULL
      END,
      jsonb_build_object(
        'operation', TG_OP,
        'timestamp', NOW(),
        'priority', NEW.priority,
        'due_at', NEW.due_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove trigger se existir e recria
DROP TRIGGER IF EXISTS trg_tarefa_status_history ON public.tarefas;

CREATE TRIGGER trg_tarefa_status_history
  AFTER INSERT OR UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_tarefa_status_change();

COMMENT ON TRIGGER trg_tarefa_status_history ON public.tarefas IS 
  'Registra automaticamente todas as mudanças de status no histórico';

-- =====================================================
-- 6. VIEW PARA TIMELINE DE TAREFAS
-- =====================================================

CREATE OR REPLACE VIEW v_tarefa_timeline AS
SELECT 
  h.id,
  h.created_at,
  h.tarefa_id,
  h.org_id,
  h.status_anterior,
  h.status_novo,
  h.changed_by,
  h.motivo,
  h.metadata,
  t.titulo AS tarefa_titulo,
  u.email AS changed_by_email,
  u.raw_user_meta_data->>'name' AS changed_by_name
FROM public.tarefa_status_history h
LEFT JOIN public.tarefas t ON t.id = h.tarefa_id
LEFT JOIN auth.users u ON u.id = h.changed_by
ORDER BY h.created_at DESC;

COMMENT ON VIEW v_tarefa_timeline IS 
  'View que mostra o histórico de mudanças de status com informações do usuário';

-- =====================================================
-- 7. FUNÇÃO PARA OBTER HISTÓRICO DE UMA TAREFA
-- =====================================================

CREATE OR REPLACE FUNCTION get_tarefa_history(p_tarefa_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  status_anterior TEXT,
  status_novo TEXT,
  changed_by UUID,
  changed_by_name TEXT,
  motivo TEXT,
  tempo_no_status INTERVAL
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
    h.changed_by,
    COALESCE(u.raw_user_meta_data->>'name', u.email)::TEXT AS changed_by_name,
    h.motivo,
    LEAD(h.created_at) OVER (ORDER BY h.created_at) - h.created_at AS tempo_no_status
  FROM public.tarefa_status_history h
  LEFT JOIN auth.users u ON u.id = h.changed_by
  WHERE h.tarefa_id = p_tarefa_id
  ORDER BY h.created_at ASC;
$$;

COMMENT ON FUNCTION get_tarefa_history IS 
  'Retorna o histórico completo de uma tarefa com tempo em cada status';

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  -- Verifica se a tabela foi criada
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tarefa_status_history'
  ) THEN
    RAISE NOTICE '✅ Tabela tarefa_status_history criada com sucesso';
  ELSE
    RAISE WARNING '❌ Falha ao criar tabela tarefa_status_history';
  END IF;
  
  -- Verifica se o trigger foi criado
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_tarefa_status_history'
  ) THEN
    RAISE NOTICE '✅ Trigger trg_tarefa_status_history criado com sucesso';
  ELSE
    RAISE WARNING '❌ Falha ao criar trigger trg_tarefa_status_history';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 20260205_tarefa_status_history executada com sucesso!';
  RAISE NOTICE 'Histórico de status implementado para tarefas';
END $$;

COMMIT;
