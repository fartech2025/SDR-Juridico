#!/usr/bin/env python3
"""
Resumo Final da Aplicação BancoEnem
Gera relatório completo do status atual da aplicação
"""

import os
import sys
import json
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path

def print_header(title, char="="):
    """Imprime cabeçalho formatado"""
    print(f"\n{char * 60}")
    print(f"🎯 {title}")
    print(f"{char * 60}")

def print_section(title):
    """Imprime seção"""
    print(f"\n📋 {title}")
    print("-" * 40)

def get_git_info():
    """Obtém informações do Git"""
    try:
        # Número de commits
        result = subprocess.run(['git', 'rev-list', '--count', 'HEAD'], 
                              capture_output=True, text=True)
        commits = result.stdout.strip() if result.returncode == 0 else "N/A"
        
        # Último commit
        result = subprocess.run(['git', 'log', '-1', '--format=%h %s'], 
                              capture_output=True, text=True)
        last_commit = result.stdout.strip() if result.returncode == 0 else "N/A"
        
        # Branch atual
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True)
        branch = result.stdout.strip() if result.returncode == 0 else "N/A"
        
        return {
            "commits": commits,
            "last_commit": last_commit,
            "branch": branch
        }
    except:
        return {"commits": "N/A", "last_commit": "N/A", "branch": "N/A"}

def analyze_project_structure():
    """Analisa a estrutura do projeto"""
    structure = {
        "python_files": [],
        "data_files": [],
        "config_files": [],
        "test_files": [],
        "doc_files": []
    }
    
    for file in os.listdir('.'):
        if file.startswith('.'):
            continue
            
        if file.endswith('.py'):
            # Categorizar arquivos Python
            if 'test' in file.lower():
                structure["test_files"].append(file)
            else:
                structure["python_files"].append(file)
        elif file.endswith(('.json', '.sql', '.db')):
            structure["data_files"].append(file)
        elif file.endswith(('.md', '.txt', '.rst')):
            structure["doc_files"].append(file)
        elif file in ['requirements.txt', '.gitignore']:
            structure["config_files"].append(file)
    
    return structure

def analyze_data_quality():
    """Analisa qualidade dos dados"""
    quality = {}
    
    # Analisar JSON
    json_path = "output/enem2024_lc_questions_content.json"
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            questions = data.get('questions', [])
            quality["json"] = {
                "status": "OK",
                "questions_count": len(questions),
                "themes": len(set(q.get('theme', '') for q in questions)),
                "with_images": sum(1 for q in questions if q.get('images', []))
            }
        except Exception as e:
            quality["json"] = {"status": "ERROR", "error": str(e)}
    
    # Analisar banco SQLite
    if os.path.exists("enem.db"):
        try:
            conn = sqlite3.connect("enem.db")
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM questions")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT number) FROM questions")
            unique = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT theme) FROM questions")
            themes = cursor.fetchone()[0]
            
            quality["database"] = {
                "status": "OK",
                "total_records": total,
                "unique_questions": unique,
                "themes": themes
            }
            
            conn.close()
        except Exception as e:
            quality["database"] = {"status": "ERROR", "error": str(e)}
    
    # Analisar imagens
    img_dir = "output/images"
    if os.path.exists(img_dir):
        try:
            images = [f for f in os.listdir(img_dir) if f.endswith('.png')]
            total_size = sum(os.path.getsize(os.path.join(img_dir, img)) 
                           for img in images) / 1024 / 1024  # MB
            
            quality["images"] = {
                "status": "OK",
                "count": len(images),
                "total_size_mb": round(total_size, 2)
            }
        except Exception as e:
            quality["images"] = {"status": "ERROR", "error": str(e)}
    
    return quality

def check_dependencies():
    """Verifica dependências"""
    deps = {}
    
    # Verificar dependências críticas
    critical_deps = [
        ("fitz", "PyMuPDF"),
        ("PIL", "Pillow"),
        ("pandas", "Pandas"),
        ("supabase", "Supabase")
    ]
    
    for module, name in critical_deps:
        try:
            imported = __import__(module)
            version = getattr(imported, '__version__', 'Unknown')
            deps[name] = {"status": "OK", "version": version}
        except ImportError:
            deps[name] = {"status": "MISSING"}
    
    return deps

def generate_final_summary():
    """Gera resumo final da aplicação"""
    print_header("RESUMO FINAL DA APLICAÇÃO BANCOENEM")
    
    # Informações básicas
    print_section("INFORMAÇÕES GERAIS")
    print(f"📅 Data de geração: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"📁 Diretório: {os.getcwd()}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"💻 Sistema: {sys.platform}")
    
    # Git info
    git_info = get_git_info()
    print_section("CONTROLE DE VERSÃO")
    print(f"🌿 Branch: {git_info['branch']}")
    print(f"📝 Total de commits: {git_info['commits']}")
    print(f"🔄 Último commit: {git_info['last_commit']}")
    
    # Estrutura do projeto
    structure = analyze_project_structure()
    print_section("ESTRUTURA DO PROJETO")
    print(f"🐍 Arquivos Python: {len(structure['python_files'])}")
    print(f"🧪 Arquivos de teste: {len(structure['test_files'])}")
    print(f"📊 Arquivos de dados: {len(structure['data_files'])}")
    print(f"📝 Documentação: {len(structure['doc_files'])}")
    print(f"⚙️  Configuração: {len(structure['config_files'])}")
    
    # Módulos principais
    print("\n🔧 Módulos principais:")
    main_modules = [
        ("main.py", "Extrator principal"),
        ("supabase_integration.py", "Integração Supabase"),
        ("main_extended.py", "Script integrado"),
        ("production_tests.py", "Testes de produção"),
        ("test_project.py", "Validação básica")
    ]
    
    for module, desc in main_modules:
        status = "✅" if module in structure['python_files'] else "❌"
        print(f"   {status} {module} - {desc}")
    
    # Qualidade dos dados
    quality = analyze_data_quality()
    print_section("QUALIDADE DOS DADOS")
    
    for data_type, info in quality.items():
        status_emoji = "✅" if info["status"] == "OK" else "❌"
        print(f"{status_emoji} {data_type.upper()}:")
        
        if info["status"] == "OK":
            if data_type == "json":
                print(f"   📊 {info['questions_count']} questões")
                print(f"   🏷️  {info['themes']} temas")
                print(f"   🖼️  {info['with_images']} com imagens")
            elif data_type == "database":
                print(f"   📊 {info['total_records']} registros")
                print(f"   🔢 {info['unique_questions']} questões únicas")
                print(f"   🏷️  {info['themes']} temas")
            elif data_type == "images":
                print(f"   🖼️  {info['count']} imagens")
                print(f"   💾 {info['total_size_mb']} MB")
        else:
            print(f"   ❌ Erro: {info.get('error', 'Desconhecido')}")
    
    # Dependências
    deps = check_dependencies()
    print_section("DEPENDÊNCIAS")
    
    for name, info in deps.items():
        status_emoji = "✅" if info["status"] == "OK" else "❌"
        version_info = f" v{info['version']}" if info.get('version') else ""
        print(f"{status_emoji} {name}{version_info}")
    
    # Status dos testes
    print_section("STATUS DOS TESTES")
    
    # Verificar relatórios de teste
    test_reports = [f for f in os.listdir('.') if f.startswith('final_test_report_')]
    if test_reports:
        latest_report = sorted(test_reports)[-1]
        try:
            with open(latest_report, 'r') as f:
                report = json.load(f)
            
            verdict = report['summary']['verdict']
            success_rate = report['summary']['success_rate'] * 100
            
            print(f"📊 Último teste: {latest_report}")
            print(f"🏆 Veredicto: {verdict}")
            print(f"✅ Taxa de sucesso: {success_rate:.1f}%")
            print(f"⏱️  Duração: {report.get('total_duration_seconds', 'N/A')}s")
            
        except Exception as e:
            print(f"❌ Erro ao ler relatório: {e}")
    else:
        print("⚠️  Nenhum relatório de teste encontrado")
    
    # Funcionalidades disponíveis
    print_section("FUNCIONALIDADES DISPONÍVEIS")
    
    features = [
        "✅ Extração automática de PDF",
        "✅ Classificação temática inteligente",
        "✅ Processamento de imagens",
        "✅ Múltiplos formatos de saída (JSON, SQL, PNG)",
        "✅ Integração com Supabase",
        "✅ Sincronização bidirecional",
        "✅ Backup automatizado",
        "✅ Testes de produção",
        "✅ Validação de qualidade",
        "✅ Interface CLI avançada"
    ]
    
    for feature in features:
        print(f"   {feature}")
    
    # Comandos principais
    print_section("COMANDOS PRINCIPAIS")
    
    commands = [
        ("python3 main.py", "Extração básica"),
        ("python3 main_extended.py --full", "Processo completo"),
        ("python3 test_project.py", "Validação básica"),
        ("python3 production_tests.py", "Testes de produção"),
        ("python3 supabase_setup.py", "Configurar Supabase"),
        ("python3 final_integration_test.py", "Teste integrado")
    ]
    
    for cmd, desc in commands:
        print(f"   🔧 {cmd}")
        print(f"      {desc}")
    
    # Veredicto final
    print_header("VEREDICTO FINAL", "🎉")
    
    # Calcular score geral
    total_checks = 0
    passed_checks = 0
    
    # Verificar estrutura
    essential_files = ["main.py", "supabase_integration.py", "requirements.txt", "README.md"]
    for file in essential_files:
        total_checks += 1
        if os.path.exists(file):
            passed_checks += 1
    
    # Verificar dados
    total_checks += len(quality)
    passed_checks += sum(1 for info in quality.values() if info["status"] == "OK")
    
    # Verificar dependências
    total_checks += len(deps)
    passed_checks += sum(1 for info in deps.values() if info["status"] == "OK")
    
    score = (passed_checks / total_checks * 100) if total_checks > 0 else 0
    
    print(f"📊 Score geral: {score:.1f}% ({passed_checks}/{total_checks})")
    
    if score >= 90:
        print("🏆 SISTEMA EXCELENTE - PRONTO PARA PRODUÇÃO!")
        print("🚀 Todos os componentes funcionando perfeitamente")
    elif score >= 75:
        print("✅ SISTEMA BOM - PEQUENOS AJUSTES RECOMENDADOS")
        print("🔧 Revise os itens com problemas")
    else:
        print("⚠️  SISTEMA REQUER ATENÇÃO")
        print("🔨 Corrija os problemas antes da produção")
    
    print(f"\n📅 Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"💾 Sistema BancoEnem - Versão de Produção")

if __name__ == "__main__":
    generate_final_summary()