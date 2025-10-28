#!/bin/bash
# Script para fazer push para o repositório colaborativo

echo "🚀 Fazendo push para repositório colaborativo..."
echo "📂 Repositório: https://github.com/AlanMerlini/Projeto-ENEM"
echo "👥 Projeto colaborativo"
echo ""

# Fazer push
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "🌐 Aplicação estará disponível em:"
    echo "https://alanmerlini.github.io/Projeto-ENEM/"
    echo ""
    echo "⏱️  O deploy pode levar 2-5 minutos na primeira vez."
    echo ""
    echo "🔍 Verificar status do deploy:"
    echo "https://github.com/AlanMerlini/Projeto-ENEM/actions"
    echo ""
    echo "⚙️  Configurar GitHub Pages:"
    echo "https://github.com/AlanMerlini/Projeto-ENEM/settings/pages"
else
    echo ""
    echo "❌ Erro no push. Possíveis causas:"
    echo "• Sem permissão no repositório"
    echo "• Repositório não existe"
    echo "• Conflitos de merge"
    echo ""
    echo "💡 Verificar repositório:"
    echo "https://github.com/AlanMerlini/Projeto-ENEM"
fi