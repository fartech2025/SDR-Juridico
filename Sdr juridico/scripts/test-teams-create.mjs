#!/usr/bin/env node

/**
 * Script de teste para validar implementação do Teams
 * Verifica se todos os arquivos foram criados e configurados corretamente
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

const requiredFiles = [
  // Hooks
  'src/hooks/useTeamsMeetingCreate.ts',
  'src/hooks/useTeamsSync.ts',

  // Componentes
  'src/components/MeetingCreatorForm.tsx',
  'src/components/TeamsQuickCreate.tsx',
  'src/components/ui/TeamsIntegrationWidget.tsx',

  // Edge Functions
  'supabase/functions/teams-create-event/index.ts',
  'supabase/functions/teams-oauth/index.ts',
]

async function validateFiles() {
  console.log('🔍 Validando arquivos do Teams...\n')

  let allValid = true

  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file)
    try {
      await fs.access(filePath)
      console.log(`✅ ${file}`)
    } catch {
      console.log(`❌ ${file}`)
      allValid = false
    }
  }

  return allValid
}

async function validatePackageJson() {
  console.log('\n📦 Validando scripts no package.json...\n')

  const pkgPath = path.join(rootDir, 'package.json')
  const content = await fs.readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(content)

  const requiredScripts = ['deploy:teams-create', 'test:teams-create', 'setup:teams']

  let allValid = true

  for (const script of requiredScripts) {
    if (pkg.scripts[script]) {
      console.log(`✅ Script "${script}" configurado`)
    } else {
      console.log(`❌ Script "${script}" não encontrado`)
      allValid = false
    }
  }

  return allValid
}

async function validateImports() {
  console.log('\n📋 Validando imports nos arquivos...\n')

  const testFiles = [
    { file: 'src/hooks/useTeamsMeetingCreate.ts', imports: ['@/lib/supabaseClient', '@/lib/org'] },
    { file: 'src/components/MeetingCreatorForm.tsx', imports: ['useTeamsMeetingCreate'] },
    { file: 'src/components/TeamsQuickCreate.tsx', imports: ['useTeamsMeetingCreate', 'lucide-react'] },
  ]

  let allValid = true

  for (const test of testFiles) {
    const filePath = path.join(rootDir, test.file)
    const content = await fs.readFile(filePath, 'utf-8')

    let fileValid = true
    for (const imp of test.imports) {
      if (content.includes(imp)) {
        console.log(`✅ ${test.file} - import "${imp}"`)
      } else {
        console.log(`❌ ${test.file} - import "${imp}" não encontrado`)
        fileValid = false
        allValid = false
      }
    }
  }

  return allValid
}

async function main() {
  console.log('🧪 Teste de Implementação do Teams\n')
  console.log('=' + '='.repeat(49) + '\n')

  const filesValid = await validateFiles()
  const pkgValid = await validatePackageJson()
  const importsValid = await validateImports()

  console.log('\n' + '='.repeat(50))

  if (filesValid && pkgValid && importsValid) {
    console.log('\n✅ Todos os testes passaram!\n')
    console.log('Próximos passos:')
    console.log('1. Configurar variáveis de ambiente do Microsoft Teams')
    console.log('   - MICROSOFT_CLIENT_ID')
    console.log('   - MICROSOFT_CLIENT_SECRET')
    console.log('')
    console.log('2. Fazer deploy das Edge Functions:')
    console.log('   npm run deploy:teams-create')
    console.log('')
    console.log('3. Integrar no componente de agenda:')
    console.log('   import { MeetingCreatorForm } from "@/components/MeetingCreatorForm"')
    console.log('   import { TeamsQuickCreate } from "@/components/TeamsQuickCreate"')
    console.log('')
    console.log('4. Usar o widget de configuração:')
    console.log('   import { TeamsIntegrationWidget } from "@/components/ui/TeamsIntegrationWidget"')
    process.exit(0)
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique os erros acima.\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Erro:', error.message)
  process.exit(1)
})
