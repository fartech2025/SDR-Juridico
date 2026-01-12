# 🚀 Setup Rápido - Google Calendar

Se você já tem as credenciais do Google Calendar, agora é muito simples!

## ⚡ Forma Rápida (2 minutos)

### 1. Execute o setup automático

```bash
npm run setup:google:quick
```

Este script irá:
- ✅ Solicitar seu **Client ID** do Google
- ✅ Solicitar seu **Client Secret** do Google
- ✅ Configurar automaticamente as variáveis de ambiente
- ✅ Opcionalmente fazer deploy das Edge Functions

### 2. Autorizar na aplicação

1. Acesse: http://localhost:5174/app/config
2. Procure por "Google Calendar"
3. Clique em "Vincular Google Calendar"
4. Autorize o acesso ao seu Google

### 3. Pronto!

Volte para a Agenda e tente gerar um Google Meet!

---

## 📋 Precisando das Credenciais?

Se você ainda não tem as credenciais do Google:

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto (ou use um existente)
3. Ative a API: **Google Calendar API**
4. Vá para: **APIs & Services** → **Credentials**
5. Clique: **Create Credentials** → **OAuth 2.0 Client ID**
6. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5174
     http://localhost:5173
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5174/app/config
     https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
     ```
7. Clique: **CREATE**
8. **Copie** o **Client ID** e **Client Secret**

Depois execute: `npm run setup:google:quick`

---

## 🔧 Configuração Manual

Se preferir configurar manualmente:

### No Terminal

```bash
export GOOGLE_CLIENT_ID="seu-client-id-aqui"
export GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"

# Fazer deploy
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-create-event --project-ref xocqcoebreoiaqxoutar
```

### No Painel do Supabase

1. Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions
2. Procure por: **Edge Function Secrets**
3. Adicione:
   - `GOOGLE_CLIENT_ID`: seu-client-id
   - `GOOGLE_CLIENT_SECRET`: seu-client-secret
   - `GOOGLE_REDIRECT_URI`: https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
   - `APP_URL`: http://localhost:5174

---

## ✅ Verificar se Funcionou

1. Execute: `npm run dev`
2. Vá para a Agenda
3. Preencha: Título, Data, Hora
4. Clique: "Gerar Google Meet"
5. Se um link aparecer em LOCAL, funciona! 🎉

---

## 🆘 Erro: "Google Calendar não está conectado"

Este erro significa que você ainda não vinculou sua conta Google. Siga:

1. Clique no link "Configurações" na mensagem de erro
2. Ou acesse: http://localhost:5174/app/config
3. Procure por "Google Calendar"
4. Clique: "Vincular Google Calendar"
5. Autorize no Google
6. Retorne e tente novamente

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md`
- `GOOGLE_CALENDAR_SETUP.md`
- `README_GOOGLE_CALENDAR_QUICK_START.md`

---

**Pronto? Execute:** `npm run setup:google:quick` 🚀
