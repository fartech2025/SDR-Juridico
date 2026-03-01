import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xocqcoebreoiaqxoutar.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4ODM1OSwiZXhwIjoyMDgzMjY0MzU5fQ.khAeed2Jcr9xEidxxtudXV5RPiIix6eU4JAePGHde3I'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const migrations = [
  'supabase/migrations/20260227_documento_templates.sql',
  'supabase/migrations/20260227_org_branding.sql',
]

for (const file of migrations) {
  const sql = readFileSync(file, 'utf8')
  console.log(`\nAplicando ${file}...`)
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    // exec_sql pode não existir — tentar via REST direto
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    })
    console.log('REST status:', res.status)
    if (!res.ok) console.error('Erro:', await res.text())
    else console.log('OK via REST')
  } else {
    console.log('OK via RPC')
  }
}
