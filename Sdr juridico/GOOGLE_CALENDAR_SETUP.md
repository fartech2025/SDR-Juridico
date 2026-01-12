# 🔧 GUIA COMPLETO - Configurar Google Calendar

## ✅ Status Atual

- ✅ Tabela `integrations` existe e está correta
- ✅ Integração Google Calendar criada (ID: e08569d5-e142-435c-95ab-a03d1f0b4710)
- ❌ Credenciais OAuth não configuradas
- ❌ Edge Functions sem variáveis de ambiente

---

## 📋 PASSO A PASSO

### 1️⃣ CRIAR CREDENCIAIS GOOGLE OAUTH

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: SDR Juridico
   - **Authorized redirect URIs**: 
     ```
     https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
     ```
6. Clique em **CREATE**
7. **COPIE** o `Client ID` e `Client secret` gerados

### 2️⃣ HABILITAR API DO GOOGLE CALENDAR

1. No Google Cloud Console
2. Vá em **APIs & Services** → **Library**
3. Procure por "Google Calendar API"
4. Clique em **ENABLE**

### 3️⃣ CONFIGURAR VARIÁVEIS NO SUPABASE

1. Acesse: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions
2. Na seção **Edge Function Secrets**, adicione:

```bash
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
APP_URL=http://localhost:5174
```

**⚠️ IMPORTANTE**: Cole seus valores REAIS do passo 1!

### 4️⃣ FAZER DEPLOY DAS EDGE FUNCTIONS

Execute no terminal:

```bash
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"

# Deploy Google Calendar OAuth
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar

# Deploy Google Calendar Sync
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar

# Deploy Google Calendar Sync Cron
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar
```

### 5️⃣ TESTAR A CONEXÃO

1. Abra: http://localhost:5174/app/config
2. Faça login na aplicação
3. Localize **Google Calendar**
4. Clique em **Vincular**
5. Complete o fluxo OAuth do Google
6. Autorize o acesso ao Calendar

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute após completar os passos:

```bash
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"
node scripts/fix_google_calendar.mjs
```

Se mostrar ✅ em todos os itens, está funcionando!

---

## ❌ PROBLEMAS COMUNS

### Erro: "Missing Google OAuth env vars"
- **Causa**: Variáveis não configuradas no Supabase
- **Solução**: Volte ao passo 3️⃣

### Erro: "Redirect URI mismatch"
- **Causa**: URI não autorizada no Google Console
- **Solução**: Adicione a URI exata no passo 1️⃣

### Erro: "Access denied"
- **Causa**: Google Calendar API não habilitada
- **Solução**: Volte ao passo 2️⃣

---

## 📞 SUPORTE

Se precisar de ajuda:
1. Execute o script de diagnóstico
2. Copie a saída completa
3. Compartilhe os erros específicos
