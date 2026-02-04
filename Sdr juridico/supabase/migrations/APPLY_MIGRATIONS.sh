#!/bin/bash

# Script para aplicar migrações do SDR Juridico
# Data: 2026-02-03
# Uso: ./APPLY_MIGRATIONS.sh [all|new]

set -e  # Exit on error

echo "=========================================="
echo "SDR Juridico - Aplicador de Migrações SQL"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para aplicar uma migração
apply_migration() {
  local file=$1
  local filename=$(basename "$file")

  echo -e "${BLUE}[→]${NC} Aplicando: $filename"

  if supabase db push "$file"; then
    echo -e "${GREEN}[✓]${NC} Sucesso: $filename"
    return 0
  else
    echo -e "${RED}[✗]${NC} Erro ao aplicar: $filename"
    return 1
  fi
}

# Verificar se está no diretório correto
if [ ! -d "supabase/migrations" ]; then
  echo -e "${RED}Erro: Execute este script da raiz do projeto${NC}"
  exit 1
fi

# Determinar quais migrações aplicar
MODE=${1:-new}

if [ "$MODE" = "new" ]; then
  echo -e "${YELLOW}Aplicando APENAS as novas migrações (2026-02-03)...${NC}"
  echo ""

  MIGRATIONS=(
    "supabase/migrations/20260203_fix_existing_permissions.sql"
    "supabase/migrations/20260203_add_missing_indexes.sql"
    "supabase/migrations/20260203_document_rbac_tables.sql"
    "supabase/migrations/20260203_cleanup_functions.sql"
    "supabase/migrations/20260203_audit_log.sql"
  )

elif [ "$MODE" = "all" ]; then
  echo -e "${YELLOW}Aplicando TODAS as migrações em ordem cronológica...${NC}"
  echo -e "${RED}ATENÇÃO: Isso pode causar erros se migrações base já foram aplicadas!${NC}"
  echo ""
  read -p "Continuar? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi

  # Lista todas as migrações exceto as da pasta archive
  MIGRATIONS=($(find supabase/migrations -maxdepth 1 -name "*.sql" | sort))

else
  echo -e "${RED}Uso: $0 [all|new]${NC}"
  echo ""
  echo "  new  - Aplica apenas migrações de 2026-02-03 (padrão)"
  echo "  all  - Aplica todas as migrações em ordem"
  exit 1
fi

# Aplicar migrações
TOTAL=${#MIGRATIONS[@]}
SUCCESS=0
FAILED=0

echo "Total de migrações a aplicar: $TOTAL"
echo ""

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    if apply_migration "$migration"; then
      ((SUCCESS++))
    else
      ((FAILED++))
      echo ""
      echo -e "${RED}Erro ao aplicar migração. Abortando...${NC}"
      break
    fi
    echo ""
  else
    echo -e "${YELLOW}[!]${NC} Arquivo não encontrado: $migration"
    echo ""
  fi
done

# Resumo
echo "=========================================="
echo "RESUMO"
echo "=========================================="
echo -e "Total de migrações: $TOTAL"
echo -e "${GREEN}Sucesso: $SUCCESS${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Falhas: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Todas as migrações foram aplicadas com sucesso!${NC}"
  echo ""
  echo "Próximos passos:"
  echo "1. Verificar logs do Supabase Dashboard"
  echo "2. Executar queries de verificação (ver README.md)"
  echo "3. Fazer deploy das edge functions corrigidas"
  exit 0
else
  echo -e "${RED}✗ Algumas migrações falharam. Verifique os logs acima.${NC}"
  exit 1
fi
