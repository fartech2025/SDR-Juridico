#!/usr/bin/env node

/**
 * 🚀 Conectar Google Calendar Rápido
 * 
 * Versão simplificada para conectar Google Calendar
 * Requer estar logado na aplicação web
 * 
 * Uso: node scripts/connect-google-simple.mjs
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
║   🚀 CONECTAR GOOGLE CALENDAR - RÁPIDO                         ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log(
        `${colors.red}❌ Erro: Variáveis Supabase não encontradas em .env${colors.reset}`,
      )
      process.exit(1)
    }

    console.log(`${colors.green}✅ Variáveis Supabase carregadas${colors.reset}\n`)

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar autenticação
    console.log(`${colors.cyan}🔍 Verificando autenticação...${colors.reset}`)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log(`${colors.red}❌ Você não está logado${colors.reset}`)
      console.log(`${colors.yellow}Faça login primeiro:${colors.reset}`)
      console.log(`  http://localhost:5174`)
      rl.close()
      process.exit(1)
    }

    console.log(`${colors.green}✅ Autenticado como: ${session.user.email}${colors.reset}\n`)

    // Obter organização
    console.log(`${colors.cyan}🏢 Obtendo organização...${colors.reset}`)
    const { data: membership, error: membershipError } = await supabase
      .from('user_memberships')
      .select('org_id, orgs(id, nome)')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      console.log(`${colors.red}❌ Organização não encontrada${colors.reset}`)
      console.log(`${colors.yellow}Você precisa estar em uma organização${colors.reset}`)
      rl.close()
      process.exit(1)
    }

    const orgId = membership.org_id
    const orgName = membership.orgs.nome

    console.log(`${colors.green}✅ Organização: ${orgName}${colors.reset}\n`)

    // Verificar/criar integração
    console.log(`${colors.cyan}📅 Verificando integração Google Calendar...${colors.reset}`)
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'google_calendar')
      .maybeSingle()

    if (integrationError) {
      console.log(`${colors.red}❌ Erro: ${integrationError.message}${colors.reset}`)
      rl.close()
      process.exit(1)
    }

    let integrationId

    if (!integration) {
      console.log(`${colors.yellow}⚠️  Criando integração...${colors.reset}`)
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
        console.log(`${colors.red}❌ Erro: ${createError.message}${colors.reset}`)
        rl.close()
        process.exit(1)
      }

      integrationId = newInteg.id
      console.log(`${colors.green}✅ Integração criada${colors.reset}`)
    } else {
      integrationId = integration.id
      if (integration.enabled && integration.secrets?.access_token) {
        console.log(`${colors.green}✅ JÁ CONECTADO! Última sync: ${integration.settings?.last_sync_at || 'nunca'}${colors.reset}`)
        rl.close()
        return
      }
    }

    console.log('')

    // Gerar link OAuth
    const returnTo = `http://localhost:5174/app/config`
    const oauthUrl = new URL(
      `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`,
    )
    oauthUrl.searchParams.set('integration_id', integrationId)
    oauthUrl.searchParams.set('org_id', orgId)
    oauthUrl.searchParams.set('return_to', returnTo)

    console.log(`${colors.green}${colors.bold}✅ LINK GERADO!${colors.reset}\n`)
    console.log(`${colors.cyan}Cole no navegador:${colors.reset}`)
    console.log(`${colors.yellow}${oauthUrl.toString()}${colors.reset}`)
    console.log(`
${colors.cyan}Ou${colors.reset} acesse http://localhost:5174/app/config → Google Calendar → Vincular

${colors.gray}═════════════════════════════════════════════════════════════${colors.reset}

${colors.cyan}Próximos passos:${colors.reset}
  1. ✅ Clique no link (ou acesse Configurações)
  2. 📱 Autorize o acesso ao Google
  3. 📋 Volta para a Agenda
  4. 📝 Preencha: Título, Data, Hora
  5. 🎬 Clique: "Gerar Google Meet" 🎉
`)

    rl.close()
  } catch (err) {
    console.error(`${colors.red}Erro:${colors.reset}`, err.message)
    rl.close()
    process.exit(1)
  }
}

main()
