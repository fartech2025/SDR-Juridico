import { createClient } from '@supabase/supabase-js'

/**
 * This script fixes the audit_log trigger that blocks INSERT on the orgs table.
 * It uses the Supabase SQL execution via RPC if available, or provides instructions.
 * 
 * The fix:
 * 1. Makes audit_log.org_id NULLABLE (it was incorrectly set as NOT NULL)
 * 2. Updates audit_trigger_func() to use NEW.id as org_id for the 'orgs' table
 */

const SUPABASE_URL = 'https://xocqcoebreoiaqxoutar.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc'

const c = createClient(SUPABASE_URL, ANON_KEY)

// Try to sign in as admin to get elevated permissions
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: npx tsx scripts/fix-audit-trigger.mjs <admin_email> <admin_password>')
  console.log('')
  console.log('Since we cannot run SQL directly via the anon key, you need to run')
  console.log('this SQL in the Supabase Dashboard SQL Editor:')
  console.log('')
  console.log('Go to: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/sql/new')
  console.log('')
  console.log('Paste and run this SQL:')
  console.log('─'.repeat(60))
  console.log(`
-- STEP 1: Make org_id NULLABLE in audit_log
ALTER TABLE public.audit_log ALTER COLUMN org_id DROP NOT NULL;

-- STEP 2: Fix audit_trigger_func to handle orgs table
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
  -- For the 'orgs' table, use the row's own id as org_id
  IF TG_TABLE_NAME = 'orgs' THEN
    IF TG_OP = 'DELETE' THEN
      org_id_val := OLD.id;
    ELSE
      org_id_val := NEW.id;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      BEGIN org_id_val := OLD.org_id;
      EXCEPTION WHEN OTHERS THEN org_id_val := NULL; END;
    ELSE
      BEGIN org_id_val := NEW.org_id;
      EXCEPTION WHEN OTHERS THEN org_id_val := NULL; END;
    END IF;
  END IF;

  BEGIN actor_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN actor_user_id := NULL; END;

  IF TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(key) INTO changed_fields
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
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields,
    actor_user_id,
    org_id_val,
    jsonb_build_object('trigger_name', TG_NAME, 'trigger_time', CURRENT_TIMESTAMP)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
`)
  console.log('─'.repeat(60))
  process.exit(0)
}

// If credentials provided, sign in and test
console.log('Signing in...')
const { error: signInError } = await c.auth.signInWithPassword({ email, password })
if (signInError) {
  console.error('Sign in failed:', signInError.message)
  process.exit(1)
}

console.log('Testing org creation...')
const { data, error } = await c.from('orgs').insert({
  nome: 'Test After Fix',
  name: 'Test After Fix',
  slug: 'test-after-fix-' + Date.now(),
  email: 'test@test.com',
  plan: 'trial',
  status: 'pending',
  settings: {},
}).select().single()

if (error) {
  console.error('❌ Still failing:', error.message)
  console.error('Code:', error.code)
  console.error('Details:', error.details)
  console.log('\nYou need to run the SQL fix in the Supabase Dashboard first.')
  console.log('Go to: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/sql/new')
} else {
  console.log('✅ SUCCESS! Org created:', data.id, data.slug)
  // Cleanup
  await c.from('orgs').delete().eq('id', data.id)
  console.log('Cleaned up test org.')
}
