# 🚀 INTEGRAÇÃO GOOGLE CALENDAR - INÍCIO RÁPIDO

## O que foi implementado

✅ **Hook `useGoogleCalendarSync`** - Gerencia conexão e sincronização  
✅ **Componente `GoogleCalendarWidget`** - UI para vinculação e sincronização  
✅ **Edge Functions** - OAuth, sync manual e cron automático  
✅ **Scripts de diagnóstico** - Verificam se tudo está pronto  
✅ **Documentação completa** - Guia passo a passo  

## ⚡ Início Rápido (5 minutos)

### 1. Execute o diagnóstico
```bash
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"
node scripts/diagnose_google_calendar.mjs
```

### 2. Configure o Google (no Google Cloud Console)
- Acesse: https://console.cloud.google.com/
- Crie projeto ou use existente
- Ative: **Google Calendar API**
- Crie credenciais: **OAuth 2.0 Client ID** (Web application)
- Copie: **Client ID** e **Client Secret**

### 3. Configure variáveis de ambiente
```bash
export GOOGLE_CLIENT_ID="seu-client-id"
export GOOGLE_CLIENT_SECRET="seu-client-secret"
```

### 4. Faça deploy das Edge Functions
```bash
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar  
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar
```

### 5. Configure secrets no Supabase
- Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions
- **Edge Function Secrets**, adicione:
  ```
  GOOGLE_CLIENT_ID=seu-valor
  GOOGLE_CLIENT_SECRET=seu-valor
  GOOGLE_REDIRECT_URI=https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
  APP_URL=http://localhost:5174
  ```

### 6. Inicie o servidor e vincule
```bash
npm run dev
# Acesse: http://localhost:5174/app/config
# Clique: "Vincular Google Calendar"
# Autorize no Google
```

## 📂 Arquivos Criados/Modificados

### Novos Hooks
- **`src/hooks/useGoogleCalendarSync.ts`** - Gerencia integração Google Calendar

### Novo Componente
- **`src/components/ui/GoogleCalendarWidget.tsx`** - Widget de sincronização visual

### Scripts Utilitários
- **`scripts/setup_google_calendar.mjs`** - Setup automatizado
- **`scripts/diagnose_google_calendar.mjs`** - Diagnóstico de problemas
- **`scripts/test_google_calendar.mjs`** - Testes de integração

### Documentação
- **`GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md`** - Guia detalhado (este arquivo)
- **`README_GOOGLE_CALENDAR_QUICK_START.md`** - Início rápido (este arquivo)

## 🔄 Como Funciona

```
1. Usuário clica "Vincular Google Calendar"
   ↓
2. Sistema redireciona para OAuth do Google
   ↓
3. Usuário autoriza acesso
   ↓
4. Google retorna para Edge Function oauth
   ↓
5. Edge Function troca código por tokens
   ↓
6. Tokens armazenados em `integrations.secrets`
   ↓
7. Sistema pode sincronizar eventos
   ↓
8. A cada hora, cron syncroniza automaticamente
   ↓
9. Usuário pode sincronizar manualmente quando quiser
```

## 📊 Dados Sincronizados

- **Google → Agenda**: Eventos do Google Calendar aparecem em `agendamentos`
- **Agenda → Google**: Eventos criados localmente são enviados para Google Calendar
- **Metadados**: Links, status e timestamps são sincronizados

## 🧪 Testar Tudo

```bash
# Executar testes
node scripts/test_google_calendar.mjs

# Verificar diagnóstico
node scripts/diagnose_google_calendar.mjs

# Ver logs das Edge Functions
# Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/functions
```

## 🔒 Segurança

- ✅ OAuth 2.0 autenticado
- ✅ Tokens armazenados criptografado no Supabase
- ✅ RLS policies protegem dados por organização
- ✅ Refresh tokens renovados automaticamente

## 🆘 Problemas Comuns

### "Missing Google OAuth env vars"
Defina as variáveis:
```bash
export GOOGLE_CLIENT_ID="seu-id"
export GOOGLE_CLIENT_SECRET="seu-secret"
```

### "OAuth returned: access_denied"
Você recusou permissão. Clique em "Reconectar" e aceite.

### "Events not syncing"
1. Verifique se você tem eventos no Google Calendar
2. Clique "Sincronizar Agora"
3. Verifique logs das Edge Functions

### "Integration not found"
A integração Google Calendar foi deletada. Execute:
```sql
INSERT INTO integrations (org_id, provider, name, enabled, secrets, settings)
VALUES (
  'sua-org-id',
  'google_calendar',
  'Google Calendar',
  false,
  '{}',
  '{}'
);
```

## 📚 Mais Informações

Para guia completo com troubleshooting avançado:
→ Veja `GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md`

## ✅ Checklist de Configuração

- [ ] Google Calendar API ativada no Google Cloud
- [ ] Client ID e Secret criados
- [ ] Variáveis de ambiente exportadas
- [ ] Edge Functions fizeram deploy
- [ ] Secrets configurados no Supabase
- [ ] Servidor rodando em http://localhost:5174
- [ ] Você clicou "Vincular Google Calendar"
- [ ] Autorizou no Google
- [ ] Vê "Conectado" na página de Config
- [ ] Clicou "Sincronizar Agora"
- [ ] Eventos aparecem na Agenda

## 🎉 Pronto!

Google Calendar está integrado com sua Agenda. Eventos sincronizam automaticamente a cada hora e você pode sincronizar manualmente quando quiser.
