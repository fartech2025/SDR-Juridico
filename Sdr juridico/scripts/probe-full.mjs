import { createClient } from '@supabase/supabase-js'

const c = createClient(
  'https://xocqcoebreoiaqxoutar.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc'
)

// 1. Test: does org_features table exist now?
console.log('=== org_features table check ===')
const r1 = await c.from('org_features').select('*').limit(1)
console.log('Error:', r1.error?.message || 'NONE (table exists!)')
console.log('Status:', r1.status)

// 2. Test: audit_log.org_id nullable?
console.log('\n=== audit_log.org_id constraint ===')
const r2 = await c.from('orgs').insert({
  nome: 'Probe Audit Test',
  name: 'Probe Audit Test',
  slug: 'probe-audit-test-' + Date.now(),
  email: 'probe@test.com',
  plan: 'trial',
  status: 'pending',
  settings: {},
}).select('id, slug').single()
console.log('Insert orgs Error:', r2.error?.message || 'NONE (success)')
if (r2.data) {
  console.log('Created org:', r2.data.id)
  // cleanup
  await c.from('orgs').delete().eq('id', r2.data.id)
  console.log('Cleaned up')
}

// 3. Test: what happens with usuarios upsert (simulating edge function)?
console.log('\n=== usuarios upsert test (simulates edge fn) ===')
const r3 = await c.from('usuarios').select('id, email').limit(2)
console.log('Select usuarios error:', r3.error?.message || 'none')
console.log('Usuarios found:', r3.data?.length || 0)

// 4. Test: org_members upsert
console.log('\n=== org_members check ===')
const r4 = await c.from('org_members').select('id, org_id, user_id, role').limit(2)
console.log('Select org_members error:', r4.error?.message || 'none')
console.log('Members found:', r4.data?.length || 0)
if (r4.data) r4.data.forEach(m => console.log(` role=${m.role} org=${m.org_id}`))

// 5. Check if edge function can even reach by simulating a call
console.log('\n=== Edge Function test call ===')
const { data: sess } = await c.auth.getSession()
if (sess.session) {
  const { data, error } = await c.functions.invoke('invite-org-admin', {
    body: { orgId: 'test', adminEmail: 'test@test.com', adminName: 'Test' },
    headers: { Authorization: `Bearer ${sess.session.access_token}` },
  })
  console.log('Edge fn error:', error?.message || 'none')
  console.log('Edge fn response:', JSON.stringify(data))
} else {
  console.log('No session - cannot test edge function. Sign in first.')
}
