# 📅 Integração Completa do Google Calendar - Guia Detalhado

## 🎯 Visão Geral

Este guia mostra como colocar o Google Calendar funcionando completamente integrado com a Agenda do sistema. A integração inclui:

- ✅ Sincronização **bidirecional** de eventos
- ✅ Autorização via OAuth 2.0 do Google
- ✅ Sincronização automática a cada hora
- ✅ Sincronização manual sob demanda
- ✅ Suporte a múltiplos calendários
- ✅ Rastreamento de alterações

## 📋 Arquitetura da Integração

```
┌─────────────────────────────────────────────────────┐
│              Google Calendar (Google)                │
└─────────────────────────────────────────────────────┘
                          ↕
         ┌────────────────────────────────────┐
         │   Edge Functions (Supabase Deno)   │
         │  - google-calendar-oauth           │
         │  - google-calendar-sync            │
         │  - google-calendar-sync-cron       │
         └────────────────────────────────────┘
                          ↕
         ┌────────────────────────────────────┐
         │   Supabase Database (PostgreSQL)   │
         │  - Tabela: integrations            │
         │  - Tabela: agendamentos            │
         └────────────────────────────────────┘
                          ↕
         ┌────────────────────────────────────┐
         │      React Frontend (Vite)         │
         │  - Página Config                   │
         │  - Hook useGoogleCalendarSync      │
         │  - Hook useAgenda                  │
         └────────────────────────────────────┘
```

## 🚀 Passo a Passo de Configuração

### Passo 1: Criar Credenciais OAuth no Google Cloud Console

**Objetivo:** Obter Client ID e Client Secret para autorizar o aplicativo.

**Instruções:**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (ou selecione um existente)
3. Ative a API Google Calendar:
   - Menu: **APIs & Services** → **Library**
   - Busque: `Google Calendar API`
   - Clique: **ENABLE**

4. Crie credenciais OAuth:
   - Menu: **APIs & Services** → **Credentials**
   - Clique: **Create Credentials** → **OAuth 2.0 Client ID**
   - Se solicitado, clique em **Configure OAuth consent screen**
   - Preencha:
     - **App name:** Seu app
     - **User support email:** seu-email@example.com
     - **Scopes:** Use defaults (Calendar, Calendar Events)
   - Volte para **Credentials**

5. Configure o Client ID:
   - **Application type:** Web application
   - **Name:** Seu app
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5174
     http://localhost:5173
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5174/app/config
     https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
     ```
   - Clique: **CREATE**

6. Copie o **Client ID** e **Client Secret** (você vai precisar deles em breve)

### Passo 2: Configurar Variáveis de Ambiente Localmente

**Objetivo:** Preparar seu ambiente local para deployment.

**No seu terminal:**

```bash
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"

# Exporte as credenciais
export GOOGLE_CLIENT_ID="seu-client-id-aqui"
export GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"

# Verifique se está correto
echo $GOOGLE_CLIENT_ID
```

### Passo 3: Fazer Deploy das Edge Functions

**Objetivo:** Publicar as funções Deno no Supabase.

**No terminal:**

```bash
# Deploy da função OAuth
npx supabase functions deploy google-calendar-oauth \
  --project-ref xocqcoebreoiaqxoutar

# Deploy da função de sincronização manual
npx supabase functions deploy google-calendar-sync \
  --project-ref xocqcoebreoiaqxoutar

# Deploy da função de sincronização agendada (cron)
npx supabase functions deploy google-calendar-sync-cron \
  --project-ref xocqcoebreoiaqxoutar
```

**⚠️ Se houver erros:**
- Verifique se as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão definidas
- Certifique-se de estar autenticado no Supabase: `supabase login`

### Passo 4: Configurar Secrets no Supabase Dashboard

**Objetivo:** Armazenar credenciais de forma segura no Supabase.

1. Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions

2. Na seção **Edge Function Secrets**, adicione:
   ```
   GOOGLE_CLIENT_ID=seu-client-id-aqui
   GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
   GOOGLE_REDIRECT_URI=https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
   APP_URL=http://localhost:5174
   ```

3. Clique **Save**

### Passo 5: Vincular Google Calendar na Interface

**Objetivo:** Autorizar o aplicativo a acessar seu Google Calendar.

1. Inicie o servidor:
   ```bash
   cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"
   npm run dev
   ```

2. Acesse: http://localhost:5174/app/config

3. Na aba **Essencial**, localize o card **Google Calendar**

4. Clique em **Vincular Google Calendar**

5. Uma janela do Google será aberta pedindo autorização

6. Conceda permissão para acessar seu Google Calendar

7. Você será redirecionado de volta para a página de configuração

8. Agora o Google Calendar está conectado! ✅

### Passo 6: Sincronizar Eventos

**Objetivo:** Trazer eventos do Google Calendar para sua Agenda.

1. Ainda na página http://localhost:5174/app/config

2. Você verá que o Google Calendar agora está **Conectado**

3. Clique em **Sincronizar Agora** para importar eventos imediatamente

4. Pronto! Seus eventos do Google Calendar aparecerão na Agenda

## 📱 Como Usar na Prática

### Sincronização Automática

A cada hora, o sistema verifica automaticamente por novos eventos no Google Calendar e os sincroniza:

```typescript
// Isso acontece automaticamente
// Função: google-calendar-sync-cron
// Frequência: A cada 1 hora
```

### Sincronização Manual

Na página Config, você pode clicar em **Sincronizar Agora** para forçar uma sincronização imediata.

### Bidirecional

Eventos criados na Agenda também são enviados para o Google Calendar, mantendo tudo sincronizado.

## 🔍 Estrutura de Dados

### Tabela: integrations

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  org_id UUID,
  provider TEXT,        -- 'google_calendar'
  name TEXT,            -- 'Google Calendar'
  enabled BOOLEAN,      -- true quando conectado
  secrets JSONB,        -- OAuth tokens
  settings JSONB        -- Configurações de uso
);
```

**secrets (exemplo):**
```json
{
  "access_token": "ya29.a0AfH6S...",
  "refresh_token": "1//0gX...",
  "expires_at": "2024-01-15T10:30:00Z",
  "scope": "https://www.googleapis.com/auth/calendar",
  "token_type": "Bearer",
  "updated_at": "2024-01-15T09:30:00Z"
}
```

**settings (exemplo):**
```json
{
  "calendar_id": "primary",
  "linked_at": "2024-01-15T09:00:00Z",
  "sync_enabled": true
}
```

### Tabela: agendamentos

```sql
-- Quando sincronizado do Google Calendar:
UPDATE agendamentos SET
  external_provider = 'google_calendar',
  external_event_id = 'google-event-id-123',
  meta = {
    'google_updated': '2024-01-15T10:00:00Z',
    'google_status': 'confirmed',
    'google_link': 'https://calendar.google.com/...'
  }
```

## 🛠️ Troubleshooting

### "Missing Supabase env vars"

**Problema:** As variáveis Supabase não estão configuradas.

**Solução:**
```bash
# Certifique-se que você tem um arquivo .env.local:
echo "VITE_SUPABASE_URL=https://xocqcoebreoiaqxoutar.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=sua-anon-key" >> .env.local
```

### "Missing Google OAuth env vars"

**Problema:** As credenciais do Google não estão no Supabase.

**Solução:** Adicione ao dashboard Supabase:
```
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

### "OAuth error: access_denied"

**Problema:** Você recusou a permissão no Google.

**Solução:** Clique em **Reconectar** e conceda permissão.

### "Sync returned 0 events"

**Problema:** Eventos não estão sendo sincronizados.

**Solução:**
1. Verifique se você tem eventos no seu Google Calendar
2. Certifique-se de que o calendar_id está correto (default: "primary")
3. Verifique os logs das Edge Functions no dashboard Supabase

### "External provider is null"

**Problema:** Integração não está vinculada corretamente.

**Solução:**
1. Vá para Config → Google Calendar
2. Clique em **Reconectar**
3. Autorize novamente no Google

## 🔐 Segurança

### OAuth Tokens

- Tokens de acesso: Válidos por ~1 hora, renovados automaticamente
- Refresh tokens: Armazenados de forma segura no Supabase
- Secrets: Criptografados em repouso no banco de dados

### RLS Policies

A integração usa RLS para garantir que:
- Apenas membros da organização possam acessar os dados
- Função `is_adminish(org_id)` valida permissões

### Escopos OAuth

Permissões solicitadas:
- `https://www.googleapis.com/auth/calendar` - Ler/escrever calendários
- `https://www.googleapis.com/auth/calendar.events` - Ler/escrever eventos

## 📊 Monitoramento

### Verificar Logs

No dashboard Supabase:
1. Acesse: **Functions**
2. Selecione: **google-calendar-sync**
3. Clique em execuções recentes para ver logs

### Contar Eventos Sincronizados

```sql
SELECT COUNT(*)
FROM agendamentos
WHERE org_id = 'sua-org-id'
  AND external_provider = 'google_calendar'
```

### Verificar Último Sync

```sql
SELECT settings->>'linked_at', settings->>'updated_at'
FROM integrations
WHERE org_id = 'sua-org-id'
  AND provider = 'google_calendar'
```

## 🚀 Otimizações Avançadas

### Sincronização Seletiva de Calendários

Para sincronizar apenas um calendário específico (não "primary"):

1. Va para Config
2. Procure por "ID do Calendário"
3. Digite o ID do calendário (ex: `user@gmail.com`)
4. Salve

### Intervalo de Sincronização

Padrão: Sincroniza eventos dos últimos 90 dias e próximos 180 dias.

Para alterar, edite em `supabase/functions/_shared/googleCalendarSync.ts`:
```typescript
export const DEFAULT_PAST_DAYS = 90      // Dias no passado
export const DEFAULT_FUTURE_DAYS = 180   // Dias no futuro
```

### Webhook para Sincronização em Tempo Real

Para sincronizar em tempo real (não apenas a cada hora):

1. Adicione um webhook no Google Calendar
2. Configure para enviar para:
   ```
   https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-sync
   ```

## 📚 Referências

- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Docs](https://deno.land/manual)

## ✅ Checklist Final

- [ ] Google Calendar API habilitada no Google Cloud
- [ ] Client ID e Client Secret criados
- [ ] Edge Functions fizeram deploy com sucesso
- [ ] Secrets configuradas no Supabase
- [ ] Você vinculou sua conta do Google
- [ ] Eventos aparecendo na Agenda
- [ ] Sincronização automática funcionando
- [ ] Você criou um evento e viu ele aparecer no Google Calendar

## 🎉 Pronto!

Sua integração do Google Calendar está completa e funcionando. Agora:

1. Eventos do Google Calendar aparecem na Agenda
2. Eventos da Agenda aparecem no Google Calendar
3. Sincronização acontece automaticamente
4. Você pode sincronizar manualmente quando quiser

**Dúvidas?** Verifique os logs das Edge Functions ou execute:
```bash
node scripts/fix_google_calendar.mjs
```
