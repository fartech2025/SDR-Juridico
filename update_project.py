#!/usr/bin/env python3
"""
Script de atualização automática do BancoEnem
Automatiza o processo de atualização e sincronização
"""

import subprocess
import sys
import os
from datetime import datetime

def run_command(cmd, description):
    """Executa um comando e retorna o resultado"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description}")
            if result.stdout.strip():
                print(f"   📝 {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Erro em {description}")
            print(f"   ⚠️  {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"❌ Exceção em {description}: {e}")
        return False

def update_dependencies():
    """Atualiza as dependências do projeto"""
    print("\n📦 ATUALIZANDO DEPENDÊNCIAS")
    print("="*50)
    
    commands = [
        ("pip install --upgrade pip", "Atualizando pip"),
        ("pip install -r requirements.txt --upgrade", "Atualizando dependências"),
        ("pip list | grep -E '(PyMuPDF|Pillow|pandas)'", "Verificando versões")
    ]
    
    all_success = True
    for cmd, desc in commands:
        if not run_command(cmd, desc):
            all_success = False
    
    return all_success

def check_git_status():
    """Verifica o status do Git"""
    print("\n🔍 VERIFICANDO STATUS DO GIT")
    print("="*50)
    
    commands = [
        ("git status --porcelain", "Verificando mudanças"),
        ("git log --oneline -5", "Últimos commits"),
        ("git branch", "Branch atual")
    ]
    
    for cmd, desc in commands:
        run_command(cmd, desc)

def create_backup():
    """Cria backup dos arquivos importantes"""
    print("\n💾 CRIANDO BACKUP")
    print("="*50)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_{timestamp}"
    
    # Criar diretório de backup
    os.makedirs(backup_dir, exist_ok=True)
    
    # Arquivos importantes para backup
    important_files = [
        "main.py",
        "enem.db",
        "output/enem2024_lc_questions_content.json",
        "output/enem2024_import.sql"
    ]
    
    for file in important_files:
        if os.path.exists(file):
            cmd = f"cp -r {file} {backup_dir}/"
            run_command(cmd, f"Backup de {file}")
    
    print(f"✅ Backup criado em: {backup_dir}")
    return backup_dir

def run_tests():
    """Executa os testes do projeto"""
    print("\n🧪 EXECUTANDO TESTES")
    print("="*50)
    
    if os.path.exists("test_project.py"):
        # Tentar python3 primeiro, depois python
        for python_cmd in ["python3", "python"]:
            result = subprocess.run(f"which {python_cmd}", shell=True, capture_output=True)
            if result.returncode == 0:
                return run_command(f"{python_cmd} test_project.py", "Validação do projeto")
        
        print("❌ Nenhum interpretador Python encontrado")
        return False
    else:
        print("⚠️  Script de teste não encontrado")
        return True

def update_project():
    """Executa uma nova extração se necessário"""
    print("\n🔄 VERIFICANDO NECESSIDADE DE ATUALIZAÇÃO")
    print("="*50)
    
    # Verificar se há PDF e se a saída existe
    pdf_exists = os.path.exists("2024_PV_impresso_D1_CD1.pdf")
    output_exists = os.path.exists("output/enem2024_lc_questions_content.json")
    
    if pdf_exists and not output_exists:
        print("📄 PDF encontrado mas saída não existe")
        response = input("Deseja executar a extração? (s/N): ").lower()
        if response == 's':
            # Tentar python3 primeiro, depois python
            for python_cmd in ["python3", "python"]:
                result = subprocess.run(f"which {python_cmd}", shell=True, capture_output=True)
                if result.returncode == 0:
                    return run_command(f"{python_cmd} main.py", "Executando extração")
            print("❌ Nenhum interpretador Python encontrado")
            return False
    elif pdf_exists and output_exists:
        print("✅ PDF e saída já existem")
        pdf_time = os.path.getmtime("2024_PV_impresso_D1_CD1.pdf")
        output_time = os.path.getmtime("output/enem2024_lc_questions_content.json")
        
        if pdf_time > output_time:
            print("📄 PDF é mais recente que a saída")
            response = input("Deseja re-executar a extração? (s/N): ").lower()
            if response == 's':
                # Tentar python3 primeiro, depois python
                for python_cmd in ["python3", "python"]:
                    result = subprocess.run(f"which {python_cmd}", shell=True, capture_output=True)
                    if result.returncode == 0:
                        return run_command(f"{python_cmd} main.py", "Re-executando extração")
                print("❌ Nenhum interpretador Python encontrado")
                return False
        else:
            print("✅ Saída está atualizada")
    else:
        print("⚠️  PDF não encontrado")
    
    return True

def main():
    """Função principal de atualização"""
    print("🚀 SCRIPT DE ATUALIZAÇÃO BANCOENEM")
    print("="*50)
    print(f"📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("="*50)
    
    steps = [
        ("Backup", create_backup),
        ("Status Git", check_git_status),
        ("Dependências", update_dependencies),
        ("Projeto", update_project),
        ("Testes", run_tests)
    ]
    
    success_count = 0
    backup_created = False
    
    for step_name, step_func in steps:
        print(f"\n🔄 EXECUTANDO: {step_name}")
        try:
            result = step_func()
            if step_name == "Backup":
                backup_created = result if isinstance(result, str) else True
            if result:
                success_count += 1
                print(f"✅ {step_name}: CONCLUÍDO")
            else:
                print(f"❌ {step_name}: FALHOU")
        except Exception as e:
            print(f"❌ Erro em {step_name}: {e}")
    
    print(f"\n{'='*50}")
    print("📊 RESUMO DA ATUALIZAÇÃO")
    print('='*50)
    print(f"Etapas concluídas: {success_count}/{len(steps)}")
    
    if backup_created:
        print(f"💾 Backup disponível")
    
    if success_count == len(steps):
        print("🎉 ATUALIZAÇÃO COMPLETA!")
        print("🚀 Projeto está atualizado e pronto!")
    else:
        print("⚠️  Algumas etapas falharam")
        print("🔧 Verifique os erros acima")
    
    print("\n📋 PRÓXIMOS PASSOS SUGERIDOS:")
    print("   1. Verificar se todas as dependências estão corretas")
    print("   2. Testar o funcionamento do main.py")
    print("   3. Fazer commit das mudanças se necessário")
    
    return success_count == len(steps)

if __name__ == "__main__":
    success = main()
    print(f"\n🏁 Script finalizado {'com sucesso' if success else 'com erros'}")
    exit(0 if success else 1)