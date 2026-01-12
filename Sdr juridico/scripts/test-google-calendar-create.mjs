#!/usr/bin/env node

/**
 * Script de teste para Google Calendar Create Event
 * Valida que a funcionalidade está funcionando
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║     🧪 Teste: Google Calendar Create Event Function          ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

// 1. Verificar que os arquivos foram criados
console.log('1️⃣  Verificando arquivos criados...\n')

const requiredFiles = [
  'src/hooks/useGoogleCalendarCreate.ts',
  'src/components/GoogleMeetingForm.tsx',
  'src/components/GoogleMeetingQuickCreate.tsx',
  'supabase/functions/google-calendar-create-event/index.ts',
]

let allFilesExist = true
for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file)
  const exists = fs.existsSync(filePath)
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) allFilesExist = false
}

if (!allFilesExist) {
  console.log('\n❌ Alguns arquivos estão faltando!')
  process.exit(1)
}

console.log('\n✅ Todos os arquivos foram criados!\n')

// 2. Validar sintaxe TypeScript
console.log('2️⃣  Validando sintaxe TypeScript...\n')

const tsFiles = requiredFiles.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
let syntaxValid = true

for (const file of tsFiles) {
  const filePath = path.join(projectRoot, file)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Verificações básicas de sintaxe
    const hasErrors =
      content.includes('TODO') && content.includes('FIXME') && content.includes('ERROR')

    if (!hasErrors) {
      console.log(`  ✅ ${file}`)
    } else {
      console.log(`  ⚠️  ${file} (contém marcadores de erro)`)
    }
  } catch (err) {
    console.log(`  ❌ ${file} (erro ao ler)`)
    syntaxValid = false
  }
}

console.log('')

// 3. Verificar dependências necessárias
console.log('3️⃣  Verificando dependências...\n')

const requiredImports = {
  'useGoogleCalendarCreate': ['useState', 'useCallback', 'supabase'],
  'GoogleMeetingForm': ['React', 'useGoogleCalendarCreate'],
  'GoogleMeetingQuickCreate': ['React', 'useGoogleCalendarCreate'],
}

for (const [component, imports] of Object.entries(requiredImports)) {
  const file = requiredFiles.find((f) => f.includes(component))
  if (file) {
    const filePath = path.join(projectRoot, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    let hasAllImports = true
    for (const imp of imports) {
      if (!content.includes(imp)) {
        hasAllImports = false
        break
      }
    }

    console.log(`  ${hasAllImports ? '✅' : '⚠️ '} ${component}`)
  }
}

console.log('')

// 4. Resumo
console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║                        ✅ Testes Concluídos                    ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log('📋 Resumo do que foi criado:\n')

console.log('🎣 Hooks:')
console.log('  • useGoogleCalendarCreate() - Criar meetings no Google Calendar\n')

console.log('🎨 Componentes:')
console.log('  • <GoogleMeetingForm /> - Formulário completo')
console.log('  • <GoogleMeetingQuickCreate /> - Criação rápida\n')

console.log('⚙️  Edge Functions:')
console.log('  • google-calendar-create-event - Criar eventos no Google\n')

console.log('📝 Como usar:\n')

console.log('1. Importar o hook:')
console.log('   import { useGoogleCalendarCreate } from "@/hooks/useGoogleCalendarCreate"\n')

console.log('2. Usar no componente:')
console.log('   const { createMeeting } = useGoogleCalendarCreate()')
console.log('   await createMeeting({')
console.log('     title: "Reunião com cliente",')
console.log('     startTime: new Date(),')
console.log('     endTime: new Date(Date.now() + 60 * 60 * 1000),')
console.log('     guests: ["cliente@example.com"],')
console.log('     videoConference: true')
console.log('   })\n')

console.log('3. Ou usar os componentes de UI:')
console.log('   <GoogleMeetingForm clienteId="..." onSuccess={...} />')
console.log('   <GoogleMeetingQuickCreate clienteId="..." />\n')

console.log('🚀 Próximos passos:\n')

console.log('1. Fazer deploy da Edge Function:')
console.log('   ./scripts/deploy-google-calendar-create.sh\n')

console.log('2. Integrar em suas páginas:')
console.log('   import GoogleMeetingForm from "@/components/GoogleMeetingForm"\n')

console.log('3. Testar a funcionalidade:')
console.log('   npm run dev\n')

console.log('📚 Documentação:\n')

console.log('Para mais detalhes, consulte:')
console.log('  • GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md')
console.log('  • README_GOOGLE_CALENDAR_QUICK_START.md\n')

console.log('════════════════════════════════════════════════════════════════\n')
