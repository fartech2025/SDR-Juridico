#!/bin/bash

# 🚀 COMANDOS ESSENCIAIS - GOOGLE CALENDAR INTEGRATION

## ========================
## 1. CONFIGURAÇÃO INICIAL
## ========================

# Definir credenciais do Google
export GOOGLE_CLIENT_ID="seu-client-id-aqui"
export GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"

# Verificar variáveis Supabase
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

## ========================
## 2. DEPLOYMENT
## ========================

# Navegar para o projeto
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"

# Fazer login no Supabase (primeira vez)
supabase login

# Deploy de todas as Edge Functions
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-sync --project-ref xocqcoebreoiaqxoutar
npx supabase functions deploy google-calendar-sync-cron --project-ref xocqcoebreoiaqxoutar

# Verificar status do deployment
supabase functions list --project-ref xocqcoebreoiaqxoutar

## ========================
## 3. DESENVOLVIMENTO LOCAL
## ========================

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar a interface
# http://localhost:5174/app/config

# Iniciar console Supabase local (opcional)
supabase start

# Parar Supabase local (quando terminar)
supabase stop

## ========================
## 4. TESTES E DIAGNÓSTICO
## ========================

# Executar diagnóstico
npm run diagnose:google-calendar

# Executar testes
npm run test:google-calendar

# Setup interativo
npm run setup:google-calendar

## ========================
## 5. VERIFICAÇÕES NO BANCO
## ========================

# Contar integrações Google Calendar
supabase db push

# Query SQL para verificar integração
# SELECT * FROM integrations WHERE provider = 'google_calendar'

# Query SQL para contar eventos sincronizados
# SELECT COUNT(*) FROM agendamentos WHERE external_provider = 'google_calendar'

## ========================
## 6. SINCRONIZAÇÃO MANUAL
## ========================

# Disparar sincronização via curl (requer token válido)
curl -X POST https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-sync \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"org_id": "sua-org-id"}'

# Ou através da interface:
# 1. Acesse http://localhost:5174/app/config
# 2. Clique em "Sincronizar Agora"

## ========================
## 7. VISUALIZAR LOGS
## ========================

# Logs das Edge Functions
# https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/functions

# Ver logs em tempo real (se habilitado)
supabase functions logs google-calendar-sync --project-ref xocqcoebreoiaqxoutar --follow

# Ver logs da última execução
supabase functions logs google-calendar-sync --project-ref xocqcoebreoiaqxoutar --limit 50

## ========================
## 8. TROUBLESHOOTING
## ========================

# Verificar se as variables estão corretas
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET: $GOOGLE_CLIENT_SECRET"
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"

# Listar secrets configurados no Supabase
supabase secrets list --project-ref xocqcoebreoiaqxoutar

# Adicionar/atualizar secrets
supabase secrets set GOOGLE_CLIENT_ID=seu-id --project-ref xocqcoebreoiaqxoutar
supabase secrets set GOOGLE_CLIENT_SECRET=seu-secret --project-ref xocqcoebreoiaqxoutar

# Redeployar uma function específica
npx supabase functions deploy google-calendar-oauth --project-ref xocqcoebreoiaqxoutar

## ========================
## 9. LIMPEZA E RESET
## ========================

# Deletar uma integração (CUIDADO - permanente!)
# DELETE FROM integrations WHERE provider = 'google_calendar' AND org_id = 'seu-org-id'

# Reset de eventos sincronizados
# UPDATE agendamentos SET external_provider = NULL, external_event_id = NULL WHERE external_provider = 'google_calendar'

# Resetar integração (manter tabela, limpar credenciais)
# UPDATE integrations SET enabled = false, secrets = '{}' WHERE provider = 'google_calendar'

## ========================
## 10. PERFORMANCE
## ========================

# Monitorar uso de API
# https://console.cloud.google.com/apis/dashboard

# Checar quota de sincronização
# https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/edge-functions

# Analisar performance
# npm run build && npm run preview

## ========================
## ATALHOS ÚTEIS
## ========================

# Quick start (tudo de uma vez)
alias google-cal-start='export GOOGLE_CLIENT_ID="..." && export GOOGLE_CLIENT_SECRET="..." && cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico" && npm run dev'

# Diagnóstico rápido
alias google-cal-check='cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico" && npm run diagnose:google-calendar'

# Testes rápidos
alias google-cal-test='cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico" && npm run test:google-calendar'

# Ver status
alias google-cal-status='supabase functions list --project-ref xocqcoebreoiaqxoutar'

## ========================
## REFERÊNCIAS
## ========================

# Dashboard Supabase
# https://supabase.com/dashboard/project/xocqcoebreoiaqxoutar/

# Google Cloud Console
# https://console.cloud.google.com/

# Google Calendar API Docs
# https://developers.google.com/calendar/api/guides/overview

# Supabase Edge Functions Docs
# https://supabase.com/docs/guides/functions

## ========================
## NOTAS IMPORTANTES
## ========================

# 1. NUNCA commit credenciais em Git!
#    Sempre use variáveis de ambiente ou secrets no Supabase

# 2. Credenciais do Google
#    - Client ID: Público (pode estar em código)
#    - Client Secret: SECRETO (nunca compartilhar)

# 3. Tokens de Acesso
#    - Access Token: Válido por ~1 hora
#    - Refresh Token: Renovado automaticamente
#    - Sempre criptografado no banco

# 4. RLS Policies
#    - Só membros da org podem acessar
#    - Admin pode ver tudo da org
#    - Non-admin pode ver apenas seus eventos

# 5. Sincronização
#    - Automática: A cada 1 hora
#    - Manual: Clique em "Sincronizar Agora"
#    - Bidirecional: Ambas as direções sincronizam
