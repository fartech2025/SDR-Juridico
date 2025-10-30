#!/usr/bin/env python3
"""
Script de validação e teste do BancoEnem
Verifica se o projeto está funcionando corretamente
"""

import os
import json
import sqlite3
from pathlib import Path

def test_dependencies():
    """Testa se todas as dependências estão instaladas"""
    print("🔍 Testando dependências...")
    try:
        import fitz
        import PIL
        import pandas
        print("✅ Todas as dependências estão instaladas")
        return True
    except ImportError as e:
        print(f"❌ Erro de dependência: {e}")
        return False

def test_files_structure():
    """Verifica se a estrutura de arquivos está correta"""
    print("\n🔍 Verificando estrutura de arquivos...")
    
    required_files = [
        "main.py",
        "requirements.txt", 
        "README.md",
        ".gitignore"
    ]
    
    optional_files = [
        "2024_PV_impresso_D1_CD1.pdf",
        "enem.db"
    ]
    
    all_good = True
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - OBRIGATÓRIO")
            all_good = False
    
    for file in optional_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"⚠️  {file} - OPCIONAL")
    
    return all_good

def test_output_files():
    """Verifica se os arquivos de saída foram gerados"""
    print("\n🔍 Verificando arquivos de saída...")
    
    output_dir = Path("output")
    if not output_dir.exists():
        print("❌ Pasta output não existe")
        return False
    
    # Verificar JSON
    json_file = output_dir / "enem2024_lc_questions_content.json"
    if json_file.exists():
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                questions_count = len(data.get('questions', []))
                print(f"✅ JSON: {questions_count} questões extraídas")
        except Exception as e:
            print(f"❌ Erro ao ler JSON: {e}")
            return False
    else:
        print("❌ JSON não encontrado")
        return False
    
    # Verificar SQL
    sql_file = output_dir / "enem2024_import.sql"
    if sql_file.exists():
        size_kb = sql_file.stat().st_size / 1024
        print(f"✅ SQL: {size_kb:.1f} KB")
    else:
        print("❌ SQL não encontrado")
        return False
    
    # Verificar imagens
    images_dir = output_dir / "images"
    if images_dir.exists():
        images = list(images_dir.glob("*.png"))
        print(f"✅ Imagens: {len(images)} arquivos PNG")
    else:
        print("❌ Pasta de imagens não encontrada")
        return False
    
    return True

def test_database():
    """Testa se o banco de dados está funcional"""
    print("\n🔍 Testando banco de dados...")
    
    if not os.path.exists("enem.db"):
        print("⚠️  Banco de dados não encontrado")
        return True  # Não é crítico
    
    try:
        conn = sqlite3.connect("enem.db")
        cursor = conn.cursor()
        
        # Verificar se há tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Banco: {len(tables)} tabela(s)")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"   📊 {table[0]}: {count} registros")
        else:
            print("⚠️  Banco vazio")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro no banco: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando validação do projeto BancoEnem\n")
    
    tests = [
        ("Dependências", test_dependencies),
        ("Estrutura de arquivos", test_files_structure),
        ("Arquivos de saída", test_output_files),
        ("Banco de dados", test_database)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"🧪 TESTE: {test_name}")
        print('='*50)
        
        if test_func():
            passed += 1
            print(f"✅ {test_name}: PASSOU")
        else:
            print(f"❌ {test_name}: FALHOU")
    
    print(f"\n{'='*50}")
    print(f"📊 RESULTADO FINAL")
    print('='*50)
    print(f"Testes passaram: {passed}/{total}")
    
    if passed == total:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("🚀 Projeto está pronto para uso!")
    else:
        print("⚠️  Alguns testes falharam")
        print("🔧 Verifique os problemas acima")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)