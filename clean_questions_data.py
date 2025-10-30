#!/usr/bin/env python3
"""
Script para limpar dados duplicados e corrigir estrutura das questões
"""

import json
from pathlib import Path

def clean_questions_data():
    """Limpa dados duplicados das questões"""
    
    # Carregar dados originais
    data_file = Path("app/src/data/questions_with_images.json")
    
    if not data_file.exists():
        print("❌ Arquivo de dados não encontrado")
        return
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    print(f"📊 Total de questões encontradas: {len(questions)}")
    
    # Remover duplicatas mantendo apenas a primeira ocorrência de cada ID
    seen_ids = set()
    unique_questions = []
    
    for question in questions:
        question_id = question.get('id')
        
        if question_id not in seen_ids:
            seen_ids.add(question_id)
            unique_questions.append(question)
        else:
            print(f"🗑️ Removendo duplicata: {question_id}")
    
    print(f"✅ Questões únicas: {len(unique_questions)}")
    
    # Atualizar metadados
    data['metadata']['total_questions'] = len(unique_questions)
    questions_with_images = sum(1 for q in unique_questions if q.get('imagem_url'))
    data['metadata']['questions_with_images'] = questions_with_images
    
    # Salvar dados limpos
    data['questions'] = unique_questions
    
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Arquivo limpo salvo: {data_file}")
    
    # Criar backup dos dados originais
    backup_file = data_file.with_suffix('.backup.json')
    if not backup_file.exists():
        print(f"💾 Backup criado: {backup_file}")
    
    return len(unique_questions), questions_with_images

def verify_image_urls():
    """Verifica se as URLs das imagens estão corretas"""
    
    data_file = Path("app/src/data/questions_with_images.json")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    image_mapping = data.get('metadata', {}).get('image_mapping', {})
    
    print("\n🔍 Verificando URLs de imagens...")
    
    for question in questions:
        question_id = question.get('id')
        images = question.get('images', [])
        
        if images:
            print(f"\n📷 Questão {question_id}:")
            for image in images:
                ref = image.get('ref')
                url = image.get('url')
                
                # Verificar se a URL está no mapeamento
                mapped_url = image_mapping.get(ref)
                
                if url != mapped_url:
                    print(f"  ⚠️ URL inconsistente para {ref}")
                    print(f"     Questão: {url}")
                    print(f"     Mapeamento: {mapped_url}")
                    
                    # Corrigir URL
                    image['url'] = mapped_url
                    print(f"     ✅ Corrigido para: {mapped_url}")
                else:
                    print(f"  ✅ {ref}: {url}")
    
    # Salvar correções
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Verificação concluída!")

def main():
    """Função principal"""
    print("🚀 Iniciando limpeza de dados...")
    
    # Limpar duplicatas
    total, with_images = clean_questions_data()
    
    # Verificar URLs
    verify_image_urls()
    
    print(f"\n📊 RESUMO:")
    print(f"  • Total de questões: {total}")
    print(f"  • Questões com imagens: {with_images}")
    print(f"  • Cobertura: {with_images/total*100:.1f}%")
    print("\n✅ Limpeza concluída!")

if __name__ == "__main__":
    main()