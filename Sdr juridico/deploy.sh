#!/bin/bash

# Script de Deploy Automático para Vercel
# SDR Jurídico - Deploy em Produção

echo "🚀 Iniciando deploy do SDR Jurídico na Vercel..."
echo ""

# Navegar para o diretório do projeto
cd "/Users/fernandodias/Desktop/SDR JURIDICO/Sdr juridico"

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

echo ""
echo "🔨 Construindo o projeto..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build concluído com sucesso!"
  echo ""
  echo "📤 Executando deploy na Vercel..."
  echo ""
  
  # Deploy na Vercel
  vercel --prod
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🌐 Seu aplicativo está sendo deployado na Vercel"
    echo "🔗 Aguarde a URL de produção ser gerada..."
  else
    echo ""
    echo "❌ Erro ao fazer deploy na Vercel"
    exit 1
  fi
else
  echo ""
  echo "❌ Erro ao construir o projeto"
  exit 1
fi
