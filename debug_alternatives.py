#!/usr/bin/env python3
"""
Script para debugar e analisar a estrutura das alternativas
"""

import json
from pathlib import Path

def analyze_question_alternatives():
    """Analisa estrutura das alternativas das questões"""
    
    # Verificar arquivo do Supabase
    output_file = Path("output/enem2024_lc_questions_content.json")
    
    if output_file.exists():
        with open(output_file, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        
        print("🔍 ANÁLISE - Arquivo Original (Supabase)")
        print("="*50)
        
        questions = original_data.get('questions', [])
        for i, question in enumerate(questions[:3]):  # Analisar apenas 3 primeiras
            print(f"\n📝 Questão {i+1} (ID: {question.get('id')})")
            print(f"   Número: {question.get('number')}")
            print(f"   Tema: {question.get('theme')}")
            
            # Analisar conteúdo
            content = question.get('content', [])
            print(f"   Conteúdo: {len(content)} seções")
            
            for j, section in enumerate(content):
                section_type = section.get('type')
                value = section.get('value', '')[:100] + '...' if len(section.get('value', '')) > 100 else section.get('value', '')
                print(f"     {j+1}. {section_type}: {value}")
            
            print(f"   Texto completo: {len(question.get('text_full', ''))} caracteres")
    
    print("\n" + "="*50)
    
    # Verificar arquivo processado
    processed_file = Path("app/src/data/questions_with_images.json")
    
    if processed_file.exists():
        with open(processed_file, 'r', encoding='utf-8') as f:
            processed_data = json.load(f)
        
        print("\n🔍 ANÁLISE - Arquivo Processado (App)")
        print("="*50)
        
        questions = processed_data.get('questions', [])
        print(f"Total de questões processadas: {len(questions)}")
        
        # Analisar questões com IDs únicos
        unique_ids = set()
        duplicate_ids = set()
        
        for question in questions:
            q_id = question.get('id')
            if q_id in unique_ids:
                duplicate_ids.add(q_id)
            else:
                unique_ids.add(q_id)
        
        print(f"IDs únicos: {len(unique_ids)}")
        print(f"IDs duplicados: {len(duplicate_ids)}")
        
        if duplicate_ids:
            print("🚨 IDs duplicados encontrados:")
            for dup_id in list(duplicate_ids)[:5]:  # Mostrar apenas 5
                print(f"   - {dup_id}")

def check_supabase_structure():
    """Verifica como as questões estão estruturadas no formato Supabase"""
    
    # Simular estrutura esperada do Supabase
    expected_structure = {
        "id_questao": "number",
        "nr_questao": "number", 
        "enunciado": "string",
        "dificuldade": "string",
        "tem_imagem": "boolean",
        "alternativas": [
            {
                "id_alternativa": "number",
                "letra": "string", 
                "texto": "string",
                "correta": "boolean"
            }
        ]
    }
    
    print("\n🏗️ ESTRUTURA ESPERADA DO SUPABASE")
    print("="*50)
    print(json.dumps(expected_structure, indent=2))
    
    print("\n💡 PONTOS DE ATENÇÃO:")
    print("- As alternativas devem vir como array de objetos")
    print("- Cada alternativa tem letra (A, B, C, D, E)")
    print("- Apenas uma alternativa deve ter correta=true")
    print("- O texto pode estar em 'texto' ou outro campo")

def main():
    """Função principal"""
    print("🚀 ANÁLISE DE ESTRUTURA DAS QUESTÕES")
    print("="*50)
    
    analyze_question_alternatives()
    check_supabase_structure()
    
    print("\n✅ Análise concluída!")

if __name__ == "__main__":
    main()