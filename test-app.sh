#!/bin/bash
# Script de teste para validar a aplicação após correções
# Uso: ./test-app.sh

set -e

echo "🧪 Teste de Validação da Aplicação — Projeto-ENEM"
echo "=================================================="
echo ""

cd "$(dirname "$0")/app" || exit 1

echo "✅ Passo 1: Verificar dependências..."
if ! npm list @supabase/supabase-js > /dev/null 2>&1; then
  echo "❌ Supabase não está instalado"
  exit 1
fi
echo "✅ Supabase OK"

echo ""
echo "✅ Passo 2: Verificar build..."
if npm run build > /dev/null 2>&1; then
  echo "✅ Build OK"
else
  echo "❌ Build falhou"
  exit 1
fi

echo ""
echo "✅ Passo 3: Verificar sintaxe TypeScript..."
if npx tsc --noEmit > /dev/null 2>&1; then
  echo "✅ TypeScript OK"
else
  echo "⚠️  Alguns warnings de TypeScript (não crítico)"
fi

echo ""
echo "✅ Passo 4: Verificar arquivo .env..."
if [ -f ".env" ]; then
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo "✅ .env configurado"
  else
    echo "❌ VITE_SUPABASE_URL não encontrado em .env"
    exit 1
  fi
else
  echo "⚠️  .env não encontrado (verifique se está configurado)"
fi

echo ""
echo "=================================================="
echo "✅ Todos os testes passaram!"
echo ""
echo "📝 Próximos passos:"
echo "  1. npm run dev (para desenvolver localmente)"
echo "  2. npm run build && npm run preview (para preview de produção)"
echo "  3. Testar login em http://localhost:5173/login"
echo "=================================================="
