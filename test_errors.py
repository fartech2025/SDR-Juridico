#!/usr/bin/env python3
"""
Script para testar recursos da aplicação e verificar se há erros 404
"""
import requests
import sys
from urllib.parse import urljoin

def test_resources():
    base_url = "http://localhost:5173/"
    
    resources_to_test = [
        "",  # página principal
        "favicon.svg",
        "src/main.tsx",
        "src/index.css",
        "images/questoes/ENEM2024_LC_Q001_IMG01.png"
    ]
    
    print("🔍 Testando recursos da aplicação...")
    
    for resource in resources_to_test:
        url = urljoin(base_url, resource)
        try:
            response = requests.get(url, timeout=5)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {response.status_code} - {url}")
            
            if response.status_code == 404:
                print(f"   ⚠️  Recurso não encontrado: {resource}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao acessar {url}: {e}")
    
    print("\n📱 Aplicação deve estar funcionando em: http://localhost:5173/")

if __name__ == "__main__":
    test_resources()