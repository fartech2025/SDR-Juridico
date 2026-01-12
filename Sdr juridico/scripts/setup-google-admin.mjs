#!/usr/bin/env node

/**
 * 🔧 Setup Google Calendar - Admin
 * 
 * Setup administrativo para configurar Google Calendar
 * Não requer estar logado como usuário
 * 
 * Uso: node scripts/setup-google-admin.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

// Carregar .env automaticamente
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')
const envLocalPath = path.resolve(__dirname, '../.env.local')

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}

  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })

  return env
}

// Carregar .env e .env.local
const envVars = {
  ...loadEnv(envPath),
  ...loadEnv(envLocalPath),
}

// Injetar variáveis no process.env
Object.entries(envVars).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value
  }
})

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, resolve)
  })

async function main() {
  try {
    console.clear()
    console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════════════════════╗
║   🔧 SETUP GOOGLE CALENDAR - ADMIN                             ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log(
        `${colors.red}❌ Erro: Variáveis Supabase não encontradas em .env${colors.reset}`,
      )
      process.exit(1)
    }

    console.log(`${colors.green}✅ Variáveis Supabase carregadas${colors.reset}\n`)

    // Perguntar qual organização
    console.log(`${colors.cyan}📋 Qual é sua organização?${colors.reset}`)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Listar usuários
    const { data: users } = await supabase
      .from('orgs')
      .select('id, nome')
      .limit(10)

    if (!users || users.length === 0) {
      console.log(`${colors.red}❌ Nenhuma organização encontrada${colors.reset}`)
      process.exit(1)
    }

    console.log(`${colors.yellow}Organizações disponíveis:${colors.reset}`)
    users.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.nome}`)
    })

    const selected = await question(
      `${colors.cyan}➜${colors.reset} Escolha o número (1-${users.length}): `,
    )
    const orgIdx = parseInt(selected) - 1

    if (orgIdx < 0 || orgIdx >= users.length) {
      console.log(`${colors.red}❌ Opção inválida${colors.reset}`)
      process.exit(1)
    }

    const orgId = users[orgIdx].id
    const orgName = users[orgIdx].nome

    console.log(
      `${colors.green}✅ Selecionado: ${orgName}${colors.reset}\n`,
    )

    // Verificar integração Google Calendar
    console.log(`${colors.cyan}📅 Verificando integração Google Calendar...${colors.reset}`)
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'google_calendar')
      .maybeSingle()

    if (integrationError) {
      console.log(`${colors.red}❌ Erro ao verificar integração: ${integrationError.message}${colors.reset}`)
      process.exit(1)
    }

    let integrationId
    if (!integration) {
      console.log(`${colors.yellow}⚠️  Integração não encontrada, criando...${colors.reset}`)
      const { data: newInteg, error: createError } = await supabase
        .from('integrations')
        .insert({
          org_id: orgId,
          provider: 'google_calendar',
          name: 'Google Calendar',
          enabled: false,
          secrets: {},
          settings: {},
        })
        .select()
        .single()

      if (createError) {
        console.log(`${colors.red}❌ Erro ao criar integração: ${createError.message}${colors.reset}`)
        process.exit(1)
      }

      integrationId = newInteg.id
      console.log(`${colors.green}✅ Integração criada${colors.reset}\n`)
    } else {
      integrationId = integration.id
      if (integration.enabled && integration.secrets?.access_token) {
        console.log(
          `${colors.green}✅ Google Calendar JÁ ESTÁ CONECTADO!${colors.reset}\n`,
        )
        console.log(`   Última sincronização: ${integration.settings?.last_sync_at || 'nunca'}\n`)
      } else {
        console.log(`${colors.yellow}⚠️  Integração existe mas não está conectada${colors.reset}\n`)
      }
    }

    // Gerar link de vinculação
    console.log(`${colors.cyan}🚀 Gerando link de vinculação...${colors.reset}`)
    const returnTo = `http://localhost:5174/app/config`
    const oauthUrl = new URL(
      `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`,
    )
    oauthUrl.searchParams.set('integration_id', integrationId)
    oauthUrl.searchParams.set('org_id', orgId)
    oauthUrl.searchParams.set('return_to', returnTo)

    console.log(`
${colors.green}${colors.bold}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LINK DE VINCULAÇÃO GERADO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.reset}

${colors.cyan}Cole este link no navegador:${colors.reset}

${colors.yellow}${oauthUrl.toString()}${colors.reset}

${colors.cyan}Ou acesse:${colors.reset}
  http://localhost:5174/app/config → Google Calendar → Vincular

${colors.cyan}Próximos passos:${colors.reset}
  1. Clique no link acima
  2. Autorize o acesso ao Google
  3. Você será redirecionado para Configurações
  4. Volte para a Agenda
  5. Preencha: Título, Data, Hora
  6. Clique: "Gerar Google Meet" 🎉
`)

    rl.close()
  } catch (err) {
    console.error(`${colors.red}Erro inesperado:${colors.reset}`, err.message)
    rl.close()
    process.exit(1)
  }
}

main()
