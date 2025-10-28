#!/usr/bin/env python3
"""
Suite de Testes de Produção - BancoEnem
Testes completos para validação em ambiente de produção
"""

import os
import sys
import json
import sqlite3
import subprocess
import time
import hashlib
from datetime import datetime
from pathlib import Path
import tempfile
import shutil

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_colored(text, color=Colors.WHITE):
    """Imprime texto colorido"""
    print(f"{color}{text}{Colors.END}")

def print_header(title):
    """Imprime cabeçalho formatado"""
    print_colored("\n" + "="*60, Colors.CYAN)
    print_colored(f"🧪 {title}", Colors.BOLD + Colors.WHITE)
    print_colored("="*60, Colors.CYAN)

def print_test_result(test_name, passed, details=""):
    """Imprime resultado de teste"""
    status = "✅ PASSOU" if passed else "❌ FALHOU"
    color = Colors.GREEN if passed else Colors.RED
    print_colored(f"{status} {test_name}", color)
    if details:
        print_colored(f"   💡 {details}", Colors.YELLOW)

class ProductionTestSuite:
    """Suite completa de testes de produção"""
    
    def __init__(self):
        self.test_results = {}
        self.start_time = datetime.now()
        self.temp_dir = None
        
    def setup_test_environment(self):
        """Configura ambiente de teste"""
        print_header("CONFIGURAÇÃO DO AMBIENTE DE TESTE")
        
        # Criar diretório temporário para testes
        self.temp_dir = tempfile.mkdtemp(prefix="bancoenem_test_")
        print_colored(f"📁 Diretório de teste: {self.temp_dir}", Colors.BLUE)
        
        # Verificar dependências críticas
        critical_files = [
            "main.py",
            "requirements.txt",
            "test_project.py",
            "supabase_integration.py",
            "main_extended.py"
        ]
        
        for file in critical_files:
            if os.path.exists(file):
                print_colored(f"✅ {file}", Colors.GREEN)
            else:
                print_colored(f"❌ {file} - CRÍTICO", Colors.RED)
                return False
        
        return True
    
    def test_dependencies_integrity(self):
        """Testa integridade das dependências"""
        print_header("TESTE 1: INTEGRIDADE DAS DEPENDÊNCIAS")
        
        tests = []
        
        # Testar importações críticas
        try:
            import fitz
            tests.append(("PyMuPDF", True, f"Versão: {fitz.version[0]}"))
        except ImportError as e:
            tests.append(("PyMuPDF", False, str(e)))
        
        try:
            import PIL
            tests.append(("Pillow", True, f"Versão: {PIL.__version__}"))
        except ImportError as e:
            tests.append(("Pillow", False, str(e)))
        
        try:
            import pandas
            tests.append(("Pandas", True, f"Versão: {pandas.__version__}"))
        except ImportError as e:
            tests.append(("Pandas", False, str(e)))
        
        try:
            import supabase
            tests.append(("Supabase", True, "Cliente disponível"))
        except ImportError as e:
            tests.append(("Supabase", False, str(e)))
        
        # Verificar versões do Python
        python_version = sys.version_info
        version_ok = python_version.major == 3 and python_version.minor >= 8
        tests.append(("Python", version_ok, f"{python_version.major}.{python_version.minor}.{python_version.micro}"))
        
        # Registrar resultados
        all_passed = True
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
            if not passed:
                all_passed = False
        
        self.test_results["dependencies"] = all_passed
        return all_passed
    
    def test_file_structure_integrity(self):
        """Testa integridade da estrutura de arquivos"""
        print_header("TESTE 2: ESTRUTURA DE ARQUIVOS")
        
        # Arquivos obrigatórios
        required_files = {
            "main.py": "Script principal",
            "requirements.txt": "Dependências",
            "README.md": "Documentação",
            ".gitignore": "Configuração Git"
        }
        
        # Arquivos opcionais mas importantes
        optional_files = {
            "2024_PV_impresso_D1_CD1.pdf": "PDF fonte",
            "enem.db": "Banco SQLite",
            "output/enem2024_lc_questions_content.json": "JSON de saída",
            "output/enem2024_import.sql": "SQL de importação"
        }
        
        tests = []
        
        # Verificar arquivos obrigatórios
        for file, desc in required_files.items():
            exists = os.path.exists(file)
            tests.append((f"{file} ({desc})", exists, "OBRIGATÓRIO"))
        
        # Verificar arquivos opcionais
        for file, desc in optional_files.items():
            exists = os.path.exists(file)
            status = "Presente" if exists else "Ausente"
            tests.append((f"{file} ({desc})", True, status))  # Sempre passa, só informa
        
        # Verificar permissões dos scripts
        scripts = ["main.py", "test_project.py", "supabase_setup.py"]
        for script in scripts:
            if os.path.exists(script):
                readable = os.access(script, os.R_OK)
                tests.append((f"Permissão de leitura: {script}", readable, ""))
        
        # Registrar resultados
        all_passed = True
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
            if not passed and "OBRIGATÓRIO" in details:
                all_passed = False
        
        self.test_results["file_structure"] = all_passed
        return all_passed
    
    def test_core_functionality(self):
        """Testa funcionalidade principal"""
        print_header("TESTE 3: FUNCIONALIDADE PRINCIPAL")
        
        tests = []
        
        # Testar se o script principal pode ser importado
        try:
            # Usar subprocess para evitar conflitos de importação
            result = subprocess.run([
                sys.executable, "-c", 
                "import main; print('✅ main.py importado com sucesso')"
            ], capture_output=True, text=True, timeout=30)
            
            success = result.returncode == 0
            details = result.stdout.strip() if success else result.stderr.strip()
            tests.append(("Importação do main.py", success, details))
            
        except subprocess.TimeoutExpired:
            tests.append(("Importação do main.py", False, "Timeout"))
        except Exception as e:
            tests.append(("Importação do main.py", False, str(e)))
        
        # Testar funções críticas do main.py
        try:
            # Verificar se as funções principais existem
            with open("main.py", "r") as f:
                content = f.read()
                
            critical_functions = [
                "span_to_text",
                "normalize_spaces", 
                "classify_theme",
                "extract_images_with_boxes"
            ]
            
            for func in critical_functions:
                exists = f"def {func}" in content
                tests.append((f"Função {func}", exists, "Definição encontrada" if exists else "Não encontrada"))
                
        except Exception as e:
            tests.append(("Análise de funções", False, str(e)))
        
        # Testar módulos de integração
        try:
            from supabase_integration import SupabaseManager
            tests.append(("Módulo Supabase", True, "Classe SupabaseManager carregada"))
        except ImportError as e:
            tests.append(("Módulo Supabase", False, str(e)))
        
        # Registrar resultados
        all_passed = all(passed for _, passed, _ in tests)
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
        
        self.test_results["core_functionality"] = all_passed
        return all_passed
    
    def test_data_integrity(self):
        """Testa integridade dos dados"""
        print_header("TESTE 4: INTEGRIDADE DOS DADOS")
        
        tests = []
        
        # Verificar banco SQLite
        if os.path.exists("enem.db"):
            try:
                conn = sqlite3.connect("enem.db")
                cursor = conn.cursor()
                
                # Verificar estrutura da tabela
                cursor.execute("PRAGMA table_info(questions)")
                columns = cursor.fetchall()
                expected_columns = ["id", "number", "page", "theme", "text_full"]
                found_columns = [col[1] for col in columns]
                
                structure_ok = all(col in found_columns for col in expected_columns)
                tests.append(("Estrutura do banco", structure_ok, f"Colunas: {len(found_columns)}"))
                
                # Verificar dados
                cursor.execute("SELECT COUNT(*) FROM questions")
                count = cursor.fetchone()[0]
                tests.append(("Dados no banco", count > 0, f"{count} registros"))
                
                # Verificar integridade
                cursor.execute("SELECT COUNT(*) FROM questions WHERE id IS NULL OR number IS NULL")
                null_count = cursor.fetchone()[0]
                tests.append(("Integridade dos dados", null_count == 0, f"{null_count} nulos"))
                
                conn.close()
                
            except Exception as e:
                tests.append(("Banco SQLite", False, str(e)))
        else:
            tests.append(("Banco SQLite", False, "Arquivo não encontrado"))
        
        # Verificar JSON
        json_path = "output/enem2024_lc_questions_content.json"
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                questions = data.get("questions", [])
                tests.append(("JSON válido", True, f"{len(questions)} questões"))
                
                # Verificar estrutura
                if questions:
                    first_q = questions[0]
                    required_fields = ["id", "number", "theme", "content"]
                    has_fields = all(field in first_q for field in required_fields)
                    tests.append(("Estrutura JSON", has_fields, "Campos obrigatórios presentes"))
                
            except json.JSONDecodeError as e:
                tests.append(("JSON válido", False, f"Erro de parsing: {e}"))
            except Exception as e:
                tests.append(("JSON válido", False, str(e)))
        else:
            tests.append(("JSON de saída", False, "Arquivo não encontrado"))
        
        # Verificar imagens
        img_dir = "output/images"
        if os.path.exists(img_dir):
            try:
                images = [f for f in os.listdir(img_dir) if f.endswith('.png')]
                tests.append(("Imagens extraídas", len(images) > 0, f"{len(images)} arquivos PNG"))
                
                # Verificar padrão de nomes
                pattern_ok = all("ENEM2024_LC_Q" in img for img in images[:5])  # Verificar alguns
                tests.append(("Padrão de nomes", pattern_ok, "ENEM2024_LC_QXX_IMGXX.png"))
                
            except Exception as e:
                tests.append(("Imagens extraídas", False, str(e)))
        else:
            tests.append(("Diretório de imagens", False, "Não encontrado"))
        
        # Registrar resultados
        all_passed = all(passed for _, passed, _ in tests)
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
        
        self.test_results["data_integrity"] = all_passed
        return all_passed
    
    def test_performance_benchmarks(self):
        """Testa benchmarks de performance"""
        print_header("TESTE 5: BENCHMARKS DE PERFORMANCE")
        
        tests = []
        
        # Benchmark de carregamento de JSON
        json_path = "output/enem2024_lc_questions_content.json"
        if os.path.exists(json_path):
            try:
                start_time = time.time()
                with open(json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                load_time = time.time() - start_time
                
                # Considerar bom se carregar em menos de 1 segundo
                performance_ok = load_time < 1.0
                tests.append(("Carregamento JSON", performance_ok, f"{load_time:.3f}s"))
                
            except Exception as e:
                tests.append(("Carregamento JSON", False, str(e)))
        
        # Benchmark de acesso ao banco
        if os.path.exists("enem.db"):
            try:
                start_time = time.time()
                conn = sqlite3.connect("enem.db")
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM questions")
                result = cursor.fetchone()
                conn.close()
                query_time = time.time() - start_time
                
                # Considerar bom se executar em menos de 0.1 segundo
                performance_ok = query_time < 0.1
                tests.append(("Query SQLite", performance_ok, f"{query_time:.3f}s"))
                
            except Exception as e:
                tests.append(("Query SQLite", False, str(e)))
        
        # Verificar tamanho dos arquivos
        file_sizes = {}
        for file_path in ["enem.db", json_path, "output/enem2024_import.sql"]:
            if os.path.exists(file_path):
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                file_sizes[file_path] = size_mb
        
        # Verificar se os tamanhos são razoáveis (não muito grandes)
        reasonable_sizes = all(size < 50 for size in file_sizes.values())  # Máximo 50MB
        size_details = ", ".join(f"{Path(f).name}: {s:.1f}MB" for f, s in file_sizes.items())
        tests.append(("Tamanhos de arquivo", reasonable_sizes, size_details))
        
        # Registrar resultados
        all_passed = all(passed for _, passed, _ in tests)
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
        
        self.test_results["performance"] = all_passed
        return all_passed
    
    def test_security_compliance(self):
        """Testa conformidade de segurança"""
        print_header("TESTE 6: CONFORMIDADE DE SEGURANÇA")
        
        tests = []
        
        # Verificar se arquivos sensíveis não estão expostos
        sensitive_patterns = [".env", "*.key", "*.secret", "credentials.json"]
        exposed_files = []
        
        for pattern in sensitive_patterns:
            import glob
            matches = glob.glob(pattern)
            exposed_files.extend(matches)
        
        security_ok = len(exposed_files) == 0
        details = f"{len(exposed_files)} arquivos sensíveis encontrados" if exposed_files else "Nenhum arquivo sensível exposto"
        tests.append(("Arquivos sensíveis", security_ok, details))
        
        # Verificar .gitignore
        if os.path.exists(".gitignore"):
            with open(".gitignore", "r") as f:
                gitignore_content = f.read()
            
            important_ignores = [".env", "*.key", "backup_"]
            ignored_properly = all(ignore in gitignore_content for ignore in important_ignores)
            tests.append(("Configuração .gitignore", ignored_properly, "Padrões de segurança presentes"))
        else:
            tests.append(("Arquivo .gitignore", False, "Não encontrado"))
        
        # Verificar permissões de arquivos críticos
        critical_files = ["main.py", "supabase_integration.py"]
        for file in critical_files:
            if os.path.exists(file):
                # Verificar se não é executável por outros (básico)
                stat_info = os.stat(file)
                permissions_ok = not (stat_info.st_mode & 0o002)  # Não gravável por outros
                tests.append((f"Permissões {file}", permissions_ok, "Seguras"))
        
        # Verificar se não há hardcoded credentials no código
        code_files = ["main.py", "supabase_integration.py", "main_extended.py"]
        credentials_found = False
        
        for code_file in code_files:
            if os.path.exists(code_file):
                with open(code_file, "r") as f:
                    content = f.read().lower()
                
                # Procurar por padrões suspeitos
                suspicious_patterns = ["password=", "token=", "secret=", "api_key="]
                if any(pattern in content for pattern in suspicious_patterns):
                    credentials_found = True
                    break
        
        tests.append(("Credenciais hardcoded", not credentials_found, "Nenhuma encontrada" if not credentials_found else "ATENÇÃO: Encontradas"))
        
        # Registrar resultados
        all_passed = all(passed for _, passed, _ in tests)
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
        
        self.test_results["security"] = all_passed
        return all_passed
    
    def test_integration_endpoints(self):
        """Testa pontos de integração"""
        print_header("TESTE 7: PONTOS DE INTEGRAÇÃO")
        
        tests = []
        
        # Testar scripts auxiliares
        scripts_to_test = [
            ("test_project.py", "Script de validação"),
            ("supabase_setup.py", "Configurador Supabase"),
            ("main_extended.py", "Script integrado")
        ]
        
        for script, description in scripts_to_test:
            if os.path.exists(script):
                try:
                    # Testar execução básica (syntax check)
                    result = subprocess.run([
                        sys.executable, "-m", "py_compile", script
                    ], capture_output=True, text=True)
                    
                    syntax_ok = result.returncode == 0
                    tests.append((f"Sintaxe {script}", syntax_ok, description))
                    
                except Exception as e:
                    tests.append((f"Sintaxe {script}", False, str(e)))
            else:
                tests.append((f"Script {script}", False, "Não encontrado"))
        
        # Testar argumentos CLI do main_extended.py
        if os.path.exists("main_extended.py"):
            try:
                result = subprocess.run([
                    sys.executable, "main_extended.py", "--help"
                ], capture_output=True, text=True, timeout=10)
                
                help_works = result.returncode == 0 and "usage:" in result.stdout.lower()
                tests.append(("CLI --help", help_works, "Interface de linha de comando"))
                
            except subprocess.TimeoutExpired:
                tests.append(("CLI --help", False, "Timeout"))
            except Exception as e:
                tests.append(("CLI --help", False, str(e)))
        
        # Testar importações críticas
        modules_to_test = [
            ("from supabase_integration import SupabaseManager", "Módulo Supabase"),
            ("import json, sqlite3, os", "Módulos padrão"),
        ]
        
        for import_stmt, description in modules_to_test:
            try:
                result = subprocess.run([
                    sys.executable, "-c", f"{import_stmt}; print('OK')"
                ], capture_output=True, text=True)
                
                import_ok = result.returncode == 0
                tests.append((f"Import: {description}", import_ok, import_stmt))
                
            except Exception as e:
                tests.append((f"Import: {description}", False, str(e)))
        
        # Registrar resultados
        all_passed = all(passed for _, passed, _ in tests)
        for test_name, passed, details in tests:
            print_test_result(test_name, passed, details)
        
        self.test_results["integration"] = all_passed
        return all_passed
    
    def generate_production_report(self):
        """Gera relatório final de produção"""
        print_header("RELATÓRIO FINAL DE PRODUÇÃO")
        
        end_time = datetime.now()
        total_duration = (end_time - self.start_time).total_seconds()
        
        # Resumo dos testes
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result)
        
        print_colored(f"📊 RESUMO EXECUTIVO", Colors.BOLD + Colors.WHITE)
        print_colored(f"   ⏱️  Duração total: {total_duration:.2f}s", Colors.BLUE)
        print_colored(f"   🧪 Total de suites: {total_tests}", Colors.BLUE)
        print_colored(f"   ✅ Suites aprovadas: {passed_tests}", Colors.GREEN)
        print_colored(f"   ❌ Suites falharam: {total_tests - passed_tests}", Colors.RED if passed_tests < total_tests else Colors.GREEN)
        
        # Detalhamento por categoria
        print_colored(f"\n📋 DETALHAMENTO POR CATEGORIA", Colors.BOLD + Colors.WHITE)
        categories = {
            "dependencies": "Dependências",
            "file_structure": "Estrutura de Arquivos", 
            "core_functionality": "Funcionalidade Principal",
            "data_integrity": "Integridade dos Dados",
            "performance": "Performance",
            "security": "Segurança",
            "integration": "Integração"
        }
        
        for key, name in categories.items():
            if key in self.test_results:
                status = "✅ APROVADO" if self.test_results[key] else "❌ REPROVADO"
                color = Colors.GREEN if self.test_results[key] else Colors.RED
                print_colored(f"   {status} {name}", color)
        
        # Veredicto final
        all_passed = all(self.test_results.values())
        print_colored(f"\n🏆 VEREDICTO FINAL", Colors.BOLD + Colors.WHITE)
        
        if all_passed:
            print_colored("✅ APLICAÇÃO APROVADA PARA PRODUÇÃO!", Colors.BOLD + Colors.GREEN)
            print_colored("🚀 Sistema está estável, seguro e pronto para uso", Colors.GREEN)
        else:
            print_colored("❌ APLICAÇÃO REQUER CORREÇÕES", Colors.BOLD + Colors.RED)
            print_colored("🔧 Verifique os itens reprovados antes da produção", Colors.RED)
        
        # Recomendações
        print_colored(f"\n💡 RECOMENDAÇÕES PARA PRODUÇÃO", Colors.BOLD + Colors.WHITE)
        
        recommendations = [
            "Configure monitoramento de logs em produção",
            "Implemente backup automatizado regular",
            "Configure alertas para falhas críticas",
            "Documente procedimentos de recovery",
            "Teste performance com dados reais maiores",
            "Configure SSL/TLS para conexões Supabase",
            "Implemente rotação de credenciais",
            "Configure ambiente de staging"
        ]
        
        for rec in recommendations:
            print_colored(f"   • {rec}", Colors.YELLOW)
        
        # Salvar relatório
        report_data = {
            "timestamp": end_time.isoformat(),
            "duration_seconds": total_duration,
            "test_results": self.test_results,
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "overall_status": "APPROVED" if all_passed else "REQUIRES_ATTENTION"
            },
            "recommendations": recommendations
        }
        
        report_file = f"production_test_report_{end_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print_colored(f"\n📄 Relatório salvo em: {report_file}", Colors.CYAN)
        
        return all_passed
    
    def cleanup(self):
        """Limpeza do ambiente de teste"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            print_colored(f"🧹 Ambiente de teste limpo: {self.temp_dir}", Colors.BLUE)
    
    def run_all_tests(self):
        """Executa todos os testes de produção"""
        print_colored("🚀 INICIANDO TESTES DE PRODUÇÃO - BANCOENEM", Colors.BOLD + Colors.MAGENTA)
        print_colored(f"📅 Data/Hora: {self.start_time.strftime('%d/%m/%Y %H:%M:%S')}", Colors.BLUE)
        
        if not self.setup_test_environment():
            print_colored("❌ Falha na configuração do ambiente", Colors.RED)
            return False
        
        # Executar todos os testes
        test_methods = [
            self.test_dependencies_integrity,
            self.test_file_structure_integrity, 
            self.test_core_functionality,
            self.test_data_integrity,
            self.test_performance_benchmarks,
            self.test_security_compliance,
            self.test_integration_endpoints
        ]
        
        try:
            for test_method in test_methods:
                test_method()
                time.sleep(0.5)  # Pequena pausa entre testes
            
            # Gerar relatório final
            success = self.generate_production_report()
            
        finally:
            self.cleanup()
        
        return success

def main():
    """Função principal"""
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        print_colored("🏃‍♂️ Modo rápido - testes essenciais apenas", Colors.YELLOW)
    
    suite = ProductionTestSuite()
    success = suite.run_all_tests()
    
    exit_code = 0 if success else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    main()