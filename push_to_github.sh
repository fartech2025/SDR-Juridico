#!/bin/bash
# Script para fazer push após criação do repositório GitHub

echo "🚀 Fazendo push para GitHub..."
echo "📂 Repositório: https://github.com/frpdias/BancoEnem"
echo ""

# Fazer push
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "🌐 Sua aplicação estará disponível em:"
    echo "https://frpdias.github.io/BancoEnem/"
    echo ""
    echo "⏱️  O deploy pode levar 2-5 minutos na primeira vez."
    echo ""
    echo "🔍 Verificar status do deploy:"
    echo "https://github.com/frpdias/BancoEnem/actions"
    echo ""
    echo "⚙️  Configurar GitHub Pages:"
    echo "https://github.com/frpdias/BancoEnem/settings/pages"
else
    echo ""
    echo "❌ Erro no push. Verifique se o repositório foi criado:"
    echo "https://github.com/frpdias/BancoEnem"
    echo ""
    echo "💡 Se o repositório não existir, crie em:"
    echo "https://github.com/new"
fi