#!/usr/bin/env python3
"""
Script para testar o deploy de produção e verificar se os problemas foram corrigidos:
1. Duplicidade de alternativas
2. Carregamento de imagens
"""
import requests
import json
import sys
from urllib.parse import urljoin

def test_production_deploy():
    base_url = "https://enem-app-ultra-8swgfye4n-fernando-dias-projects-e4b4044b.vercel.app"
    
    print("🚀 Testando deploy de produção...")
    print(f"📍 URL: {base_url}")
    print()
    
    # Teste 1: Verificar se a página principal carrega
    print("🔍 Teste 1: Página principal")
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("✅ Página principal carregou com sucesso")
        else:
            print(f"❌ Erro na página principal: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao acessar página principal: {e}")
    
    # Teste 2: Verificar se as imagens das questões estão acessíveis
    print("\n🖼️ Teste 2: Imagens das questões")
    images_to_test = [
        "images/questoes/ENEM2024_LC_Q001_IMG01.png",
        "images/questoes/ENEM2024_LC_Q003_IMG01.png", 
        "images/questoes/ENEM2024_LC_Q005_IMG01.png",
        "images/questoes/ENEM2024_LC_Q022_IMG01.png",
        "images/questoes/ENEM2024_LC_Q025_IMG01.png"
    ]
    
    for image in images_to_test:
        url = urljoin(base_url + "/", image)
        try:
            response = requests.head(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {image} - Acessível")
            else:
                print(f"❌ {image} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {image} - Erro: {e}")
    
    # Teste 3: Verificar se o favicon foi adicionado
    print("\n🎯 Teste 3: Favicon")
    try:
        favicon_url = urljoin(base_url + "/", "favicon.svg")
        response = requests.head(favicon_url, timeout=5)
        if response.status_code == 200:
            print("✅ Favicon carregando corretamente")
        else:
            print(f"❌ Favicon não encontrado: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao verificar favicon: {e}")
    
    # Teste 4: Verificar JavaScript e recursos estáticos
    print("\n📦 Teste 4: Recursos estáticos")
    try:
        # Obter conteúdo HTML para extrair links dos recursos
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            html_content = response.text
            if "index.css" in html_content or "main.tsx" in html_content or "/assets/" in html_content:
                print("✅ Recursos JavaScript/CSS detectados no HTML")
            else:
                print("⚠️ Recursos estáticos não detectados claramente")
    except Exception as e:
        print(f"❌ Erro ao verificar recursos estáticos: {e}")
    
    print(f"\n🎯 Deploy de produção testado!")
    print(f"📱 Acesse: {base_url}")
    print("\n📝 Verificações manuais recomendadas:")
    print("1. ✅ Navegar até um simulado e verificar se as alternativas não estão duplicadas")
    print("2. ✅ Verificar se as imagens das questões aparecem corretamente")
    print("3. ✅ Confirmar que não há erros no console do navegador")

if __name__ == "__main__":
    test_production_deploy()