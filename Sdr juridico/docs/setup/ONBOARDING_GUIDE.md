# 🎓 GOOGLE CALENDAR - GUIA DE ONBOARDING

> Documento criado para facilitar o entendimento e implementação rápida da integração Google Calendar.

## 📍 Você está aqui?

- [ ] **Fase 1**: Entendimento (leia este documento)
- [ ] **Fase 2**: Configuração Google (15 min)
- [ ] **Fase 3**: Deploy (5 min)
- [ ] **Fase 4**: Teste (5 min)

---

## Fase 1️⃣ : Entendimento

### O que é Google Calendar Integration?

É um recurso que conecta sua Agenda do Sistema com seu Google Calendar pessoal. Isso significa:

- ✅ Eventos criados no Google Calendar aparecem na Agenda do Sistema
- ✅ Eventos criados na Agenda do Sistema aparecem no Google Calendar
- ✅ Tudo sincroniza automaticamente a cada hora
- ✅ Você pode sincronizar manualmente quando quiser

### Como Funciona?

```
Seu Google Calendar
         ↕ (via OAuth 2.0)
    Edge Functions
         ↕ (via REST API)
   Banco de Dados
         ↕ (via React)
  Agenda do Sistema
```

### Quem precisa fazer o quê?

| Role | Responsabilidade |
|------|-------------------|
| **Admin/Dev** | Configurar credenciais e fazer deploy |
| **Usuário Final** | Clicar "Vincular Google Calendar" e autorizar |
| **Sistema** | Sincronizar automaticamente a cada hora |

---

## Fase 2️⃣ : Configuração Google (15 minutos)

### Passo 1: Acessar Google Cloud Console

1. Abra: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Selecione um projeto ou crie novo

### Passo 2: Ativar Google Calendar API

1. Menu superior: **APIs & Services** → **Library**
2. Busque: `Google Calendar API`
3. Clique na API
4. Botão: **ENABLE**
5. Aguarde (pode levar alguns segundos)

### Passo 3: Configurar OAuth Consent

1. Menu: **APIs & Services** → **Credentials**
2. Se for a primeira vez, clique: **Configure OAuth consent screen**
3. Selecione: **External**
4. Preencha:
   - **App name**: `Sua Agenda - Google Calendar`
   - **User support email**: seu-email@example.com
   - **Scopes**: Google fornecerá defaults (não precisa alterar)
5. Clique: **Save and Continue**
6. Página seguinte: não precisa adicionar usuários (é teste)
7. Clique: **Save and Continue** até terminar

### Passo 4: Criar OAuth Credentials

1. Menu: **APIs & Services** → **Credentials**
2. Botão: **Create Credentials** → **OAuth 2.0 Client ID**
3. Se pergunta novamente: **Configure OAuth consent screen**:
   - **Application type**: Web application
   - **Name**: `Sua Agenda Web App`
   - **Authorized JavaScript origins**: (adicione)
     ```
     http://localhost:5174
     http://localhost:5173
     ```
   - **Authorized redirect URIs**: (adicione)
     ```
     http://localhost:5174/app/config
     https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth
     ```
4. Clique: **Create**
5. Aparecerá popup com:
   - **Client ID** ← COPIE ISTO
   - **Client Secret** ← COPIE ISTO
6. Feche e vá para o terminal

### 📋 Você agora tem:
- ✅ Client ID
- ✅ Client Secret

Mantenha estes valores seguros (não compartilhe)!

---

## Fase 3️⃣ : Deploy (5 minutos)

### Passo 1: Preparar Terminal

```bash
# Abra um terminal e navegue até o projeto
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"

# Cole seus valores (não há aspas necessárias)
export GOOGLE_CLIENT_ID="seu-client-id-aqui"
export GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"

# Verifique se está correto
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

### Passo 2: Fazer Deploy das Functions

```bash
# Copie e cole cada linha:

# 1. OAuth (autorização)
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar

# 2. Sincronização (manual e automática)
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar

# 3. Cron (automático a cada hora)
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar
```

Aguarde até ver `✓ Deployed successfully`.

### Passo 3: Configurar Secrets no Supabase

1. Abra: https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/settings/functions
2. Procure por: **Edge Function Secrets**
3. Clique: **New secret**
4. Adicione cada um:

```
Nome: GOOGLE_CLIENT_ID
Valor: seu-client-id (copie do Google)

Nome: GOOGLE_CLIENT_SECRET
Valor: seu-client-secret (copie do Google)

Nome: GOOGLE_REDIRECT_URI
Valor: https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth

Nome: APP_URL
Valor: http://localhost:5174
```

5. Clique: **Save** após cada um

### ✅ Pronto! Deployment concluído

---

## Fase 4️⃣ : Teste (5 minutos)

### Passo 1: Iniciar Servidor

```bash
# No mesmo terminal
npm run dev

# Vai aparecer algo como:
# VITE v7.2.4  ready in 234 ms
# ➜  Local:   http://localhost:5174/
```

### Passo 2: Abrir Interface

1. Abra seu navegador
2. Acesse: http://localhost:5174/
3. Faça login (se não estiver logado)
4. Vá para: **Config** (menu lateral)

### Passo 3: Vincular Google Calendar

1. Procure pelo card **Google Calendar**
2. Clique: **Vincular Google Calendar**
3. Uma janela do Google abrirá
4. Clique: **Continuar**
5. Selecione sua conta Google
6. Clique: **Permitir**
7. Você será redirecionado de volta

### Passo 4: Verificar Status

1. Você verá: `✓ Conectado` no card do Google Calendar
2. Clique: **Sincronizar Agora**
3. Aguarde a mensagem de sucesso
4. Vá para: **Agenda** (menu lateral)
5. Veja seus eventos do Google Calendar! 🎉

### 🎯 Pronto!

Sua integração do Google Calendar está funcional. Agora:

- ✅ A cada hora, eventos sincronizam automaticamente
- ✅ Você pode clicar "Sincronizar Agora" quando quiser
- ✅ Criar evento na Agenda → aparece no Google Calendar
- ✅ Criar evento no Google Calendar → aparece na Agenda

---

## 🆘 Problemas Comuns

### "Missing Google OAuth env vars"
**Problema**: Variáveis não exportadas  
**Solução**:
```bash
export GOOGLE_CLIENT_ID="seu-id"
export GOOGLE_CLIENT_SECRET="seu-secret"
```

### "OAuth error: redirect_uri_mismatch"
**Problema**: URI no Google não corresponde  
**Solução**: 
- Verifique em: Google Cloud Console → APIs & Services → Credentials
- Deve ser exatamente: `https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-oauth`

### "Sync returned 0 events"
**Problema**: Eventos não sincronizam  
**Solução**:
1. Crie eventos no Google Calendar
2. Clique "Sincronizar Agora"
3. Se ainda não funcionar, execute: `npm run diagnose:google-calendar`

### "Integration not found"
**Problema**: Erro ao conectar  
**Solução**: Contate o admin ou reinicie o servidor

---

## 📚 Documentos Relacionados

Para mais informações:

| Documento | Para |
|-----------|------|
| `README_GOOGLE_CALENDAR_QUICK_START.md` | Referência rápida |
| `GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md` | Guia completo e avançado |
| `ARCHITECTURE_DIAGRAM.md` | Como funciona internamente |
| `COMMANDS_REFERENCE.sh` | Comandos úteis |

---

## ✅ Checklist Final

Você completou com sucesso quando:

- [ ] Tem Client ID e Secret do Google
- [ ] Exportou variáveis de ambiente
- [ ] Fez deploy de 3 Edge Functions
- [ ] Configurou secrets no Supabase
- [ ] Iniciou servidor local
- [ ] Vê "✓ Conectado" no Google Calendar
- [ ] Clicou "Sincronizar Agora" com sucesso
- [ ] Vê eventos na Agenda
- [ ] Cron job está agendado (próxima sincronização em 1h)

---

## 🎉 Parabéns!

Você tem sucesso! Sua Agenda agora está completamente sincronizada com seu Google Calendar.

### Próximas Ações Opcionais:

1. **Configurar múltiplos calendários** → Editar Google Calendar settings
2. **Ajustar intervalo de sincronização** → Editar função cron (avançado)
3. **Integrar com WhatsApp** → Requer configuração adicional

---

## 📞 Precisa de Ajuda?

1. **Verifique**: https://github.com/yourusername/projeto/issues
2. **Execute diagnóstico**: `npm run diagnose:google-calendar`
3. **Rode testes**: `npm run test:google-calendar`
4. **Consulte**: `GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md`

---

**Tempo total**: ~40 minutos (incluindo login no Google)  
**Dificuldade**: ⭐⭐☆☆☆ (Fácil)  
**Resultado**: Google Calendar integrado com sua Agenda ✅

Bom trabalho! 🚀
