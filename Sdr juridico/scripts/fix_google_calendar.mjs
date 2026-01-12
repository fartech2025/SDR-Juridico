import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xocqcoebreoiaqxoutar.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Fjb2VicmVvaWFxeG91dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgzNTksImV4cCI6MjA4MzI2NDM1OX0.BHfigXbXIfBWMjLBUED2Pww_v57VKUT4yOOqLPWMQkc'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORRIGINDO CONFIGURAÇÃO DO GOOGLE CALENDAR\n')

// 1. Verificar autenticação
console.log('1️⃣ Verificando autenticação...')
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  console.log('❌ ERRO: Usuário não autenticado!')
  console.log('\n📋 AÇÃO NECESSÁRIA:')
  console.log('   1. Abra o navegador em: http://localhost:5174')
  console.log('   2. Faça login na aplicação')
  console.log('   3. Execute este script novamente')
  process.exit(1)
}

console.log('✅ Usuário:', user.email)

// 2. Verificar organização
console.log('\n2️⃣ Verificando organização...')
const { data: membership, error: orgError } = await supabase
  .from('org_memberships')
  .select('org_id, orgs(nome)')
  .eq('user_id', user.id)
  .limit(1)
  .single()

if (orgError || !membership) {
  console.log('❌ ERRO: Organização não encontrada!')
  console.log('\n📋 Você precisa criar uma organização primeiro na aplicação')
  process.exit(1)
}

const orgId = membership.org_id
console.log('✅ Organização:', orgId)

// 3. Verificar Google Calendar
console.log('\n3️⃣ Verificando integração Google Calendar...')
const { data: gcal, error: gcalError } = await supabase
  .from('integrations')
  .select('*')
  .eq('org_id', orgId)
  .eq('provider', 'google_calendar')
  .single()

if (gcalError || !gcal) {
  console.log('❌ ERRO: Google Calendar não encontrado!')
  console.log('\n📋 Criando integração...')
  
  const { error: createError } = await supabase
    .from('integrations')
    .insert({
      org_id: orgId,
      provider: 'google_calendar',
      name: 'Google Calendar',
      enabled: false,
      secrets: {},
      settings: {}
    })
  
  if (createError) {
    console.log('❌ Erro ao criar:', createError.message)
    process.exit(1)
  }
  
  console.log('✅ Integração criada!')
} else {
  console.log('✅ Integração encontrada')
  console.log('   - ID:', gcal.id)
  console.log('   - Habilitada:', gcal.enabled)
  console.log('   - Secrets:', Object.keys(gcal.secrets || {}).length > 0 ? '✅ Configurado' : '❌ Vazio')
}

// 4. Instruções finais
console.log('\n' + '='.repeat(60))
console.log('⚠️  CONFIGURAÇÃO MANUAL NECESSÁRIA NO PAINEL DO SUPABASE')
console.log('='.repeat(60))
console.log('\n📋 Siga estes passos:')
console.log('\n1️⃣ CRIAR CREDENCIAIS GOOGLE OAUTH:')
console.log('   → Acesse: https://console.cloud.google.com/')
console.log('   → APIs & Services → Credentials')
console.log('   → Create Credentials → OAuth 2.0 Client ID')
console.log('   → Application type: Web application')
console.log('   → Authorized redirect URIs:')
console.log('     https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth')
console.log('   → Copie o Client ID e Client Secret')

console.log('\n2️⃣ CONFIGURAR NO SUPABASE:')
console.log('   → Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions')
console.log('   → Adicione as seguintes secrets:')
console.log('\n   GOOGLE_CLIENT_ID=seu-client-id-aqui')
console.log('   GOOGLE_CLIENT_SECRET=seu-client-secret-aqui')
console.log('   GOOGLE_REDIRECT_URI=https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth')
console.log('   APP_URL=http://localhost:5174')

console.log('\n3️⃣ FAZER DEPLOY DAS EDGE FUNCTIONS:')
console.log('   → Execute no terminal:')
console.log('   cd "Sdr juridico"')
console.log('   npx supabase functions deploy google-calendar-oauth')
console.log('   npx supabase functions deploy google-calendar-sync')
console.log('   npx supabase functions deploy google-calendar-sync-cron')

console.log('\n4️⃣ TESTAR A CONEXÃO:')
console.log('   → Acesse: http://localhost:5174/app/config')
console.log('   → Clique em "Vincular" no Google Calendar')
console.log('   → Complete o fluxo OAuth')

console.log('\n' + '='.repeat(60))
console.log('✅ Script concluído!')
console.log('='.repeat(60) + '\n')
