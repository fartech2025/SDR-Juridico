-- =====================================================
-- FIX: Trigger trg_lead_status_history
-- O trigger referenciava NEW.responsavel e NEW.heat,
-- mas a tabela leads NÃO possui essas colunas.
-- - responsavel → stored in qualificacao JSONB
-- - heat → stored in qualificacao JSONB
-- Corrigido para usar assigned_user_id e qualificacao->>'heat'
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Só registra se o status realmente mudou
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.status IS DISTINCT FROM NEW.status
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
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE (OLD.qualificacao->>'heat') END,
      (NEW.qualificacao->>'heat'),
      COALESCE(auth.uid(), NEW.assigned_user_id),
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_lead_status_history ON public.leads;

CREATE TRIGGER trg_lead_status_history
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_lead_status_change();
