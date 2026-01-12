# Microsoft Teams Integration - Guia Completo

## 📋 Visão Geral

Esta integração permite que você crie reuniões no Microsoft Teams diretamente pela agenda da aplicação, com sincronização automática e geração de links para participação.

**Características:**
- ✅ Criar reuniões no Teams com um clique
- ✅ Link de participação gerado automaticamente
- ✅ Sincronização com agenda local
- ✅ Suporte a múltiplos provedores (Teams + Google)
- ✅ Salva link no campo "Local" da agenda

## 🚀 Início Rápido

### 1. Executar Setup Interativo

```bash
npm run setup:teams
```

Este comando irá guiá-lo através de:
1. Registrar aplicação no Azure AD
2. Obter credenciais (Client ID e Secret)
3. Configurar permissões da API
4. Configurar variáveis de ambiente no Supabase
5. Fazer deploy das Edge Functions
6. Adicionar integração ao banco

### 2. Configurar Variáveis de Ambiente

No Supabase Dashboard, adicione:

```
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
VITE_MICROSOFT_CLIENT_ID=seu-client-id
```

### 3. Fazer Deploy

```bash
npm run deploy:teams-create
```

## 📁 Estrutura de Arquivos

```
src/
├── hooks/
│   ├── useTeamsMeetingCreate.ts    # Hook para criar reuniões
│   └── useTeamsSync.ts             # Hook para sincronizar eventos
├── components/
│   ├── MeetingCreatorForm.tsx       # Formulário completo (Teams + Google)
│   ├── TeamsQuickCreate.tsx         # Criação rápida
│   └── ui/
│       └── TeamsIntegrationWidget.tsx # Widget de configuração

supabase/functions/
├── teams-create-event/             # Criar eventos no Teams
├── teams-oauth/                     # Autenticação OAuth
└── teams-sync/ (opcional)           # Sincronizar eventos
```

## 🔧 APIs e Hooks

### useTeamsMeetingCreate

Hook para criar reuniões no Microsoft Teams.

```typescript
const {
  isLoading,
  error,
  lastCreated,
  createMeeting,
  createMeetingAndSync,
  isConnected
} = useTeamsMeetingCreate()

// Criar reunião
const meeting = await createMeeting({
  title: "Reunião de Projeto",
  description: "Discussão sobre releases",
  startTime: new Date(),
  endTime: new Date(Date.now() + 60 * 60 * 1000),
  attendees: ["user1@example.com", "user2@example.com"]
})

// Criar e sincronizar com agenda local
const { meeting, agendaItem } = await createMeetingAndSync({
  title: "Reunião de Projeto",
  startTime: new Date(),
  endTime: new Date(),
  agendaData: {
    description: "Discussão sobre releases",
    owner_user_id: "user-id",
    caso_id: "caso-id"
  }
})
```

### useTeamsSync

Hook para gerenciar sincronização com Teams.

```typescript
const {
  isConnected,
  isLoading,
  error,
  lastSync,
  eventCount,
  link,
  sync,
  refresh
} = useTeamsSync()

// Conectar ao Teams (abre OAuth)
await link()

// Sincronizar eventos
await sync()

// Atualizar status
await refresh()
```

## 🎨 Componentes

### MeetingCreatorForm

Formulário completo para criar reuniões em Teams ou Google Calendar.

```typescript
import { MeetingCreatorForm } from '@/components/MeetingCreatorForm'

<MeetingCreatorForm
  onSuccess={(results) => {
    console.log('Reuniões criadas:', results)
    // [
    //   { provider: 'teams', meeting: {...}, agendaItem: {...} },
    //   { provider: 'google', meeting: {...}, agendaItem: {...} }
    // ]
  }}
  onError={(error) => console.error(error)}
  defaultValues={{
    title: "Reunião",
    startTime: new Date()
  }}
  agendaData={{
    description: "Descrição...",
    caso_id: "...",
    owner_user_id: "..."
  }}
/>
```

### TeamsQuickCreate

Botão para criar reuniões rápidamente.

```typescript
import { TeamsQuickCreate } from '@/components/TeamsQuickCreate'

<TeamsQuickCreate
  onSuccess={(meeting) => console.log(meeting)}
  onError={(error) => console.error(error)}
/>
```

### TeamsIntegrationWidget

Widget para configurar a integração.

```typescript
import { TeamsIntegrationWidget } from '@/components/ui/TeamsIntegrationWidget'

<TeamsIntegrationWidget />
```

## 🔐 OAuth Flow

1. Usuário clica em "Conectar ao Teams"
2. Redireciona para `login.microsoftonline.com`
3. Usuário autoriza acesso
4. Microsoft redireciona para Edge Function `teams-oauth`
5. Edge Function:
   - Troca código por token
   - Obtém dados do usuário
   - Salva integração no banco
   - Retorna sucesso
6. Janela fecha e aplicação sincroniza estado

## 📊 Fluxo de Criação de Reunião

```
Usuário preenche formulário
    ↓
useTeamsMeetingCreate.createMeeting()
    ↓
Edge Function teams-create-event
    ↓
Microsoft Graph API
    ↓
Evento criado no Teams
    ↓
Retorna joinWebUrl
    ↓
(opcional) Sincroniza com agenda local
    ↓
Salva link no campo "Local"
```

## 🧪 Testes

```bash
# Validar implementação
npm run test:teams-create

# Output esperado:
# ✅ Todos os testes passaram!
```

## 📝 Dados Salvos na Agenda

Quando uma reunião Teams é criada, a agenda armazena:

```typescript
{
  titulo: "Título da reunião",
  descricao: "Descrição...",
  data_inicio: "2025-01-12T10:00:00Z",
  data_fim: "2025-01-12T11:00:00Z",
  local: "https://teams.microsoft.com/l/meetup-join/...", // Link do Teams
  tipo: "reuniao_teams",
  external_provider: "teams",
  external_event_id: "event-id-do-teams",
  // ... outros campos
}
```

## 🔄 Sincronização Bidirecional

**Criação local → Teams:**
- Reunião criada na agenda
- Link Teams gerado automaticamente
- Link salvo no campo "Local"

**Teams → Local (opcional):**
- Função `sync()` importa eventos do Teams
- Cria ou atualiza agenda local
- Mantém referência do evento original

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Microsoft OAuth
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
VITE_MICROSOFT_CLIENT_ID=seu-client-id
```

### Permissões Necessárias

- `Calendars.ReadWrite` - Criar e editar eventos
- `offline_access` - Refresh token
- `User.Read` - Obter dados do usuário

### Edge Functions

As Edge Functions usam Deno e estão em `supabase/functions/`:

- **teams-create-event**: Cria eventos via Microsoft Graph
- **teams-oauth**: Gerencia autenticação OAuth
- **teams-sync**: Sincroniza eventos (opcional)

## 🐛 Troubleshooting

### "Integração do Teams não encontrada"

1. Certifique-se que a integração existe no banco:
```sql
SELECT * FROM integrations WHERE provider = 'teams';
```

2. Se não existir, crie:
```sql
INSERT INTO integrations (org_id, provider, is_active)
SELECT id, 'teams', FALSE
FROM organizations
WHERE id = 'seu-org-id';
```

### "Token expirado"

A Edge Function faz refresh automático quando o token expira. Se continuar:

1. Desconecte e reconecte ao Teams
2. Verifique se `refresh_token` está salvo no banco
3. Verifique permissões no Azure AD

### Link do Teams não funciona

1. Verifique se `joinWebUrl` está sendo retornado pela API
2. Teste a URL manualmente no navegador
3. Certifique-se que a reunião foi criada com sucesso no Teams

## 📚 Referências

- [Microsoft Graph API Docs](https://docs.microsoft.com/graph)
- [Teams Calendar Events](https://docs.microsoft.com/graph/api/calendar-post-events)
- [OAuth 2.0 Flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🎓 Exemplos Completos

### Integrar na página de Agenda

```typescript
import { useState } from 'react'
import { MeetingCreatorForm } from '@/components/MeetingCreatorForm'
import { TeamsIntegrationWidget } from '@/components/ui/TeamsIntegrationWidget'

export function AgendaPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Widget de configuração */}
      <TeamsIntegrationWidget />

      {/* Botão para criar reunião */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        + Nova Reunião
      </button>

      {/* Formulário */}
      {showForm && (
        <MeetingCreatorForm
          onSuccess={(results) => {
            console.log('Reuniões criadas:', results)
            setShowForm(false)
          }}
          onError={(error) => console.error(error)}
        />
      )}
    </div>
  )
}
```

### Criar ação rápida no menu

```typescript
import { TeamsQuickCreate } from '@/components/TeamsQuickCreate'

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Agenda</h1>
      <TeamsQuickCreate />
    </header>
  )
}
```

## ✅ Checklist de Implementação

- [ ] Registrar aplicação no Azure AD
- [ ] Obter Client ID e Secret
- [ ] Configurar permissões da API
- [ ] Adicionar variáveis de ambiente no Supabase
- [ ] Fazer deploy das Edge Functions
- [ ] Adicionar integração ao banco de dados
- [ ] Integrar componentes na página
- [ ] Testar criação de reunião
- [ ] Testar sincronização
- [ ] Verificar links sendo salvos

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique os logs da Edge Function no Supabase Dashboard
2. Consulte a documentação da Microsoft Graph
3. Verifique as variáveis de ambiente
4. Teste a integração com `npm run test:teams-create`
