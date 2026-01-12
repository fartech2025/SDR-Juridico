# 📅 Google Calendar - Criar Meetings

## ✅ O que foi criado

Uma solução **completa** para criar Google Meetings (reuniões com Google Meet) diretamente dentro do seu sistema, sincronizando automaticamente com a agenda local.

### 📦 Arquivos Criados

#### 1. **Hook React** (`src/hooks/useGoogleCalendarCreate.ts`)
```typescript
const { createMeeting, createMeetingAndSync, isLoading, error } = useGoogleCalendarCreate()
```

**Funções:**
- `createMeeting()` - Criar evento no Google Calendar
- `createMeetingAndSync()` - Criar e sincronizar com agenda local
- `isConnected()` - Verificar se Google Calendar está vinculado
- `isLoading` - Estado de carregamento
- `error` - Mensagens de erro
- `lastCreated` - Último evento criado

#### 2. **Componentes React**

**GoogleMeetingForm** (`src/components/GoogleMeetingForm.tsx`)
- Formulário completo para criar meetings
- Campos: título, descrição, data/hora, local, convidados
- Opção de criar Google Meet automaticamente
- Gerenciar lista de convidados

```tsx
<GoogleMeetingForm 
  clienteId="..." 
  casoId="..." 
  onSuccess={(result) => console.log(result)}
/>
```

**GoogleMeetingQuickCreate** (`src/components/GoogleMeetingQuickCreate.tsx`)
- Botão para criar meeting rápido
- Dialog com formulário minimalista
- Ideal para ações rápidas

```tsx
<GoogleMeetingQuickCreate clienteId="..." />
```

#### 3. **Edge Function** (`supabase/functions/google-calendar-create-event/index.ts`)
- Cria eventos no Google Calendar
- Renova tokens automaticamente
- Cria Google Meet se solicitado
- Armazena securely no Supabase

#### 4. **Scripts**

**Deploy** (`scripts/deploy-google-calendar-create.sh`)
```bash
./scripts/deploy-google-calendar-create.sh
```

**Testes** (`scripts/test-google-calendar-create.mjs`)
```bash
npm run test:google-calendar-create
```

### 📋 Scripts NPM Adicionados

```json
{
  "deploy:google-calendar-create": "bash scripts/deploy-google-calendar-create.sh",
  "test:google-calendar-create": "node scripts/test-google-calendar-create.mjs"
}
```

## 🚀 Como Usar

### 1. Verificar Credenciais

Garantir que GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET estão configurados:

```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

Se não estiverem, adicione no Supabase Dashboard:
1. Acesse: Settings → Edge Function Secrets
2. Adicione:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

### 2. Fazer Deploy da Function

```bash
# Exportar credenciais
export GOOGLE_CLIENT_ID="seu-id"
export GOOGLE_CLIENT_SECRET="seu-secret"

# Deploy
npm run deploy:google-calendar-create
```

### 3. Usar em Seus Componentes

#### Opção 1: Hook Direto

```tsx
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'

function MeuComponente() {
  const { createMeeting, isLoading, error } = useGoogleCalendarCreate()

  const handleCreate = async () => {
    try {
      const result = await createMeeting({
        title: 'Reunião com cliente',
        description: 'Discussão do caso',
        startTime: new Date('2026-01-20 14:00'),
        endTime: new Date('2026-01-20 15:00'),
        guests: ['cliente@example.com'],
        videoConference: true,
        location: 'Google Meet'
      })
      
      console.log('Meeting criado:', result.id)
      console.log('Link Google Meet:', result.conferenceData?.entryPoints?.[0]?.uri)
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Criando...' : 'Criar Reunião'}
    </button>
  )
}
```

#### Opção 2: Componente Completo

```tsx
import GoogleMeetingForm from '@/components/GoogleMeetingForm'

function PaginaAgendamento() {
  return (
    <GoogleMeetingForm 
      clienteId="123"
      casoId="456"
      responsavelId="789"
      onSuccess={(result) => {
        console.log('Meeting criado com sucesso!')
        console.log('ID:', result.googleEventId)
        console.log('Link:', result.meetUrl)
      }}
      onError={(error) => {
        console.error('Erro:', error.message)
      }}
    />
  )
}
```

#### Opção 3: Quick Create

```tsx
import GoogleMeetingQuickCreate from '@/components/GoogleMeetingQuickCreate'

function BarraAcoes() {
  return (
    <div className="flex gap-2">
      <GoogleMeetingQuickCreate 
        clienteId="123"
        onSuccess={(meetUrl) => {
          navigator.clipboard.writeText(meetUrl)
          alert('Link copiado!')
        }}
      />
    </div>
  )
}
```

### 4. Integrar na Página de Agendamentos

Exemplo prático para integrar em uma página de agendamentos:

```tsx
import { useState } from 'react'
import GoogleMeetingForm from '@/components/GoogleMeetingForm'
import GoogleMeetingQuickCreate from '@/components/GoogleMeetingQuickCreate'

export function AgendamentosPage() {
  const [meeting, setMeeting] = useState(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <GoogleMeetingQuickCreate onSuccess={() => location.reload()} />
      </div>

      {/* Formulário */}
      {meeting ? (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h2 className="font-bold text-green-700">✅ Reunião Criada!</h2>
          <p className="text-sm text-green-600 mt-2">
            <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
              Acessar Google Meet →
            </a>
          </p>
        </div>
      ) : (
        <GoogleMeetingForm 
          onSuccess={(result) => setMeeting(result)}
        />
      )}
    </div>
  )
}
```

## 🎯 Interface de Dados

### GoogleMeetingInput

```typescript
interface GoogleMeetingInput {
  title: string                              // Título obrigatório
  description?: string                       // Descrição opcional
  startTime: Date                           // Início obrigatório
  endTime: Date                             // Fim obrigatório
  guests?: string[]                         // Lista de emails
  videoConference?: boolean                 // Criar Google Meet?
  location?: string                         // Local/endereço
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}
```

### CreatedGoogleMeeting (Resultado)

```typescript
{
  id: string                    // ID do evento no Google
  summary: string               // Título
  htmlLink: string              // Link para evento
  conferenceData?: {
    entryPoints: [{
      entryPointType: string    // 'video' para Google Meet
      uri: string               // Link do Google Meet
      label?: string
    }]
  }
  attendees?: [{
    email: string
    responseStatus: string      // 'accepted', 'declined', 'tentative'
  }]
}
```

## 🔄 Fluxo de Sincronização

```
┌─────────────────────────────────────────┐
│  Clicar em "Criar Reunião"              │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Preencher formulário                   │
│  - Título, data, hora                   │
│  - Convidados                           │
│  - Google Meet? SIM/NÃO                 │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Clicar em "Criar Reunião"              │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Edge Function: create-event            │
│  - Validar Google Calendar conectado    │
│  - Renovar token se necessário          │
│  - Criar evento no Google Calendar      │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Google Calendar                        │
│  ✅ Evento criado                       │
│  ✅ Google Meet criado (se solicitado)  │
│  ✅ Convites enviados                   │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Salvar na Agenda Local (Supabase)      │
│  - Tabela: agendamentos                 │
│  - Link Google Meet armazenado          │
│  - Sincronização bidirecional ativa     │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  ✅ Sucesso!                            │
│  - Mostrar link do Google Meet          │
│  - Opção de copiar para clipboard       │
│  - Atualizar agenda                     │
└─────────────────────────────────────────┘
```

## 🔐 Segurança

- ✅ **OAuth 2.0** - Autorização segura
- ✅ **Tokens renovados automaticamente** - Validade controlada
- ✅ **RLS (Row Level Security)** - Dados por organização
- ✅ **Secrets no Supabase** - Credenciais seguras
- ✅ **CORS configurado** - Apenas origens autorizadas

## 🐛 Troubleshooting

### "Google Calendar não conectado"

```
Solução: Vincule sua conta na página de configurações
→ Settings → Google Calendar → "Vincular Google Calendar"
```

### "Token expirado"

```
Solução: Token é renovado automaticamente
Se erro persiste: Desconecte e reconecte
```

### "Erro ao criar evento"

```
Verificar:
1. Credenciais (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. Edge Function deployada
3. Supabase funções ativas
4. Logs: npm run diagnose:google-calendar
```

## 📊 Exemplos Completos

### Criar Meeting em Processo Jurídico

```tsx
async function criarReuniaoCom(cliente) {
  const { createMeetingAndSync } = useGoogleCalendarCreate()

  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(14, 0, 0, 0)

  const fim = new Date(amanha)
  fim.setHours(15, 0, 0, 0)

  const result = await createMeetingAndSync({
    title: `Reunião com ${cliente.nome}`,
    description: `Discussão do caso: ${cliente.casoTitulo}`,
    startTime: amanha,
    endTime: fim,
    guests: [cliente.email],
    videoConference: true,
    location: 'Google Meet'
  }, {
    tipo: 'reuniao_cliente',
    cliente_id: cliente.id,
    caso_id: cliente.casoId,
    responsavel_id: usuarioAtual.id
  })

  return result
}
```

### Enviar Link por Email

```tsx
async function criarReuniaoeEnviar(convidados) {
  const { createMeeting } = useGoogleCalendarCreate()

  const resultado = await createMeeting({
    title: 'Reunião de Planejamento',
    startTime: new Date('2026-01-20 14:00'),
    endTime: new Date('2026-01-20 15:00'),
    guests: convidados.map(c => c.email),
    videoConference: true
  })

  const meetUrl = resultado.conferenceData?.entryPoints?.[0]?.uri

  // Enviar email com link
  await enviarEmail({
    para: convidados,
    assunto: 'Convite: Reunião de Planejamento',
    corpo: `
      Você está convidado para uma reunião.
      
      Data: 20 de Janeiro de 2026, 14:00
      Link: ${meetUrl}
    `
  })
}
```

## 📞 Próximas Melhorias

- [ ] Integrar com calendários dos clientes
- [ ] Sincronização de atualizações (editar/deletar)
- [ ] Notificações de confirmação
- [ ] Recurrências (reuniões periódicas)
- [ ] Salas de vídeo personalizadas
- [ ] Integração com CRM

## ✅ Checklist de Implementação

- [x] Hook React criado
- [x] Componentes de UI criados
- [x] Edge Function implementada
- [x] Scripts de deploy criados
- [x] Sincronização com agenda local
- [x] Google Meet automático
- [x] Gestão de convidados
- [x] Tratamento de erros
- [x] Documentação completa
- [ ] Tests unitários (próxima fase)
- [ ] Integração em todas as páginas (próxima fase)

---

**Status:** 🟢 PRONTO PARA USAR
**Data:** 12 de Janeiro de 2026
**Última Atualização:** Google Calendar Create Events v1.0
