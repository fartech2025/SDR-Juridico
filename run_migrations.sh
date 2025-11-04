#!/bin/bash

# Script para executar todas as migrações de simulados
# Uso: bash run_migrations.sh

set -e

echo "🚀 Iniciando execução de migrações..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="/Users/fernandodias/Projeto-ENEM"

# Verificar se estamos no diretório correto
if [ ! -f "$BASE_DIR/package.json" ]; then
    echo -e "${RED}❌ Erro: Diretório do projeto não encontrado em $BASE_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Verificando Supabase CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm encontrado${NC}"
echo ""

# Navegar para o diretório do projeto
cd "$BASE_DIR"

echo -e "${YELLOW}📋 Listando migrações...${NC}"
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}❌ Pasta supabase/migrations não encontrada${NC}"
    exit 1
fi

echo "Migrações disponíveis:"
ls -1 supabase/migrations/*.sql 2>/dev/null | while read migration; do
    echo "  - $(basename "$migration")"
done
echo ""

# Executar migrações
echo -e "${YELLOW}🔧 Executando migrações...${NC}"
echo ""

if npx supabase db push; then
    echo -e "${GREEN}✅ Migrações executadas com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao executar migrações${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 Verificando tabelas criadas...${NC}"

# Verificar tabelas (isso requer uma query SQL, vamos usar curl para testar a API)
SUPABASE_URL="https://mskvucuaarutehslvhsp.supabase.co"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  Variável SUPABASE_ANON_KEY não definida${NC}"
    echo "Defina com: export SUPABASE_ANON_KEY='your-anon-key'"
    echo ""
    echo -e "${YELLOW}📖 Dicas:${NC}"
    echo "1. Ir para https://supabase.com/dashboard"
    echo "2. Selecionar projeto 'Projeto-ENEM'"
    echo "3. Ir para Settings > API"
    echo "4. Copiar 'anon' public key"
else
    echo -e "${YELLOW}📡 Testando API...${NC}"
    
    # Testar endpoint de simulados
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        "$SUPABASE_URL/rest/v1/simulados?limit=1" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -1)
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Tabela 'simulados' está acessível!${NC}"
        COUNT=$(echo "$BODY" | grep -o 'id_simulado' | wc -l)
        echo "   Registros encontrados: $COUNT"
    else
        echo -e "${RED}❌ Erro ao acessar tabela (HTTP $HTTP_CODE)${NC}"
        echo "   Resposta: $BODY"
    fi
fi

echo ""
echo -e "${YELLOW}🎯 Próximos passos:${NC}"
echo "1. Iniciar servidor: npm run dev (em /app)"
echo "2. Acessar: http://localhost:5173/painel-aluno"
echo "3. Verificar console do navegador (F12)"
echo "4. Clicar em 'Iniciar' para testar simulado"
echo ""
echo -e "${GREEN}✅ Migrações concluídas!${NC}"
