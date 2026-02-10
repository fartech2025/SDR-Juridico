-- =====================================================
-- FIX: audit_log org_id constraint + audit_trigger_func for orgs table
-- Date: 2026-02-06
-- Problem: The audit_trigger_func tries NEW.org_id on the orgs table,
--          but orgs doesn't have an org_id column (it IS the org).
--          Combined with org_id being NOT NULL in audit_log, this
--          blocks ALL inserts/updates on the orgs table.
-- Fix: 
--   1. Make org_id NULLABLE in audit_log (it should be — orgs don't have org_id)
--   2. Fix audit_trigger_func to use NEW.id when table is 'orgs'
-- =====================================================

BEGIN;

-- ================================================================================
-- STEP 1: Make org_id NULLABLE in audit_log
-- ================================================================================
DO $$
BEGIN
  -- Drop NOT NULL constraint on org_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'audit_log' 
      AND column_name = 'org_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.audit_log ALTER COLUMN org_id DROP NOT NULL;
    RAISE NOTICE '✅ audit_log.org_id is now NULLABLE';
  ELSE
    RAISE NOTICE '✅ audit_log.org_id is already nullable (no change needed)';
  END IF;
END $$;

-- ================================================================================
-- STEP 2: Fix audit_trigger_func to handle orgs table correctly
-- ================================================================================
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
  -- Determinar org_id
  -- SPECIAL CASE: For the 'orgs' table, use the row's own id as org_id  
  IF TG_TABLE_NAME = 'orgs' THEN
    IF TG_OP = 'DELETE' THEN
      org_id_val := OLD.id;
    ELSE
      org_id_val := NEW.id;
    END IF;
  ELSE
    -- Normal tables: try to read org_id column
    IF TG_OP = 'DELETE' THEN
      BEGIN
        org_id_val := OLD.org_id;
      EXCEPTION WHEN OTHERS THEN
        org_id_val := NULL;
      END;
    ELSE
      BEGIN
        org_id_val := NEW.org_id;
      EXCEPTION WHEN OTHERS THEN
        org_id_val := NULL;
      END;
    END IF;
  END IF;

  -- Tentar pegar o usuário da sessão atual
  BEGIN
    actor_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor_user_id := NULL;
  END;

  -- Detectar campos alterados (apenas para UPDATE)
  IF TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key;
  END IF;

  -- Inserir log de auditoria
  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    changed_by,
    org_id,
    metadata
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

  -- Retornar o registro apropriado
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;

-- ================================================================================
-- VERIFICATION: Test that INSERT on orgs now works
-- ================================================================================
-- Uncomment below to test:
-- INSERT INTO orgs (nome, name, slug, email, plan, status, settings)
-- VALUES ('__test_fix__', '__test_fix__', '__test_fix_slug__', 'test@test.com', 'trial', 'pending', '{}')
-- RETURNING id, slug;
-- DELETE FROM orgs WHERE slug = '__test_fix_slug__';
