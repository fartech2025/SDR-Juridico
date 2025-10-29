#!/usr/bin/env python3
"""
Script para testar a aplicação em produção
"""

import requests
import json
from pathlib import Path

def test_production_app():
    """Testa a aplicação em produção"""
    
    production_url = "https://enem-app-ultra-ixsws26r1-fernando-dias-projects-e4b4044b.vercel.app"
    
    print(f"🌐 Testando aplicação em produção: {production_url}")
    
    # Testar página principal
    try:
        response = requests.get(production_url, timeout=10)
        if response.status_code == 200:
            print("✅ Página principal carregando")
        else:
            print(f"❌ Erro na página principal: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao acessar página principal: {e}")
    
    # Testar acesso às imagens
    image_urls = [
        f"{production_url}/images/questoes/ENEM2024_LC_Q001_IMG01.png",
        f"{production_url}/images/questoes/ENEM2024_LC_Q003_IMG01.png", 
        f"{production_url}/images/questoes/ENEM2024_LC_Q005_IMG01.png"
    ]
    
    print("\n🖼️ Testando imagens:")
    for url in image_urls:
        try:
            response = requests.head(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {url.split('/')[-1]}: Disponível")
            else:
                print(f"❌ {url.split('/')[-1]}: {response.status_code}")
        except Exception as e:
            print(f"❌ {url.split('/')[-1]}: Erro - {e}")

def check_local_images():
    """Verifica se as imagens estão no diretório local"""
    
    images_dir = Path("app/public/images/questoes")
    
    print(f"\n📁 Verificando imagens locais em: {images_dir}")
    
    if not images_dir.exists():
        print("❌ Diretório de imagens não encontrado")
        return
    
    images = list(images_dir.glob("*.png"))
    print(f"✅ {len(images)} imagens encontradas:")
    
    for image in images[:5]:  # Mostrar apenas 5
        print(f"  - {image.name}")
    
    if len(images) > 5:
        print(f"  ... e mais {len(images) - 5} imagens")

def generate_test_report():
    """Gera relatório de teste"""
    
    print("\n📊 RELATÓRIO DE TESTE")
    print("="*50)
    
    # Verificar build info
    dist_dir = Path("app/dist")
    if dist_dir.exists():
        assets = list(dist_dir.glob("**/*"))
        print(f"✅ Build gerado: {len(assets)} arquivos")
    else:
        print("❌ Build não encontrado")
    
    # Verificar dados
    data_file = Path("app/src/data/questions_with_images.json")
    if data_file.exists():
        with open(data_file, 'r') as f:
            data = json.load(f)
        
        total_questions = data.get('metadata', {}).get('total_questions', 0)
        questions_with_images = data.get('metadata', {}).get('questions_with_images', 0)
        
        print(f"✅ Dados carregados: {total_questions} questões")
        print(f"✅ Com imagens: {questions_with_images} questões")
    else:
        print("❌ Arquivo de dados não encontrado")

def main():
    """Função principal"""
    print("🚀 TESTE DA APLICAÇÃO EM PRODUÇÃO")
    print("="*50)
    
    check_local_images()
    test_production_app()
    generate_test_report()
    
    print("\n✅ Teste concluído!")

if __name__ == "__main__":
    main()