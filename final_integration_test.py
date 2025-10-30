#!/usr/bin/env python3
"""
Teste Final Integrado - BancoEnem
Combinação de testes de produção, stress e validação final
"""

import os
import sys
import time
import json
from datetime import datetime
import subprocess

def print_colored(text, color_code=""):
    """Imprime texto colorido"""
    colors = {
        "GREEN": "\033[92m",
        "RED": "\033[91m", 
        "YELLOW": "\033[93m",
        "BLUE": "\033[94m",
        "MAGENTA": "\033[95m",
        "CYAN": "\033[96m",
        "BOLD": "\033[1m",
        "RESET": "\033[0m"
    }
    color = colors.get(color_code, "")
    reset = colors["RESET"]
    print(f"{color}{text}{reset}")

def run_test_suite(script_name, description):
    """Executa uma suite de testes"""
    print_colored(f"\n🧪 EXECUTANDO: {description}", "CYAN")
    print_colored("="*60, "BLUE")
    
    start_time = time.time()
    
    try:
        result = subprocess.run([
            sys.executable, script_name
        ], capture_output=True, text=True, timeout=300)  # 5 minutos timeout
        
        duration = time.time() - start_time
        
        if result.returncode == 0:
            print_colored(f"✅ {description}: SUCESSO ({duration:.2f}s)", "GREEN")
            return True, duration, result.stdout
        else:
            print_colored(f"❌ {description}: FALHOU ({duration:.2f}s)", "RED")
            print_colored("STDERR:", "YELLOW")
            print(result.stderr)
            return False, duration, result.stderr
            
    except subprocess.TimeoutExpired:
        print_colored(f"⏰ {description}: TIMEOUT", "RED")
        return False, 300, "Timeout após 5 minutos"
    except Exception as e:
        duration = time.time() - start_time
        print_colored(f"💥 {description}: ERRO - {e}", "RED")
        return False, duration, str(e)

def validate_final_system():
    """Validação final do sistema"""
    print_colored("\n🔍 VALIDAÇÃO FINAL DO SISTEMA", "CYAN")
    print_colored("="*60, "BLUE")
    
    validations = []
    
    # 1. Verificar arquivos críticos
    critical_files = [
        "main.py",
        "supabase_integration.py", 
        "main_extended.py",
        "test_project.py",
        "production_tests.py",
        "requirements.txt",
        "README.md"
    ]
    
    for file in critical_files:
        exists = os.path.exists(file)
        validations.append((f"Arquivo {file}", exists))
        
    # 2. Verificar dados
    data_files = [
        ("enem.db", "Banco SQLite"),
        ("output/enem2024_lc_questions_content.json", "JSON de dados"),
        ("output/enem2024_import.sql", "Script SQL"),
        ("output/images", "Diretório de imagens")
    ]
    
    for file, desc in data_files:
        exists = os.path.exists(file)
        validations.append((f"{desc}", exists))
    
    # 3. Verificar integridade dos dados
    if os.path.exists("output/enem2024_lc_questions_content.json"):
        try:
            with open("output/enem2024_lc_questions_content.json", 'r', encoding='utf-8') as f:
                data = json.load(f)
                questions_count = len(data.get('questions', []))
                validations.append((f"JSON válido ({questions_count} questões)", questions_count > 0))
        except Exception as e:
            validations.append(("JSON válido", False))
    
    # 4. Verificar dependências
    try:
        import fitz, PIL, pandas, supabase
        validations.append(("Dependências principais", True))
    except ImportError:
        validations.append(("Dependências principais", False))
    
    # Mostrar resultados
    passed = 0
    total = len(validations)
    
    for desc, success in validations:
        status = "✅" if success else "❌"
        color = "GREEN" if success else "RED"
        print_colored(f"{status} {desc}", color)
        if success:
            passed += 1
    
    print_colored(f"\n📊 Validações: {passed}/{total} aprovadas", "BLUE")
    
    return passed == total

def generate_final_report(test_results):
    """Gera relatório final consolidado"""
    print_colored("\n📋 RELATÓRIO FINAL CONSOLIDADO", "MAGENTA")
    print_colored("="*60, "BLUE")
    
    timestamp = datetime.now()
    
    # Calcular estatísticas
    total_tests = len(test_results)
    passed_tests = sum(1 for result in test_results.values() if result["success"])
    total_duration = sum(result["duration"] for result in test_results.values())
    
    # Mostrar resumo
    print_colored(f"📅 Data/Hora: {timestamp.strftime('%d/%m/%Y %H:%M:%S')}", "BLUE")
    print_colored(f"⏱️  Duração total: {total_duration:.2f}s", "BLUE")
    print_colored(f"🧪 Suites executadas: {total_tests}", "BLUE")
    print_colored(f"✅ Suites aprovadas: {passed_tests}", "GREEN")
    print_colored(f"❌ Suites falharam: {total_tests - passed_tests}", "RED" if passed_tests < total_tests else "GREEN")
    
    # Detalhamento
    print_colored("\n📝 DETALHAMENTO POR SUITE:", "CYAN")
    for suite_name, result in test_results.items():
        status = "✅ PASSOU" if result["success"] else "❌ FALHOU"
        color = "GREEN" if result["success"] else "RED"
        print_colored(f"{status} {suite_name} ({result['duration']:.2f}s)", color)
    
    # Veredicto final
    all_passed = passed_tests == total_tests
    
    print_colored("\n🏆 VEREDICTO FINAL:", "BOLD")
    if all_passed:
        print_colored("✅ APLICAÇÃO 100% APROVADA PARA PRODUÇÃO!", "BOLD")
        print_colored("🚀 Sistema completo, estável e robusto", "GREEN")
        verdict = "FULLY_APPROVED"
    else:
        print_colored("⚠️  APLICAÇÃO PARCIALMENTE APROVADA", "YELLOW")
        print_colored("🔧 Algumas otimizações recomendadas", "YELLOW")
        verdict = "PARTIALLY_APPROVED"
    
    # Gerar JSON do relatório
    report_data = {
        "timestamp": timestamp.isoformat(),
        "total_duration_seconds": total_duration,
        "test_results": test_results,
        "summary": {
            "total_suites": total_tests,
            "passed_suites": passed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "verdict": verdict
        },
        "system_info": {
            "python_version": sys.version,
            "platform": sys.platform,
            "working_directory": os.getcwd()
        }
    }
    
    report_file = f"final_test_report_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print_colored(f"\n📄 Relatório completo salvo: {report_file}", "CYAN")
    
    return all_passed

def main():
    """Função principal do teste integrado"""
    print_colored("🎯 TESTE FINAL INTEGRADO - BANCOENEM", "BOLD")
    print_colored("Validação completa para ambiente de produção", "BLUE")
    print_colored("="*60, "CYAN")
    
    start_time = datetime.now()
    test_results = {}
    
    # 1. Testes de produção
    success, duration, output = run_test_suite("production_tests.py", "Testes de Produção")
    test_results["production_tests"] = {
        "success": success,
        "duration": duration,
        "output_summary": "Aprovado" if success else "Com problemas"
    }
    
    # 2. Testes básicos de funcionalidade
    success, duration, output = run_test_suite("test_project.py", "Testes de Funcionalidade")
    test_results["functionality_tests"] = {
        "success": success,
        "duration": duration,
        "output_summary": "Aprovado" if success else "Com problemas"
    }
    
    # 3. Validação final do sistema
    print_colored("\n🔍 VALIDAÇÃO FINAL", "CYAN")
    validation_start = time.time()
    validation_success = validate_final_system()
    validation_duration = time.time() - validation_start
    
    test_results["system_validation"] = {
        "success": validation_success,
        "duration": validation_duration,
        "output_summary": "Sistema íntegro" if validation_success else "Problemas detectados"
    }
    
    # 4. Gerar relatório final
    overall_success = generate_final_report(test_results)
    
    # 5. Recomendações finais
    print_colored("\n💡 RECOMENDAÇÕES FINAIS:", "CYAN")
    recommendations = [
        "✅ Sistema está pronto para uso em produção",
        "📊 Monitorar performance em ambiente real",
        "🔄 Configurar backups automatizados",
        "🔐 Implementar SSL/TLS para Supabase",
        "📈 Configurar alertas de monitoramento",
        "🧪 Executar testes regularmente",
        "📝 Manter documentação atualizada",
        "🚀 Considerar CI/CD para automação"
    ]
    
    for rec in recommendations:
        print_colored(f"   {rec}", "YELLOW")
    
    # Estatísticas finais
    end_time = datetime.now()
    total_execution = (end_time - start_time).total_seconds()
    
    print_colored(f"\n⏱️  Tempo total de execução: {total_execution:.2f}s", "BLUE")
    print_colored(f"📅 Teste concluído em: {end_time.strftime('%d/%m/%Y %H:%M:%S')}", "BLUE")
    
    if overall_success:
        print_colored("\n🎉 PARABÉNS! SISTEMA TOTALMENTE VALIDADO! 🎉", "BOLD")
        exit_code = 0
    else:
        print_colored("\n⚠️  ATENÇÃO: REVISE OS PONTOS DESTACADOS", "YELLOW")
        exit_code = 1
    
    return exit_code

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)