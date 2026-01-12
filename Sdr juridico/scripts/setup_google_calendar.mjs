#!/usr/bin/env node

/**
 * 🔧 Setup Automatizado do Google Calendar
 * 
 * Este script configura a integração do Google Calendar com a Agenda.
 * Ele:
 * 1. Verifica as credenciais OAuth
 * 2. Configura as variáveis de ambiente no Supabase
 * 3. Deploy das Edge Functions
 * 4. Valida a configuração
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.cyan}📋 ${msg}${colors.reset}`),
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log.success(`${description} existe`)
    return true
  }
  log.error(`${description} não encontrado: ${filePath}`)
  return false
}

function checkEnvironmentVariable(name, optional = false) {
  const value = process.env[name]
  if (value) {
    log.success(`${name} está definido`)
    return value
  }
  if (optional) {
    log.warning(`${name} é opcional, não definido`)
    return null
  }
  log.error(`${name} não está definido`)
  return null
}

function executeCommand(command, description) {
  try {
    log.info(`Executando: ${command}`)
    const output = execSync(command, { 
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
    })
    log.success(description)
    return { success: true, output }
  } catch (error) {
    log.error(`${description}: ${error.message}`)
    return { success: false, output: error.message }
  }
}

async function main() {
  console.log(`\n${colors.cyan}🚀 SETUP AUTOMATIZADO - GOOGLE CALENDAR${colors.reset}`)
  console.log('='.repeat(50))

  // Passo 1: Verificar arquivos necessários
  log.step('1. Verificando arquivos necessários')
  
  const requiredFiles = [
    { path: 'supabase/functions/google-calendar-oauth/index.ts', desc: 'OAuth Function' },
    { path: 'supabase/functions/google-calendar-sync/index.ts', desc: 'Sync Function' },
    { path: 'supabase/functions/google-calendar-sync-cron/index.ts', desc: 'Cron Function' },
    { path: 'src/hooks/useIntegrations.ts', desc: 'Hook useIntegrations' },
    { path: 'src/hooks/useAgenda.ts', desc: 'Hook useAgenda' },
  ]

  let allFilesExist = true
  for (const file of requiredFiles) {
    const fullPath = path.join(projectRoot, file.path)
    if (!checkFile(fullPath, file.desc)) {
      allFilesExist = false
    }
  }

  if (!allFilesExist) {
    log.error('Alguns arquivos obrigatórios estão faltando!')
    process.exit(1)
  }

  // Passo 2: Verificar Supabase CLI
  log.step('2. Verificando Supabase CLI')
  
  const supabaseCheck = executeCommand('which supabase || npx supabase --version', 'Supabase CLI')
  if (!supabaseCheck.success) {
    log.warning('Supabase CLI não encontrado. Instalando...')
    executeCommand('npm install -g supabase', 'Instalação do Supabase CLI')
  }

  // Passo 3: Verificar variáveis de ambiente
  log.step('3. Verificando variáveis de ambiente')
  
  const supabaseUrl = checkEnvironmentVariable('VITE_SUPABASE_URL', true)
  const supabaseAnonKey = checkEnvironmentVariable('VITE_SUPABASE_ANON_KEY', true)
  
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Variáveis Supabase não configuradas!')
    log.info('Crie um arquivo .env.local com:')
    log.info('VITE_SUPABASE_URL=https://seu-projeto.supabase.co')
    log.info('VITE_SUPABASE_ANON_KEY=sua-anon-key')
    process.exit(1)
  }

  // Passo 4: Extrair project-ref do URL
  log.step('4. Configurando referências do projeto')
  
  const projectRef = supabaseUrl.includes('xocqcoebreoiaqxoutar') 
    ? 'xocqcoebreoiaqxoutar'
    : supabaseUrl.split('//')[1]?.split('.')[0] || null

  if (!projectRef) {
    log.error('Não foi possível extrair project-ref da URL do Supabase')
    process.exit(1)
  }

  log.success(`Project Reference: ${projectRef}`)

  // Passo 5: Orientações para OAuth
  log.step('5. ⚠️  AÇÃO MANUAL NECESSÁRIA: Configurar Google OAuth')
  
  console.log(`
${colors.yellow}Você precisa configurar as credenciais do Google:${colors.reset}

1️⃣  Acesse: https://console.cloud.google.com/
2️⃣  Crie um novo projeto (ou use um existente)
3️⃣  Ative a API Google Calendar:
    - Menu: APIs & Services > Library
    - Busque: "Google Calendar API"
    - Clique: ENABLE
4️⃣  Crie credenciais OAuth 2.0:
    - Menu: APIs & Services > Credentials
    - Clique: "Create Credentials" > "OAuth 2.0 Client ID"
    - Application type: Web application
    - Authorized redirect URIs:
      - https://${projectRef}.supabase.co/functions/v1/google-calendar-oauth
      - http://localhost:5174/app/config
    - Clique: CREATE
5️⃣  Copie o Client ID e Client Secret

${colors.cyan}Quando terminar, execute:${colors.reset}

  GOOGLE_CLIENT_ID="seu-client-id" \\
  GOOGLE_CLIENT_SECRET="seu-client-secret" \\
  npx supabase functions deploy google-calendar-oauth \\
    --project-ref ${projectRef}

Ou use o próximo passo automaticamente.
  `)

  // Passo 6: Verificar credenciais
  log.step('6. Verificando credenciais do Google')
  
  const googleClientId = checkEnvironmentVariable('GOOGLE_CLIENT_ID', true)
  const googleClientSecret = checkEnvironmentVariable('GOOGLE_CLIENT_SECRET', true)

  if (!googleClientId || !googleClientSecret) {
    log.warning('Credenciais do Google não encontradas no ambiente')
    log.info('Configure as variáveis de ambiente:')
    log.info('  export GOOGLE_CLIENT_ID="seu-client-id"')
    log.info('  export GOOGLE_CLIENT_SECRET="seu-client-secret"')
    log.info('  Depois execute este script novamente')
    process.exit(0)
  }

  // Passo 7: Deploy das Edge Functions
  log.step('7. Fazendo deploy das Edge Functions')

  const functions = [
    'google-calendar-oauth',
    'google-calendar-sync',
    'google-calendar-sync-cron',
  ]

  for (const func of functions) {
    log.info(`Deploying ${func}...`)
    const deploy = executeCommand(
      `npx supabase functions deploy ${func} --project-ref ${projectRef}`,
      `Deploy de ${func}`
    )
    if (!deploy.success) {
      log.warning(`Falha no deploy de ${func}. Verifique as credenciais Supabase.`)
    }
  }

  // Passo 8: Configurar secrets no Supabase
  log.step('8. Configurando secrets no Supabase')

  const secrets = [
    { key: 'GOOGLE_CLIENT_ID', value: googleClientId },
    { key: 'GOOGLE_CLIENT_SECRET', value: googleClientSecret },
    { key: 'GOOGLE_REDIRECT_URI', value: `https://${projectRef}.supabase.co/functions/v1/google-calendar-oauth` },
    { key: 'APP_URL', value: 'http://localhost:5174' },
  ]

  log.info('Para configurar os secrets, use o dashboard Supabase:')
  log.info(`https://supabase.com/dashboard/project/${projectRef}/settings/functions`)
  log.info('')
  log.info('Adicione as seguintes variáveis de ambiente:')
  for (const secret of secrets) {
    log.info(`  ${secret.key}=${secret.value}`)
  }

  // Passo 9: Teste de conexão
  log.step('9. Testando integração')

  log.info('Para testar a integração:')
  log.info('1. Inicie o servidor: npm run dev')
  log.info('2. Acesse: http://localhost:5174/app/config')
  log.info('3. Localize "Google Calendar"')
  log.info('4. Clique em "Vincular"')
  log.info('5. Autorize o acesso ao seu Google Calendar')

  // Conclusão
  console.log(`
${colors.green}✅ SETUP CONCLUÍDO!${colors.reset}

${colors.cyan}Próximos passos:${colors.reset}
1. Configure os secrets no dashboard Supabase
2. Inicie o servidor: npm run dev
3. Acesse http://localhost:5174/app/config
4. Clique em "Vincular" no Google Calendar
5. Autorize o acesso ao seu Google Calendar
6. Eventos serão sincronizados automaticamente

${colors.yellow}Documentação:${colors.reset}
- Arquivo: GOOGLE_CALENDAR_SETUP.md
- Script diagnóstico: fix_google_calendar.mjs

Dúvidas? Verifique os logs das Edge Functions no dashboard Supabase.
  `)
}

main().catch((error) => {
  log.error(`Erro durante setup: ${error.message}`)
  process.exit(1)
})
