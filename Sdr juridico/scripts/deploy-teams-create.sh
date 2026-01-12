#!/bin/bash

# Script para fazer deploy das Edge Functions do Teams

set -e

echo "🚀 Iniciando deploy das Edge Functions do Teams..."

# Verificar se estamos no diretório correto
if [ ! -d "supabase/functions" ]; then
    echo "❌ Erro: supabase/functions não encontrado"
    exit 1
fi

# Fazer deploy da função teams-create-event
echo ""
echo "📤 Fazendo deploy de teams-create-event..."
npx supabase functions deploy teams-create-event --project-ref xocqcoebreoiaqxoutar

# Fazer deploy da função teams-oauth
echo ""
echo "📤 Fazendo deploy de teams-oauth..."
npx supabase functions deploy teams-oauth --project-ref xocqcoebreoiaqxoutar

# Fazer deploy da função teams-sync (se existir)
if [ -d "supabase/functions/teams-sync" ]; then
    echo ""
    echo "📤 Fazendo deploy de teams-sync..."
    npx supabase functions deploy teams-sync --project-ref xocqcoebreoiaqxoutar
fi

echo ""
echo "✅ Deploy das Edge Functions do Teams concluído!"
echo ""
echo "⚠️  Lembre-se de configurar as variáveis de ambiente no Supabase:"
echo "   - MICROSOFT_CLIENT_ID"
echo "   - MICROSOFT_CLIENT_SECRET"
