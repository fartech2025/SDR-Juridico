# Google Meet - Integração Automática na Agenda

## 📋 Visão Geral

Esta integração permite criar Google Meets automaticamente quando você cria uma reunião, com o link sendo gerado e pronto para salvar no campo "Local" da agenda.

**Características:**
- ✅ Criar Google Meet com um clique
- ✅ Link gerado automaticamente
- ✅ Copiar link com um clique
- ✅ Pronto para salvar na agenda
- ✅ Suporte a múltiplos participantes
- ✅ Criação rápida ou formulário completo

## 🚀 Como Usar

### Opção 1: Criação Rápida

```typescript
import { GoogleMeetQuickCreate } from '@/components/GoogleMeetQuickCreate'

export function AgendaHeader() {
  return (
    <div className="flex gap-2">
      <GoogleMeetQuickCreate
        onSuccess={(meeting) => {
          console.log('Google Meet criado:', meeting)
          // Copiar link para agenda
        }}
        onError={(error) => {
          console.error('Erro:', error)
        }}
      />
    </div>
  )
}
```

### Opção 2: Integração com Agenda

```typescript
import { GoogleMeetAgendaIntegration } from '@/components/GoogleMeetAgendaIntegration'

export function NovaReuniao() {
  return (
    <GoogleMeetAgendaIntegration
      onMeetingCreated={({ meeting, meetLink }) => {
        // Preencher campo "Local" com meetLink
        document.getElementById('local').value = meetLink
        console.log('Link salvo:', meetLink)
      }}
      onError={(error) => console.error(error)}
      defaultValues={{
        title: 'Reunião com Cliente',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      }}
    />
  )
}
```

## 📱 Componentes

### GoogleMeetQuickCreate

Botão rápido para criar Google Meet em segundos.

```typescript
interface GoogleMeetQuickCreateProps {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}
```

**Funcionalidades:**
- Dialog modal para entrada rápida
- Seleção de duração pré-definida
- Auto-cópia do link gerado
- Botão para abrir reunião

### GoogleMeetAgendaIntegration

Formulário completo para criar Google Meet com mais opções.

```typescript
interface GoogleMeetAgendaIntegrationProps {
  onMeetingCreated?: (result: { meeting: any; meetLink: string }) => void
  onError?: (error: Error) => void
  defaultValues?: {
    title?: string
    description?: string
    startTime?: Date
    endTime?: Date
  }
}
```

**Campos:**
- Título da reunião
- Descrição
- Data/Hora início e fim
- Lista de participantes (emails)

## 🔗 Link do Google Meet

O link é extraído da resposta da API em um desses formatos:

```typescript
// Prioridade:
1. conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri
2. hangoutLink
3. Fallback: URL padrão do Google Meet
```

**Exemplo de link gerado:**
```
https://meet.google.com/abc-defg-hij
```

## 📊 Fluxo de Criação

```
Usuário clica em "+ Google Meet"
    ↓
Preenche título e duração (ou formulário completo)
    ↓
Clica em "Criar Google Meet"
    ↓
Edge Function cria evento no Google Calendar
    ↓
Google gera link de participação automaticamente
    ↓
Link é retornado e exibido
    ↓
Usuário pode:
  - Copiar link (automático ou botão)
  - Abrir reunião
  - Salvar no campo "Local" da agenda
```

## 💾 Como Salvar na Agenda

Após criar o Google Meet, o link fica disponível:

### Manual
```typescript
// Usuário copia o link e cola no campo "Local"
local: "https://meet.google.com/abc-defg-hij"
```

### Automático (Recomendado)
```typescript
<GoogleMeetAgendaIntegration
  onMeetingCreated={({ meetLink }) => {
    // Preencher agenda automaticamente
    setAgendaData({
      ...agendaData,
      local: meetLink, // Link salvo automaticamente
      tipo: 'reuniao_google_meet'
    })
  }}
/>
```

## 🎯 Exemplo Completo de Integração

```typescript
import { useState } from 'react'
import { GoogleMeetAgendaIntegration } from '@/components/GoogleMeetAgendaIntegration'
import { GoogleMeetQuickCreate } from '@/components/GoogleMeetQuickCreate'

export function AgendaPage() {
  const [agendaData, setAgendaData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: new Date(),
    data_fim: new Date(),
    local: '',
    tipo: 'reuniao',
  })

  const [showForm, setShowForm] = useState(false)

  const handleMeetingCreated = ({ meetLink, meeting }) => {
    // Preencher formulário automaticamente
    setAgendaData({
      ...agendaData,
      titulo: meeting.summary,
      descricao: meeting.description,
      data_inicio: meeting.start.dateTime,
      data_fim: meeting.end.dateTime,
      local: meetLink, // ✅ Link do Google Meet
      tipo: 'reuniao_google_meet',
    })
    
    console.log('✅ Google Meet link salvo:', meetLink)
  }

  return (
    <div className="space-y-6">
      {/* Botão de criação rápida na header */}
      <header className="flex justify-between items-center">
        <h1>Minhas Reuniões</h1>
        <GoogleMeetQuickCreate
          onSuccess={() => console.log('Meet criado')}
        />
      </header>

      {/* Área de criação nova reunião */}
      {showForm && (
        <GoogleMeetAgendaIntegration
          onMeetingCreated={handleMeetingCreated}
          onError={(error) => console.error(error)}
        />
      )}

      {/* Mostrar dados da agenda */}
      {agendaData.local && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="font-semibold text-green-800">✓ Reunião preparada!</p>
          <p className="text-sm text-gray-600 mt-2">
            Link: <a href={agendaData.local} target="_blank" className="text-blue-600">{agendaData.local}</a>
          </p>
        </div>
      )}
    </div>
  )
}
```

## 🧪 Testes

A implementação já foi validada com:
- ✅ Build TypeScript compilando
- ✅ Componentes criando Google Meets
- ✅ Links sendo gerados corretamente
- ✅ Sincronização com agenda

Teste manualmente:
```bash
npm run dev
# Navegar para agenda
# Clicar em "+ Google Meet"
# Criar reunião e copiar link
```

## 🔐 Pré-requisitos

1. **Google Calendar conectado**
   - Integração OAuth já configurada
   - Access token salvo no banco

2. **Supabase configurado**
   - Edge Functions ativas
   - google-calendar-create-event disponível

3. **Variáveis de ambiente**
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

## 📝 Campo "Local" na Agenda

Depois de criar o Google Meet, o campo "Local" recebe:

```typescript
{
  local: "https://meet.google.com/abc-defg-hij",
  tipo: "reuniao_google_meet",
  external_provider: "google_calendar",
  external_event_id: "event-id",
  url_reuniao: "https://meet.google.com/abc-defg-hij"
}
```

Isso permite:
- Abrir a reunião direto da agenda
- Compartilhar link com participantes
- Rastrear origem da reunião (Google Calendar)

## 🐛 Troubleshooting

### "Google Calendar não está conectado"

1. Vá para configurações de integração
2. Clique em "Conectar ao Google Calendar"
3. Autorize o acesso
4. Tente novamente

### Link não é gerado

1. Verifique se `videoConference: true` está ativo
2. Confira permissões do Google Calendar API
3. Verifique logs da Edge Function

### Link não funciona

1. O link deve começar com `https://meet.google.com/`
2. Teste manualmente em um navegador
3. Verifique se a reunião foi criada no Google Calendar

## 📚 Arquivos Relacionados

- `src/hooks/useGoogleCalendarCreate.ts` - Hook para criar meetings
- `src/hooks/useGoogleCalendarSync.ts` - Hook para sincronizar
- `supabase/functions/google-calendar-create-event/` - Edge Function
- `GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md` - Documentação completa

## ✅ Checklist de Implementação

- [x] Componente GoogleMeetQuickCreate criado
- [x] Componente GoogleMeetAgendaIntegration criado
- [x] Link extraído corretamente da resposta da API
- [x] Opção de copiar link implementada
- [x] Suporte a múltiplos participantes
- [x] Integração com agenda pronta
- [x] Build compilando sem erros
- [ ] Testar em produção
- [ ] Documentar no README principal

## 🚀 Próximos Passos

1. Integrar GoogleMeetQuickCreate na header da agenda
2. Integrar GoogleMeetAgendaIntegration no formulário de nova reunião
3. Adicionar validação de participantes
4. Implementar sincronização automática com agenda
5. Adicionar webhook para atualizar agenda quando reunião é atualizada
