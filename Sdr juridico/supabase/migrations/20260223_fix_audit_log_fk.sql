-- Fix: audit_log FK constraints impedem exclusão de organizações e usuários
--
-- Problema:
--   O trigger audit_orgs (AFTER DELETE ON orgs) tenta inserir em audit_log
--   com o org_id sendo deletado, causando FK violation circular.
--   A FK changed_by -> auth.users(id) sem CASCADE também bloquearia
--   exclusão de usuários.
--
-- Solução: 
--   1. Remover FK rígida audit_log.org_id -> orgs(id)
--      (log tables não devem ter FK rígida para evitar circular deps)
--   2. Alterar FK changed_by -> auth.users(id) para ON DELETE SET NULL
--   3. Modificar trigger para setar org_id = NULL em DELETE de orgs
--
-- Data: 2026-02-23
-- Aplicado manualmente via Management API

BEGIN;

-- ============================================================
-- PASSO 1: Remover a FK org_id que causa o bloqueio circular
-- ============================================================
ALTER TABLE public.audit_log 
  DROP CONSTRAINT IF EXISTS audit_log_org_id_fkey;

-- ============================================================
-- PASSO 2: Corrigir FK changed_by para ON DELETE SET NULL
-- ============================================================
ALTER TABLE public.audit_log 
  DROP CONSTRAINT IF EXISTS audit_log_changed_by_fkey;
ALTER TABLE public.audit_log 
  ADD CONSTRAINT audit_log_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- PASSO 3: Atualizar a função de trigger para setar org_id NULL
--          quando a operação é DELETE na própria tabela orgs
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changed_fields TEXT[];
  org_id_val UUID;
  actor_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'orgs' THEN
      org_id_val := NULL;
    ELSE
      BEGIN
        org_id_val := OLD.org_id;
      EXCEPTION WHEN OTHERS THEN
        org_id_val := NULL;
      END;
    END IF;
  ELSE
    BEGIN
      org_id_val := NEW.org_id;
    EXCEPTION WHEN OTHERS THEN
      org_id_val := NULL;
    END;
  END IF;

  BEGIN
    actor_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor_user_id := NULL;
  END;

  IF TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key;
  END IF;

  INSERT INTO public.audit_log (
    table_name, record_id, action, old_data, new_data,
    changed_fields, changed_by, org_id, metadata
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields,
    actor_user_id,
    org_id_val,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'trigger_time', CURRENT_TIMESTAMP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;
