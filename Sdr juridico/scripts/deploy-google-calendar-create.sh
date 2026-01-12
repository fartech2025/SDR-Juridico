#!/bin/bash

# Script de deploy para Google Calendar Create Event Function
# Deploy automatizado da Edge Function

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     🚀 Deploy: google-calendar-create-event Function${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Verificar se está no diretório correto
if [ ! -f "supabase/functions/google-calendar-create-event/index.ts" ]; then
  echo -e "${RED}❌ Erro: Arquivo não encontrado!${NC}"
  echo "Execute este script na raiz do projeto (onde supabase/ está)"
  exit 1
fi

# Verificar credenciais
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo -e "${YELLOW}⚠️  Credenciais do Google não encontradas${NC}"
  echo ""
  echo "Exporte antes de executar:"
  echo "  export GOOGLE_CLIENT_ID='seu-id'"
  echo "  export GOOGLE_CLIENT_SECRET='seu-secret'"
  exit 1
fi

echo -e "${GREEN}✅ Credenciais encontradas${NC}"
echo ""

# Fazer deploy
echo -e "${BLUE}📦 Fazendo deploy...${NC}"
npx supabase functions deploy google-calendar-create-event \
  --project-ref xocqcoebreoiaqxoutar

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 Função disponível em:"
echo "   https://xocqcoebreoiaqxoutar.supabase.co/functions/v1/google-calendar-create-event"
echo ""
echo "🎯 Como usar:"
echo "   import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'"
echo "   const { createMeeting } = useGoogleCalendarCreate()"
echo "   await createMeeting({ title: 'Reunião', startTime, endTime, ... })"
echo ""
