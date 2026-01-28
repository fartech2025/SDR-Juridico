#!/bin/bash

# =========================================
# 🚀 DEPLOY SDR JURÍDICO - VERCEL
# =========================================
# Execute este script para fazer deploy
# =========================================

set -e

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   🚀 DEPLOY SDR JURÍDICO - VERCEL             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navegar para o diretório
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

echo -e "${BLUE}📁 Diretório:${NC} $(pwd)"
echo ""

# Verificar se está no git
if [ -d .git ]; then
  echo -e "${GREEN}✅ Repositório Git detectado${NC}"
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo -e "${BLUE}📌 Branch atual:${NC} $BRANCH"
  
  # Verificar se há mudanças não commitadas
  if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Há mudanças não commitadas${NC}"
    echo ""
    git status -s
    echo ""
    read -p "Deseja commitar antes do deploy? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      echo ""
      read -p "Mensagem do commit: " COMMIT_MSG
      git add .
      git commit -m "$COMMIT_MSG"
      echo -e "${GREEN}✅ Commit realizado${NC}"
    fi
  else
    echo -e "${GREEN}✅ Nenhuma mudança pendente${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Não é um repositório Git${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar package.json
if [ -f package.json ]; then
  echo -e "${GREEN}✅ package.json encontrado${NC}"
  PROJECT_NAME=$(node -p "require('./package.json').name")
  echo -e "${BLUE}📦 Projeto:${NC} $PROJECT_NAME"
else
  echo -e "${YELLOW}⚠️  package.json não encontrado${NC}"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar .env
if [ -f .env ]; then
  echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
  echo -e "${BLUE}🔐 Variáveis locais:${NC}"
  grep "^VITE_" .env | sed 's/=.*/=***/' || echo "  Nenhuma variável VITE_ encontrada"
else
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
  echo -e "${YELLOW}   Configure as variáveis no painel da Vercel${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build teste
echo -e "${BLUE}🔨 Executando build de teste...${NC}"
echo ""

if npm run build; then
  echo ""
  echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
  
  # Mostrar tamanho do build
  if [ -d dist ]; then
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo -e "${BLUE}📦 Tamanho do build:${NC} $BUILD_SIZE"
    
    # Contar arquivos
    FILE_COUNT=$(find dist -type f | wc -l | xargs)
    echo -e "${BLUE}📄 Arquivos gerados:${NC} $FILE_COUNT"
  fi
else
  echo ""
  echo -e "${YELLOW}❌ Erro no build${NC}"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Perguntar se quer fazer deploy
echo -e "${YELLOW}📤 Pronto para fazer deploy na Vercel${NC}"
echo ""
read -p "Continuar com o deploy em PRODUÇÃO? (s/N): " -n 1 -r
echo ""
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${BLUE}🚀 Iniciando deploy na Vercel...${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Deploy
  vercel --prod
  
  EXIT_CODE=$?
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ DEPLOY CONCLUÍDO COM SUCESSO!          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🌐 Seu aplicativo está no ar!${NC}"
    echo ""
    echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
    echo ""
    echo "1. ⚙️  Configure as variáveis de ambiente na Vercel:"
    echo "   → Acesse: https://vercel.com/dashboard"
    echo "   → Settings → Environment Variables"
    echo "   → Adicione: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
    echo ""
    echo "2. 🔄 Faça um redeploy para aplicar as variáveis:"
    echo "   → vercel --prod --force"
    echo ""
    echo "3. 🌍 Configure seu domínio customizado (opcional):"
    echo "   → Settings → Domains"
    echo ""
  else
    echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║     ⚠️  DEPLOY CANCELADO OU COM ERRO         ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}💡 Verifique os erros acima e tente novamente${NC}"
  fi
else
  echo ""
  echo -e "${YELLOW}❌ Deploy cancelado pelo usuário${NC}"
  echo ""
  echo -e "${BLUE}💡 Para fazer deploy depois, execute:${NC}"
  echo "   cd \"/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico\""
  echo "   vercel --prod"
fi

echo ""
