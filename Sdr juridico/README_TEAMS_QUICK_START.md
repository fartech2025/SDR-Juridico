# Microsoft Teams - Quick Start

## 🚀 Começar em 3 minutos

### Passo 1: Setup Automático
```bash
npm run setup:teams
```

### Passo 2: Deploy das Functions
```bash
npm run deploy:teams-create
```

### Passo 3: Usar na Aplicação

#### Opção A: Criar Reunião Rápida
```typescript
import { TeamsQuickCreate } from '@/components/TeamsQuickCreate'

<TeamsQuickCreate />
```

#### Opção B: Formulário Completo
```typescript
import { MeetingCreatorForm } from '@/components/MeetingCreatorForm'

<MeetingCreatorForm />
```

#### Opção C: Widget de Configuração
```typescript
import { TeamsIntegrationWidget } from '@/components/ui/TeamsIntegrationWidget'

<TeamsIntegrationWidget />
```

## ✨ O que funciona

✅ Criar reuniões no Teams  
✅ Gerar link automaticamente  
✅ Salvar link no campo "Local"  
✅ Sincronizar com agenda local  
✅ Suporte a múltiplos participantes  

## 📊 Estrutura

```
src/hooks/
  - useTeamsMeetingCreate.ts (criar reuniões)
  - useTeamsSync.ts (sincronizar eventos)

src/components/
  - MeetingCreatorForm.tsx (formulário completo)
  - TeamsQuickCreate.tsx (criação rápida)
  - ui/TeamsIntegrationWidget.tsx (configuração)

supabase/functions/
  - teams-create-event/ (criar no Teams)
  - teams-oauth/ (autenticação)
```

## 🔑 Variáveis Necessárias

```
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
VITE_MICROSOFT_CLIENT_ID
```

## 📝 Exemplo de Uso

```typescript
const { createMeeting } = useTeamsMeetingCreate()

const result = await createMeeting({
  title: "Reunião com Cliente",
  description: "Apresentação de projeto",
  startTime: new Date(),
  endTime: new Date(Date.now() + 60 * 60 * 1000),
  attendees: ["cliente@example.com"]
})

console.log(result.joinWebUrl) // Link para participar
```

## 🧪 Validar

```bash
npm run test:teams-create
```

## 📚 Documentação Completa

Ver [TEAMS_INTEGRATION_COMPLETE.md](./TEAMS_INTEGRATION_COMPLETE.md)
