import { createClient } from '@supabase/supabase-js'

const c = createClient(
  'https://xocqcoebreoiaqxoutar.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc'
)

// 1. Check audit_log columns and constraints
console.log('--- AUDIT_LOG schema probe ---')
const r1 = await c.from('audit_log').select('*').limit(1)
console.log('Error:', r1.error?.message || 'none')
if (r1.data && r1.data[0]) {
  console.log('Columns:', Object.keys(r1.data[0]).join(', '))
} else {
  console.log('Empty or RLS blocked')
}

// 2. Try insert into audit_log with org_id = NULL to check constraint
console.log('\n--- INSERT audit_log with org_id=NULL ---')
const r2 = await c.from('audit_log').insert({
  table_name: '__probe__',
  record_id: '00000000-0000-0000-0000-000000000001',
  action: 'INSERT',
  org_id: null,
}).select().single()
console.log('Error:', r2.error?.message || 'none')
console.log('Code:', r2.error?.code || 'none')
if (r2.data) {
  console.log('SUCCESS - org_id nullable! Cleaning...')
  await c.from('audit_log').delete().eq('id', r2.data.id)
}

// 3. Check existing slugs list
console.log('\n--- Existing orgs ---')
const r3 = await c.from('orgs').select('id, slug, nome, name, created_at').order('created_at', { ascending: false }).limit(10)
console.log('Error:', r3.error?.message || 'none')
r3.data?.forEach(o => console.log(` ${o.slug} | nome="${o.nome}" name="${o.name}" id=${o.id}`))

// 4. Try the full insert exactly like the service does
console.log('\n--- FULL INSERT test (like service) ---')
const r4 = await c.from('orgs').insert({
  nome: 'Teste Probe 77',
  name: 'Teste Probe 77',
  slug: 'teste-probe-77',
  email: 'probe@test.com',
  plan: 'trial',
  plano: 'trial',
  status: 'pending',
  settings: {},
}).select().single()
console.log('Error:', r4.error?.message || 'none')
console.log('Code:', r4.error?.code || 'none')
console.log('Details:', r4.error?.details || 'none')
if (r4.data) {
  console.log('SUCCESS!!! id=', r4.data.id)
  // Cleanup
  await c.from('orgs').delete().eq('id', r4.data.id)
  console.log('Cleaned up')
}
