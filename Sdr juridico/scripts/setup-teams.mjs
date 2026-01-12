#!/usr/bin/env node

/**
 * Script interativo de setup da integração com Microsoft Teams
 * Guia passo a passo para configurar a integração
 */

import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (q) => new Promise((resolve) => rl.question(q, resolve))

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     🚀 Guia de Configuração - Microsoft Teams       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Este guia irá ajudá-lo a configurar a integração do Microsoft Teams
com sua aplicação.

`)

async function main() {
  // Passo 1: Registrar aplicação no Azure
  console.log(`
📋 PASSO 1: Registre sua aplicação no Azure Active Directory

1. Acesse: https://portal.azure.com/
2. Vá para: Azure Active Directory → App Registrations → New Registration
3. Preenchimento:
   - Name: "Agenda + Teams Integration"
   - Supported account types: "Accounts in this organizational directory"
   - Redirect URI: "Web" com valor
     https://seu-projeto.supabase.co/functions/v1/teams-oauth

4. Clique em "Register"

`)

  await question('Pressione ENTER após registrar a aplicação...')

  // Passo 2: Obter credenciais
  console.log(`
📋 PASSO 2: Obtenha as credenciais

1. Na página da aplicação, vá para: Certificates & Secrets
2. Clique em "New client secret"
3. Descrição: "Agenda Teams Integration"
4. Expira em: "24 months" (ou escolha outro período)
5. Copie o valor do secret

6. Volte à página Overview e copie:
   - Application (client) ID
   - Directory (tenant) ID (use "common" para multitenancy)

`)

  const clientId = await question('Cole o Application (client) ID: ')
  const clientSecret = await question('Cole o Client Secret (será ocultado): ')

  // Passo 3: Configurar permissões
  console.log(`
📋 PASSO 3: Configure as permissões da API

1. Na página da aplicação, vá para: API Permissions
2. Clique em "Add a permission" → "Microsoft Graph"
3. Selecione "Delegated permissions"
4. Procure e adicione:
   ✅ Calendars.ReadWrite
   ✅ offline_access
   ✅ User.Read
5. Clique em "Grant admin consent for [sua org]"

`)

  await question('Pressione ENTER após configurar as permissões...')

  // Passo 4: Configurar no Supabase
  console.log(`
📋 PASSO 4: Configure as variáveis de ambiente no Supabase

1. Acesse o Supabase Dashboard
2. Vá para: Project Settings → Edge Functions → Secrets/Env Variables
3. Adicione as seguintes variáveis:

   Nome: MICROSOFT_CLIENT_ID
   Valor: ${clientId}

   Nome: MICROSOFT_CLIENT_SECRET
   Valor: ${clientSecret}

   Nome: VITE_MICROSOFT_CLIENT_ID
   Valor: ${clientId}

4. Salve as variáveis

`)

  // Passo 5: Fazer deploy
  console.log(`
📋 PASSO 5: Faça o deploy das Edge Functions

Execute no terminal:
$ npm run deploy:teams-create

`)

  // Passo 6: Adicionar ao banco de dados
  console.log(`
📋 PASSO 6: Adicione a integração ao banco de dados

Execute a seguinte query no Supabase SQL Editor:

INSERT INTO integrations (org_id, provider, access_token, refresh_token, expires_at, is_active)
SELECT 
  (SELECT id FROM organizations WHERE id = 'seu-org-id' LIMIT 1),
  'teams',
  '',
  '',
  NOW(),
  FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM integrations 
  WHERE org_id = 'seu-org-id' AND provider = 'teams'
);

Substitua 'seu-org-id' pelo ID real da sua organização.

`)

  // Passo 7: Usar a integração
  console.log(`
📋 PASSO 7: Use a integração na sua aplicação

Exemplo 1 - Criar reunião rápida:
import { TeamsQuickCreate } from '@/components/TeamsQuickCreate'

<TeamsQuickCreate 
  onSuccess={(result) => console.log('Reunião criada:', result)}
  onError={(error) => console.error('Erro:', error)}
/>

Exemplo 2 - Formulário completo:
import { MeetingCreatorForm } from '@/components/MeetingCreatorForm'

<MeetingCreatorForm
  onSuccess={(result) => console.log('Reunião criada:', result)}
  onError={(error) => console.error('Erro:', error)}
  agendaData={{ /* dados adicionais */ }}
/>

Exemplo 3 - Widget de configuração:
import { TeamsIntegrationWidget } from '@/components/ui/TeamsIntegrationWidget'

<TeamsIntegrationWidget />

`)

  // Passo 8: Testar
  console.log(`
📋 PASSO 8: Teste a integração

1. Execute: npm run dev
2. Navegue até a página de agenda
3. Clique em "Conectar ao Teams"
4. Autorize o acesso à sua conta Microsoft
5. Crie uma reunião para testar

Para validar a implementação:
$ npm run test:teams-create

`)

  // Conclusão
  console.log(`
✅ CONFIGURAÇÃO CONCLUÍDA!

Sua integração com Microsoft Teams está pronta para usar.

Documentação completa disponível em:
- README_TEAMS_INTEGRATION.md
- TEAMS_SETUP_GUIDE.md

Dúvidas? Consulte:
- Microsoft Graph API Docs: https://docs.microsoft.com/graph
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

`)

  rl.close()
}

main().catch((error) => {
  console.error('Erro:', error.message)
  process.exit(1)
})
