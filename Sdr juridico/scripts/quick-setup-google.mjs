#!/usr/bin/env node

/**
 * 🚀 Quick Setup - Google Calendar Credentials
 * 
 * Configure rapidamente as credenciais do Google Calendar
 * Uso: node scripts/quick-setup-google.mjs
 */

import readline from 'readline'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

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
  console.clear()
  console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════════════════════╗
║   🚀 SETUP RÁPIDO - CREDENCIAIS GOOGLE CALENDAR               ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

  console.log(`
${colors.yellow}📋 Você precisa ter as seguintes informações:${colors.reset}

  1. Client ID (do Google Cloud Console)
  2. Client Secret (do Google Cloud Console)

${colors.cyan}Não tem? Siga estes passos:${colors.reset}
  → https://console.cloud.google.com/
  → Crie um novo projeto
  → Ative "Google Calendar API"
  → APIs & Services → Credentials
  → Create Credentials → OAuth 2.0 Client ID
  → Application type: Web application
  → Autorize os URIs de redirecionamento:
    - http://localhost:5174/app/config
    - https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
  → Copie o Client ID e Client Secret

${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`)

  // Perguntar pelas credenciais
  const clientId = await question(
    `${colors.cyan}➜${colors.reset} Cole seu Google Client ID: `,
  )
  if (!clientId.trim()) {
    console.log(`${colors.red}❌ Client ID vazio!${colors.reset}`)
    process.exit(1)
  }

  const clientSecret = await question(
    `${colors.cyan}➜${colors.reset} Cole seu Google Client Secret: `,
  )
  if (!clientSecret.trim()) {
    console.log(`${colors.red}❌ Client Secret vazio!${colors.reset}`)
    process.exit(1)
  }

  // Perguntar se quer configurar localmente
  const setupLocal = await question(
    `${colors.cyan}➜${colors.reset} Configurar localmente (.env)? (s/n): `,
  )

  if (setupLocal.toLowerCase() === 's') {
    const envPath = path.resolve(process.cwd(), '.env.local')

    let envContent = ''
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8')
    }

    // Atualizar ou adicionar as variáveis
    const envVars = [
      { key: 'GOOGLE_CLIENT_ID', value: clientId.trim() },
      { key: 'GOOGLE_CLIENT_SECRET', value: clientSecret.trim() },
    ]

    envVars.forEach(({ key, value }) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        envContent += `\n${key}=${value}`
      }
    })

    fs.writeFileSync(envPath, envContent.trim() + '\n')
    console.log(`${colors.green}✅ Salvo em .env.local${colors.reset}`)
  }

  // Perguntar se quer fazer deploy
  const deployFunctions = await question(
    `${colors.cyan}➜${colors.reset} Fazer deploy das Edge Functions? (s/n): `,
  )

  if (deployFunctions.toLowerCase() === 's') {
    console.log(`${colors.yellow}\n🚀 Fazendo deploy...${colors.reset}`)

    const env = {
      ...process.env,
      GOOGLE_CLIENT_ID: clientId.trim(),
      GOOGLE_CLIENT_SECRET: clientSecret.trim(),
    }

    const functions = [
      'google-calendar-oauth',
      'google-calendar-sync',
      'google-calendar-sync-cron',
      'google-calendar-create-event',
    ]

    for (const func of functions) {
      try {
        console.log(`  → Deploy: ${func}...`)
        execSync(
          `npx supabase functions deploy ${func} --project-ref xocqcoebreoiaqxoutar`,
          { env, stdio: 'pipe' },
        )
        console.log(`    ${colors.green}✅${colors.reset}`)
      } catch (err) {
        console.log(
          `    ${colors.red}❌ Erro${colors.reset} (tente manualmente)`,
        )
      }
    }
  }

  console.log(`
${colors.green}${colors.bold}✅ SETUP CONCLUÍDO!${colors.reset}

${colors.cyan}Próximos passos:${colors.reset}
  1. Inicie o servidor: npm run dev
  2. Acesse: http://localhost:5174/app/config
  3. Procure por "Google Calendar"
  4. Clique em "Vincular Google Calendar"
  5. Autorize o acesso ao seu Google
  6. Retorne para a Agenda e tente gerar um Google Meet!

${colors.yellow}Dúvidas?${colors.reset}
  Consulte: GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md
`)

  rl.close()
}

main().catch((err) => {
  console.error(`${colors.red}Erro:${colors.reset}`, err.message)
  process.exit(1)
})
