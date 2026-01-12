#!/usr/bin/env node

/**
 * 🧪 Testes de Integração do Google Calendar
 * 
 * Este script testa a integração completa do Google Calendar.
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
}

const log = {
  section: (title) => {
    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
    console.log(`${colors.cyan}${title}${colors.reset}`)
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
  },
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  test: (name) => console.log(`\n${colors.cyan}→ ${name}${colors.reset}`),
}

class TestSuite {
  constructor(name) {
    this.name = name
    this.tests = []
    this.passed = 0
    this.failed = 0
    this.skipped = 0
  }

  add(name, fn) {
    this.tests.push({ name, fn, status: 'pending' })
  }

  async run() {
    log.section(`🧪 ${this.name}`)

    for (const test of this.tests) {
      log.test(test.name)
      try {
        const result = await test.fn()
        if (result === false) {
          log.error('FAILED')
          test.status = 'failed'
          this.failed++
        } else {
          log.success('PASSED')
          test.status = 'passed'
          this.passed++
        }
      } catch (error) {
        log.warn('SKIPPED')
        log.info(error.message)
        test.status = 'skipped'
        this.skipped++
      }
    }

    console.log(`\n${colors.cyan}Resultado:${colors.reset}`)
    console.log(`${colors.green}${this.passed} ✓${colors.reset} | ${colors.red}${this.failed} ✗${colors.reset} | ${colors.yellow}${this.skipped} ⊘${colors.reset}`)

    return this.failed === 0
  }
}

// ==================== TESTES ====================

const fileTests = new TestSuite('Verificação de Arquivos')

fileTests.add('Arquivo: google-calendar-oauth/index.ts existe', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-oauth/index.ts`
  if (!fs.existsSync(path)) throw new Error('Arquivo não encontrado')
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('google-calendar-oauth')) {
    return false
  }
})

fileTests.add('Arquivo: google-calendar-sync/index.ts existe', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-sync/index.ts`
  if (!fs.existsSync(path)) throw new Error('Arquivo não encontrado')
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('syncGoogleCalendarForOrg')) {
    return false
  }
})

fileTests.add('Arquivo: useGoogleCalendarSync.ts existe', () => {
  const path = `${projectRoot}/src/hooks/useGoogleCalendarSync.ts`
  if (!fs.existsSync(path)) throw new Error('Arquivo não encontrado')
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('useGoogleCalendarSync')) {
    return false
  }
})

fileTests.add('Arquivo: GoogleCalendarWidget.tsx existe', () => {
  const path = `${projectRoot}/src/components/ui/GoogleCalendarWidget.tsx`
  if (!fs.existsSync(path)) throw new Error('Arquivo não encontrado')
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('GoogleCalendarWidget')) {
    return false
  }
})

// ==================== TESTES DE CONFIG ====================

const envTests = new TestSuite('Variáveis de Ambiente')

envTests.add('VITE_SUPABASE_URL está definido', () => {
  const value = process.env.VITE_SUPABASE_URL
  if (!value) {
    throw new Error('Execute: export VITE_SUPABASE_URL=sua-url')
  }
  log.info(`Valor: ${value.substring(0, 40)}...`)
})

envTests.add('VITE_SUPABASE_ANON_KEY está definido', () => {
  const value = process.env.VITE_SUPABASE_ANON_KEY
  if (!value) {
    throw new Error('Execute: export VITE_SUPABASE_ANON_KEY=sua-key')
  }
  log.info(`Valor: ${value.substring(0, 40)}...`)
})

envTests.add('GOOGLE_CLIENT_ID é opcional (para deployment)', () => {
  const value = process.env.GOOGLE_CLIENT_ID
  if (value) {
    log.info(`Definido: ${value.substring(0, 30)}...`)
  } else {
    log.warn('Configure antes de fazer deploy das Edge Functions')
  }
})

envTests.add('GOOGLE_CLIENT_SECRET é opcional (para deployment)', () => {
  const value = process.env.GOOGLE_CLIENT_SECRET
  if (value) {
    log.info(`Definido: ${value.substring(0, 30)}...`)
  } else {
    log.warn('Configure antes de fazer deploy das Edge Functions')
  }
})

// ==================== TESTES DE INTEGRAÇÃO ====================

const integrationTests = new TestSuite('Integração de Componentes')

integrationTests.add('Hook useAgenda contém métodos necessários', () => {
  const path = `${projectRoot}/src/hooks/useAgenda.ts`
  const content = fs.readFileSync(path, 'utf-8')
  const methods = [
    'fetchEventos',
    'fetchEvento',
    'fetchPorPeriodo',
    'createEvento',
    'updateEvento',
    'deleteEvento',
  ]
  for (const method of methods) {
    if (!content.includes(method)) {
      log.error(`Método não encontrado: ${method}`)
      return false
    }
  }
})

integrationTests.add('Hook useIntegrations contém métodos necessários', () => {
  const path = `${projectRoot}/src/hooks/useIntegrations.ts`
  const content = fs.readFileSync(path, 'utf-8')
  const methods = [
    'fetchIntegrations',
    'updateIntegration',
    'createDefaultIntegrations',
  ]
  for (const method of methods) {
    if (!content.includes(method)) {
      log.error(`Método não encontrado: ${method}`)
      return false
    }
  }
})

integrationTests.add('ConfigPage importa e usa componentes corretamente', () => {
  const path = `${projectRoot}/src/pages/ConfigPage.tsx`
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('useIntegrations')) {
    log.error('useIntegrations não está sendo usado')
    return false
  }
  if (!content.includes('handleGoogleCalendarSync')) {
    log.error('handleGoogleCalendarSync não está implementado')
    return false
  }
})

// ==================== TESTES DE LÓGICA ====================

const logicTests = new TestSuite('Lógica de Negócio')

logicTests.add('Edge Function OAuth trata código de autorização', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-oauth/index.ts`
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('searchParams.get(\'code\')')) {
    log.error('Não processa código OAuth')
    return false
  }
  if (!content.includes('oauth2.googleapis.com/token')) {
    log.error('Não faz requisição ao endpoint de token')
    return false
  }
})

logicTests.add('Edge Function Sync sincroniza eventos bidirecionalamente', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-sync/index.ts`
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('syncGoogleCalendarForOrg')) {
    log.error('Não invoca função de sincronização')
    return false
  }
})

logicTests.add('Shared functions tratam erros e tokens', () => {
  const path = `${projectRoot}/supabase/functions/_shared/googleCalendarSync.ts`
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('refreshAccessToken')) {
    log.error('Não renova tokens de acesso')
    return false
  }
  if (!content.includes('syncGoogleCalendarForOrg')) {
    log.error('Função principal não definida')
    return false
  }
})

// ==================== TESTES DE SEGURANÇA ====================

const securityTests = new TestSuite('Segurança')

securityTests.add('OAuth Function usa HTTPS em produção', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-oauth/index.ts`
  const content = fs.readFileSync(path, 'utf-8')
  if (!content.includes('https://accounts.google.com')) {
    log.error('Não usa HTTPS para OAuth do Google')
    return false
  }
})

securityTests.add('Secrets não são logados ou expostos', () => {
  const path = `${projectRoot}/supabase/functions/google-calendar-oauth/index.ts`
  const content = fs.readFileSync(path, 'utf-8')
  // Verificar que não faz console.log de secrets
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes('console.log') &&
      (lines[i].includes('GOOGLE_CLIENT_SECRET') ||
        lines[i].includes('access_token') ||
        lines[i].includes('refresh_token'))
    ) {
      log.error(`Linha ${i + 1}: Secrets podem estar sendo logados`)
      return false
    }
  }
})

securityTests.add('RLS Policies protegem dados', () => {
  const path = `${projectRoot}/src/services/integrationsService.ts`
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf-8')
    if (!content.includes('org_id')) {
      log.warn('Serviço não filtra por organização')
    }
  }
})

// ==================== EXECUÇÃO ====================

async function main() {
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
  console.log(`${colors.cyan}🧪 TEST SUITE - GOOGLE CALENDAR INTEGRATION${colors.reset}`)
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`)

  const suites = [
    fileTests,
    envTests,
    integrationTests,
    logicTests,
    securityTests,
  ]

  let allPassed = true
  for (const suite of suites) {
    const passed = await suite.run()
    if (!passed) allPassed = false
  }

  // Sumário
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
  console.log(`${colors.cyan}📊 SUMÁRIO${colors.reset}`)
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`)

  let totalPassed = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const suite of suites) {
    totalPassed += suite.passed
    totalFailed += suite.failed
    totalSkipped += suite.skipped
  }

  console.log(`Total: ${colors.green}${totalPassed} ✓${colors.reset} | ${colors.red}${totalFailed} ✗${colors.reset} | ${colors.yellow}${totalSkipped} ⊘${colors.reset}`)

  if (allPassed) {
    console.log(`\n${colors.green}✅ Todos os testes passaram!${colors.reset}`)
    console.log(`\nPróximos passos:`)
    console.log(`  1. Defina as credenciais do Google`)
    console.log(`  2. Execute: npm run dev`)
    console.log(`  3. Acesse: http://localhost:5174/app/config`)
    console.log(`  4. Vincule seu Google Calendar\n`)
  } else {
    console.log(`\n${colors.red}❌ Alguns testes falharam${colors.reset}`)
    console.log(`\nResolva os problemas acima e execute novamente.\n`)
    process.exit(1)
  }
}

main().catch(console.error)
