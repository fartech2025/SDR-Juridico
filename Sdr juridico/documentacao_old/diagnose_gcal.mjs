import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xocqcoebreoiaqxoutar.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc'
)

console.log('🔍 DIAGNÓSTICO COMPLETO - Google Calendar\n')

// 1. Verificar autenticação
const { data: { user } } = await supabase.auth.getUser()
console.log('1️⃣ Usuário autenticado:', user ? `✅ ${user.email}` : '❌ Não autenticado')

if (!user) {
  console.log('\n⚠️ PROBLEMA: Usuário não está autenticado!')
  console.log('   Solução: Faça login na aplicação primeiro')
  process.exit(0)
}

// 2. Verificar org_memberships
console.log('\n2️⃣ Buscando organizações do usuário...')
const { data: memberships, error: membError } = await supabase
  .from('org_memberships')
  .select('org_id, orgs(nome)')

if (membError) {
  console.log('❌ Erro:', membError.message)
} else if (!memberships || memberships.length === 0) {
  console.log('❌ Usuário não pertence a nenhuma organização')
  console.log('   Solução: Criar organização primeiro')
} else {
  console.log(`✅ ${memberships.length} organização(ões) encontrada(s)`)
  const orgId = memberships[0].org_id
  console.log('   Usando org_id:', orgId)
  
  // 3. Verificar integrations
  console.log('\n3️⃣ Buscando integrações...')
  const { data: integrations, error: intError } = await supabase
    .from('integrations')
    .select('*')
    .eq('org_id', orgId)
  
  if (intError) {
    console.log('❌ Erro:', intError.message)
    console.log('   Código:', intError.code)
  } else {
    console.log(`✅ ${integrations.length} integração(ões) encontrada(s)`)
    
    if (integrations.length > 0) {
      console.log('\n📋 Estrutura da tabela integrations:')
      Object.keys(integrations[0]).forEach(col => {
        console.log(`   - ${col}`)
      })
      
      // Verificar Google Calendar
      const gcal = integrations.find(i => i.provider === 'google_calendar')
      if (gcal) {
        console.log('\n4️⃣ Google Calendar:')
        console.log('   - ID:', gcal.id)
        console.log('   - Habilitado:', gcal.enabled)
        console.log('   - Secrets:', gcal.secrets ? 'Configurado' : 'Vazio')
        console.log('   - Settings:', gcal.settings ? JSON.stringify(gcal.settings, null, 2) : 'Vazio')
      } else {
        console.log('\n❌ Google Calendar não encontrado')
        console.log('   Solução: Criar integrações padrão')
      }
    }
  }
}

console.log('\n5️⃣ Variáveis de ambiente necessárias (Edge Functions):')
console.log('   - GOOGLE_CLIENT_ID: Configure no painel do Supabase')
console.log('   - GOOGLE_CLIENT_SECRET: Configure no painel do Supabase')
console.log('   - GOOGLE_REDIRECT_URI: https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth')
console.log('   - APP_URL: http://localhost:5174')
