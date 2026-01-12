#!/usr/bin/env node

/**
 * 🔐 Auto-Connect Google Calendar
 * 
 * Conecta o Google Calendar automaticamente usando as credenciais
 * já existentes no projeto Supabase
 * 
 * Uso: node scripts/auto-connect-google.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

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

async function main() {
  try {
    console.clear()
    console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════════════════════╗
║   🔐 AUTO-CONECTAR GOOGLE CALENDAR                             ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log(`${colors.red}❌ Erro: Variáveis Supabase não configuradas${colors.reset}`)
      console.log(`${colors.yellow}Configure em .env ou .env.local:${colors.reset}`)
      console.log(`  VITE_SUPABASE_URL=...`)
      console.log(`  VITE_SUPABASE_ANON_KEY=...`)
      process.exit(1)
    }

    console.log(`${colors.cyan}🔑 Conectando ao Supabase...${colors.reset}`)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar autenticação
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log(`${colors.red}❌ Erro: Você não está logado${colors.reset}`)
      console.log(`${colors.yellow}Primeiro, faça login na aplicação:${colors.reset}`)
      console.log(`  http://localhost:5174`)
      process.exit(1)
    }

    console.log(`${colors.green}✅ Autenticado como: ${session.user.email}${colors.reset}`)

    // Obter organização do usuário
    console.log(`${colors.cyan}🏢 Obtendo organização...${colors.reset}`)
    const { data: membership, error: membershipError } = await supabase
      .from('user_memberships')
      .select('org_id, orgs(id, nome)')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      console.log(`${colors.red}❌ Erro: Organização não encontrada${colors.reset}`)
      console.log(`${colors.yellow}Você precisa estar em uma organização${colors.reset}`)
      process.exit(1)
    }

    const orgId = membership.org_id
    console.log(`${colors.green}✅ Organização: ${membership.orgs.nome}${colors.reset}`)

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

    if (!integration) {
      console.log(`${colors.yellow}⚠️  Integração não encontrada, criando...${colors.reset}`)
      const { error: createError } = await supabase
        .from('integrations')
        .insert({
          org_id: orgId,
          provider: 'google_calendar',
          name: 'Google Calendar',
          enabled: false,
          secrets: {},
          settings: {},
        })

      if (createError) {
        console.log(`${colors.red}❌ Erro ao criar integração: ${createError.message}${colors.reset}`)
        process.exit(1)
      }

      const { data: newIntegration } = await supabase
        .from('integrations')
        .select('*')
        .eq('org_id', orgId)
        .eq('provider', 'google_calendar')
        .maybeSingle()

      if (!newIntegration) {
        console.log(`${colors.red}❌ Erro ao recuperar integração criada${colors.reset}`)
        process.exit(1)
      }

      console.log(`${colors.green}✅ Integração criada${colors.reset}`)

      // Agora inicia o fluxo OAuth
      console.log(`${colors.cyan}\n🚀 Iniciando vinculação com Google...${colors.reset}`)
      const returnTo = `http://localhost:5174/app/config`
      const oauthUrl = new URL(
        `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`,
      )
      oauthUrl.searchParams.set('integration_id', newIntegration.id)
      oauthUrl.searchParams.set('org_id', orgId)
      oauthUrl.searchParams.set('return_to', returnTo)

      console.log(`${colors.green}✅ Abra este link no navegador:${colors.reset}`)
      console.log(`${oauthUrl.toString()}\n`)
      console.log(`${colors.yellow}Ou acesse Configurações → Google Calendar → Vincular${colors.reset}`)
    } else {
      // Integração já existe
      if (integration.enabled && integration.secrets?.access_token) {
        console.log(`${colors.green}✅ Google Calendar JÁ ESTÁ CONECTADO!${colors.reset}`)
        console.log(`   Última sincronização: ${integration.settings?.last_sync_at || 'nunca'}`)
      } else {
        console.log(`${colors.yellow}⚠️  Integração existe mas não está conectada${colors.reset}`)
        const returnTo = `http://localhost:5174/app/config`
        const oauthUrl = new URL(
          `${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar-oauth`,
        )
        oauthUrl.searchParams.set('integration_id', integration.id)
        oauthUrl.searchParams.set('org_id', orgId)
        oauthUrl.searchParams.set('return_to', returnTo)

        console.log(`${colors.cyan}\n🚀 Iniciando vinculação com Google...${colors.reset}`)
        console.log(`${colors.green}✅ Abra este link no navegador:${colors.reset}`)
        console.log(`${oauthUrl.toString()}\n`)
        console.log(`${colors.yellow}Ou acesse Configurações → Google Calendar → Vincular${colors.reset}`)
      }
    }

    console.log(`
${colors.green}${colors.bold}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PRONTO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.reset}

${colors.cyan}Próximos passos:${colors.reset}
  1. Se pedido, autorize o acesso ao Google
  2. Você será redirecionado para Configurações
  3. Volte para a Agenda
  4. Preencha: Título, Data, Hora
  5. Clique: "Gerar Google Meet" 🎉
`)
  } catch (err) {
    console.error(`${colors.red}Erro inesperado:${colors.reset}`, err.message)
    process.exit(1)
  }
}

main()
