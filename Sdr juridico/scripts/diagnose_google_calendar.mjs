#!/usr/bin/env node

/**
 * 🔍 Diagnóstico da Integração Google Calendar
 * 
 * Este script verifica se tudo está configurado corretamente para a integração.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// Cores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

const symbols = {
  check: '✅',
  cross: '❌',
  warning: '⚠️ ',
  info: 'ℹ️ ',
  arrow: '→',
}

class DiagnosticReport {
  constructor() {
    this.checks = []
    this.passed = 0
    this.failed = 0
    this.warnings = 0
  }

  addCheck(name, passed, message = '') {
    this.checks.push({ name, passed, message, type: 'check' })
    if (passed) this.passed++
    else this.failed++
  }

  addWarning(name, message = '') {
    this.checks.push({ name, passed: null, message, type: 'warning' })
    this.warnings++
  }

  addInfo(name, message = '') {
    this.checks.push({ name, passed: null, message, type: 'info' })
  }

  print() {
    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
    console.log(`${colors.cyan}🔍 DIAGNÓSTICO - GOOGLE CALENDAR INTEGRATION${colors.reset}`)
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`)

    for (const check of this.checks) {
      if (check.type === 'check') {
        const symbol = check.passed ? symbols.check : symbols.cross
        const color = check.passed ? colors.green : colors.red
        console.log(`${color}${symbol}${colors.reset} ${check.name}`)
      } else if (check.type === 'warning') {
        console.log(`${colors.yellow}${symbols.warning}${colors.reset} ${check.name}`)
      } else {
        console.log(`${colors.blue}${symbols.info}${colors.reset} ${check.name}`)
      }

      if (check.message) {
        console.log(`${colors.gray}   ${check.message}${colors.reset}`)
      }
    }

    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
    console.log(`Resultado: ${colors.green}${this.passed} ✓${colors.reset} | ${colors.red}${this.failed} ✗${colors.reset} | ${colors.yellow}${this.warnings} ⚠${colors.reset}`)
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`)

    return this.failed === 0
  }
}

async function main() {
  const report = new DiagnosticReport()

  // 1. Verificar arquivos necessários
  report.addInfo('Verificando estrutura do projeto...', '')

  const files = [
    { path: 'supabase/functions/google-calendar-oauth/index.ts', name: 'OAuth Function' },
    { path: 'supabase/functions/google-calendar-sync/index.ts', name: 'Sync Function' },
    { path: 'supabase/functions/google-calendar-sync-cron/index.ts', name: 'Cron Function' },
    { path: 'src/hooks/useIntegrations.ts', name: 'useIntegrations Hook' },
    { path: 'src/hooks/useAgenda.ts', name: 'useAgenda Hook' },
    { path: 'src/hooks/useGoogleCalendarSync.ts', name: 'useGoogleCalendarSync Hook' },
    { path: 'src/components/ui/GoogleCalendarWidget.tsx', name: 'GoogleCalendarWidget Component' },
    { path: 'src/services/agendaService.ts', name: 'agendaService' },
  ]

  for (const file of files) {
    const fullPath = path.join(projectRoot, file.path)
    const exists = fs.existsSync(fullPath)
    report.addCheck(file.name, exists, exists ? '' : `Não encontrado: ${file.path}`)
  }

  // 2. Verificar configurações de ambiente
  report.addInfo('Verificando variáveis de ambiente...', '')

  const envVars = [
    { name: 'VITE_SUPABASE_URL', required: true, display: 'Supabase URL' },
    { name: 'VITE_SUPABASE_ANON_KEY', required: true, display: 'Supabase Anon Key' },
    { name: 'GOOGLE_CLIENT_ID', required: false, display: 'Google Client ID' },
    { name: 'GOOGLE_CLIENT_SECRET', required: false, display: 'Google Client Secret' },
  ]

  for (const env of envVars) {
    const value = process.env[env.name]
    const exists = Boolean(value)
    const message = exists
      ? `${symbols.arrow} ${value.substring(0, 30)}...`
      : 'Não definido (execute: export ' + env.name + '=valor)'

    if (env.required) {
      report.addCheck(env.display, exists, message)
    } else {
      if (exists) {
        report.addCheck(env.display, true, message)
      } else {
        report.addWarning(env.display, 'Não definido - configure antes de fazer deploy')
      }
    }
  }

  // 3. Extrair Supabase Info
  report.addInfo('Analisando configuração Supabase...', '')

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  if (supabaseUrl) {
    try {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        report.addInfo('Project Reference', projectRef)

        const oauthRedirectUri = `https://${projectRef}.supabase.co/functions/v1/google-calendar-oauth`
        report.addInfo('OAuth Redirect URI', oauthRedirectUri)
      }
    } catch {
      // Ignore
    }
  }

  // 4. Verificar pacotes instalados
  report.addInfo('Verificando dependências npm...', '')

  const packageJsonPath = path.join(projectRoot, 'package.json')
  let devDeps = []
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const deps = packageJson.dependencies || {}
    const devDeps = packageJson.devDependencies || {}
    
    const required = [
      { name: '@supabase/supabase-js', version: deps['@supabase/supabase-js'] || devDeps['@supabase/supabase-js'] },
      { name: 'react', version: deps.react || devDeps.react },
      { name: 'typescript', version: deps.typescript || devDeps.typescript },
    ]

    for (const pkg of required) {
      report.addCheck(pkg.name, Boolean(pkg.version), pkg.version ? `v${pkg.version}` : '')
    }
  }

  // 5. Verificar estrutura de dados esperada
  report.addInfo('Verificando esquema esperado...', '')

  const expectedTables = [
    { name: 'integrations', columns: ['id', 'org_id', 'provider', 'enabled', 'secrets', 'settings'] },
    { name: 'agendamentos', columns: ['id', 'org_id', 'title', 'external_provider', 'external_event_id', 'meta'] },
  ]

  for (const table of expectedTables) {
    report.addInfo(
      `Tabela: ${table.name}`,
      `Espera colunas: ${table.columns.join(', ')}`
    )
  }

  // 6. Orientações próximas
  report.addInfo('Próximos passos...', '')

  const allChecked = report.print()

  if (allChecked) {
    console.log(`${colors.green}✅ Tudo está pronto para integração!${colors.reset}`)
    console.log(`\nExecute agora:`)
    console.log(`  ${colors.cyan}npm run dev${colors.reset} (para iniciar o servidor)`)
    console.log(`  Acesse: ${colors.cyan}http://localhost:5174/app/config${colors.reset}`)
    console.log(`  Clique em "Vincular Google Calendar"\n`)
  } else {
    console.log(`${colors.red}❌ Há problemas a resolver antes de continuar${colors.reset}`)
    console.log(`\nPorém, você pode:`)
    console.log(`  1. Configurar as variáveis de ambiente ausentes`)
    console.log(`  2. Fazer o deploy das Edge Functions`)
    console.log(`  3. Iniciar o servidor localmente\n`)
  }

  // Guia rápido
  console.log(`${colors.cyan}📖 GUIA RÁPIDO:${colors.reset}`)
  console.log(`
1. Configure as credenciais do Google:
   ${colors.gray}export GOOGLE_CLIENT_ID="seu-client-id"${colors.reset}
   ${colors.gray}export GOOGLE_CLIENT_SECRET="seu-client-secret"${colors.reset}

2. Faça deploy das Edge Functions:
   ${colors.gray}npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar${colors.reset}
   ${colors.gray}npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar${colors.reset}

3. Inicie o servidor:
   ${colors.gray}npm run dev${colors.reset}

4. Acesse a página de configuração:
   ${colors.gray}http://localhost:5174/app/config${colors.reset}

5. Clique em "Vincular Google Calendar" para autorizar

Para documentação completa, veja: GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md
  `)
}

main().catch(console.error)
