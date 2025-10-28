#!/usr/bin/env python3
"""
Teste de Stress e Load Testing para BancoEnem
Valida comportamento sob carga e condições extremas
"""

import os
import sys
import time
import json
import sqlite3
import concurrent.futures
import threading
import tempfile
import shutil
from datetime import datetime
import psutil
import gc

class StressTestSuite:
    """Suite de testes de stress"""
    
    def __init__(self):
        self.results = {}
        self.start_time = datetime.now()
        
    def print_status(self, message, status="INFO"):
        """Imprime status colorido"""
        colors = {
            "INFO": "\033[94m",
            "SUCCESS": "\033[92m", 
            "WARNING": "\033[93m",
            "ERROR": "\033[91m",
            "RESET": "\033[0m"
        }
        print(f"{colors.get(status, '')}{message}{colors['RESET']}")
        
    def test_memory_usage(self):
        """Testa uso de memória durante operações"""
        self.print_status("🧠 TESTE DE MEMÓRIA", "INFO")
        
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        self.print_status(f"Memória inicial: {initial_memory:.2f} MB", "INFO")
        
        # Carregar JSON múltiplas vezes
        json_path = "output/enem2024_lc_questions_content.json"
        if os.path.exists(json_path):
            data_copies = []
            
            for i in range(50):  # Carregar 50 vezes
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    data_copies.append(data)
                
                if i % 10 == 0:
                    current_memory = process.memory_info().rss / 1024 / 1024
                    self.print_status(f"Iteração {i}: {current_memory:.2f} MB", "INFO")
            
            peak_memory = process.memory_info().rss / 1024 / 1024
            
            # Limpeza
            del data_copies
            gc.collect()
            
            final_memory = process.memory_info().rss / 1024 / 1024
            
            memory_increase = peak_memory - initial_memory
            memory_recovered = peak_memory - final_memory
            
            self.print_status(f"Pico de memória: {peak_memory:.2f} MB", "INFO")
            self.print_status(f"Aumento: {memory_increase:.2f} MB", "INFO")
            self.print_status(f"Recuperado: {memory_recovered:.2f} MB", "INFO")
            
            # Considerar sucesso se não ultrapassar 500MB e recuperar pelo menos 80%
            success = memory_increase < 500 and (memory_recovered / memory_increase) > 0.8
            
            self.results["memory_test"] = {
                "success": success,
                "initial_mb": initial_memory,
                "peak_mb": peak_memory,
                "final_mb": final_memory,
                "increase_mb": memory_increase,
                "recovered_mb": memory_recovered
            }
            
            status = "SUCCESS" if success else "WARNING"
            self.print_status(f"Teste de memória: {'PASSOU' if success else 'ATENÇÃO'}", status)
        
        return self.results.get("memory_test", {}).get("success", False)
    
    def test_concurrent_database_access(self):
        """Testa acesso concorrente ao banco"""
        self.print_status("🔄 TESTE DE CONCORRÊNCIA", "INFO")
        
        if not os.path.exists("enem.db"):
            self.print_status("Banco não encontrado", "ERROR")
            return False
        
        def db_worker(worker_id):
            """Worker para acesso ao banco"""
            try:
                conn = sqlite3.connect("enem.db")
                cursor = conn.cursor()
                
                # Realizar múltiplas consultas
                for i in range(100):
                    cursor.execute("SELECT COUNT(*) FROM questions")
                    cursor.execute("SELECT * FROM questions LIMIT 10")
                    cursor.execute("SELECT DISTINCT theme FROM questions")
                
                conn.close()
                return {"worker_id": worker_id, "success": True, "operations": 300}
                
            except Exception as e:
                return {"worker_id": worker_id, "success": False, "error": str(e)}
        
        # Executar 10 workers concorrentes
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(db_worker, i) for i in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        end_time = time.time()
        duration = end_time - start_time
        
        successful_workers = sum(1 for r in results if r.get("success", False))
        total_operations = sum(r.get("operations", 0) for r in results if r.get("success", False))
        
        operations_per_second = total_operations / duration if duration > 0 else 0
        
        self.results["concurrency_test"] = {
            "success": successful_workers == 10,
            "successful_workers": successful_workers,
            "total_workers": 10,
            "duration_seconds": duration,
            "operations_per_second": operations_per_second,
            "total_operations": total_operations
        }
        
        self.print_status(f"Workers bem-sucedidos: {successful_workers}/10", "INFO")
        self.print_status(f"Duração: {duration:.2f}s", "INFO")
        self.print_status(f"Operações/segundo: {operations_per_second:.0f}", "INFO")
        
        success = successful_workers == 10 and operations_per_second > 100
        status = "SUCCESS" if success else "WARNING"
        self.print_status(f"Teste de concorrência: {'PASSOU' if success else 'ATENÇÃO'}", status)
        
        return success
    
    def test_large_data_processing(self):
        """Testa processamento de dados grandes"""
        self.print_status("📊 TESTE DE VOLUME DE DADOS", "INFO")
        
        # Simular processamento de dados grande
        json_path = "output/enem2024_lc_questions_content.json"
        if not os.path.exists(json_path):
            self.print_status("JSON não encontrado", "ERROR")
            return False
        
        start_time = time.time()
        
        # Carregar e processar dados múltiplas vezes
        processed_records = 0
        
        for iteration in range(20):  # 20 iterações
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            questions = data.get('questions', [])
            
            # Simular processamento pesado
            for question in questions:
                # Operações de texto
                text = question.get('text_full', '')
                words = len(text.split())
                chars = len(text)
                
                # Classificação de tema (simular)
                theme = question.get('theme', '')
                theme_words = len(theme.split())
                
                processed_records += 1
        
        end_time = time.time()
        duration = end_time - start_time
        records_per_second = processed_records / duration if duration > 0 else 0
        
        self.results["large_data_test"] = {
            "success": duration < 30,  # Deve completar em menos de 30s
            "processed_records": processed_records,
            "duration_seconds": duration,
            "records_per_second": records_per_second
        }
        
        self.print_status(f"Registros processados: {processed_records:,}", "INFO")
        self.print_status(f"Duração: {duration:.2f}s", "INFO")
        self.print_status(f"Registros/segundo: {records_per_second:.0f}", "INFO")
        
        success = duration < 30 and records_per_second > 50
        status = "SUCCESS" if success else "WARNING"
        self.print_status(f"Teste de volume: {'PASSOU' if success else 'ATENÇÃO'}", status)
        
        return success
    
    def test_file_system_stress(self):
        """Testa stress do sistema de arquivos"""
        self.print_status("💾 TESTE DE SISTEMA DE ARQUIVOS", "INFO")
        
        temp_dir = tempfile.mkdtemp(prefix="bancoenem_stress_")
        
        try:
            start_time = time.time()
            
            # Criar muitos arquivos pequenos
            files_created = 0
            for i in range(1000):
                file_path = os.path.join(temp_dir, f"test_file_{i:04d}.txt")
                with open(file_path, 'w') as f:
                    f.write(f"Test data {i}" * 100)  # ~1KB por arquivo
                files_created += 1
            
            # Ler todos os arquivos
            files_read = 0
            for i in range(1000):
                file_path = os.path.join(temp_dir, f"test_file_{i:04d}.txt")
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        content = f.read()
                    files_read += 1
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Verificar tamanho do diretório
            total_size = sum(
                os.path.getsize(os.path.join(temp_dir, f))
                for f in os.listdir(temp_dir)
            ) / 1024 / 1024  # MB
            
            self.results["filesystem_test"] = {
                "success": files_created == 1000 and files_read == 1000,
                "files_created": files_created,
                "files_read": files_read,
                "duration_seconds": duration,
                "total_size_mb": total_size
            }
            
            self.print_status(f"Arquivos criados: {files_created}", "INFO")
            self.print_status(f"Arquivos lidos: {files_read}", "INFO")
            self.print_status(f"Duração: {duration:.2f}s", "INFO")
            self.print_status(f"Tamanho total: {total_size:.2f} MB", "INFO")
            
            success = files_created == 1000 and files_read == 1000 and duration < 10
            status = "SUCCESS" if success else "WARNING"
            self.print_status(f"Teste de filesystem: {'PASSOU' if success else 'ATENÇÃO'}", status)
            
            return success
            
        finally:
            # Limpeza
            shutil.rmtree(temp_dir)
            self.print_status(f"Diretório temporário limpo: {temp_dir}", "INFO")
    
    def test_error_recovery(self):
        """Testa recuperação de erros"""
        self.print_status("🛡️ TESTE DE RECUPERAÇÃO DE ERROS", "INFO")
        
        errors_handled = 0
        total_tests = 0
        
        # Teste 1: Arquivo não existente
        total_tests += 1
        try:
            with open("arquivo_inexistente.json", 'r') as f:
                json.load(f)
        except FileNotFoundError:
            errors_handled += 1
            self.print_status("✅ Erro de arquivo não encontrado tratado", "SUCCESS")
        except Exception as e:
            self.print_status(f"❌ Erro não esperado: {e}", "ERROR")
        
        # Teste 2: JSON malformado
        total_tests += 1
        try:
            json.loads('{"invalid": json}')
        except json.JSONDecodeError:
            errors_handled += 1
            self.print_status("✅ Erro de JSON malformado tratado", "SUCCESS")
        except Exception as e:
            self.print_status(f"❌ Erro não esperado: {e}", "ERROR")
        
        # Teste 3: Banco inexistente
        total_tests += 1
        try:
            conn = sqlite3.connect("banco_inexistente.db")
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tabela_inexistente")
        except sqlite3.OperationalError:
            errors_handled += 1
            self.print_status("✅ Erro de tabela inexistente tratado", "SUCCESS")
        except Exception as e:
            self.print_status(f"❌ Erro não esperado: {e}", "ERROR")
        finally:
            try:
                conn.close()
            except:
                pass
        
        success_rate = errors_handled / total_tests if total_tests > 0 else 0
        
        self.results["error_recovery_test"] = {
            "success": success_rate >= 0.8,
            "errors_handled": errors_handled,
            "total_tests": total_tests,
            "success_rate": success_rate
        }
        
        self.print_status(f"Erros tratados: {errors_handled}/{total_tests}", "INFO")
        self.print_status(f"Taxa de sucesso: {success_rate*100:.1f}%", "INFO")
        
        success = success_rate >= 0.8
        status = "SUCCESS" if success else "WARNING"
        self.print_status(f"Teste de recuperação: {'PASSOU' if success else 'ATENÇÃO'}", status)
        
        return success
    
    def generate_stress_report(self):
        """Gera relatório do teste de stress"""
        self.print_status("\n📊 RELATÓRIO DE STRESS TEST", "INFO")
        self.print_status("="*60, "INFO")
        
        end_time = datetime.now()
        total_duration = (end_time - self.start_time).total_seconds()
        
        passed_tests = sum(1 for result in self.results.values() if result.get("success", False))
        total_tests = len(self.results)
        
        self.print_status(f"⏱️  Duração total: {total_duration:.2f}s", "INFO")
        self.print_status(f"🧪 Testes executados: {total_tests}", "INFO")
        self.print_status(f"✅ Testes aprovados: {passed_tests}", "SUCCESS")
        self.print_status(f"❌ Testes falharam: {total_tests - passed_tests}", "ERROR" if passed_tests < total_tests else "SUCCESS")
        
        # Detalhes por teste
        for test_name, result in self.results.items():
            status_emoji = "✅" if result.get("success", False) else "❌"
            self.print_status(f"{status_emoji} {test_name}: {'PASSOU' if result.get('success', False) else 'FALHOU'}", 
                            "SUCCESS" if result.get("success", False) else "WARNING")
        
        # Veredicto final
        all_passed = all(result.get("success", False) for result in self.results.values())
        
        if all_passed:
            self.print_status("\n🏆 STRESS TEST: APROVADO!", "SUCCESS")
            self.print_status("🚀 Sistema demonstrou robustez sob carga", "SUCCESS")
        else:
            self.print_status("\n⚠️ STRESS TEST: ATENÇÃO NECESSÁRIA", "WARNING")
            self.print_status("🔧 Alguns aspectos podem precisar de otimização", "WARNING")
        
        # Salvar relatório
        report_data = {
            "timestamp": end_time.isoformat(),
            "duration_seconds": total_duration,
            "test_results": self.results,
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "overall_status": "PASSED" if all_passed else "ATTENTION_NEEDED"
            }
        }
        
        report_file = f"stress_test_report_{end_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        self.print_status(f"📄 Relatório salvo: {report_file}", "INFO")
        
        return all_passed
    
    def run_all_stress_tests(self):
        """Executa todos os testes de stress"""
        self.print_status("🚀 INICIANDO STRESS TESTS - BANCOENEM", "INFO")
        self.print_status(f"📅 Data/Hora: {self.start_time.strftime('%d/%m/%Y %H:%M:%S')}", "INFO")
        
        stress_tests = [
            ("Memória", self.test_memory_usage),
            ("Concorrência", self.test_concurrent_database_access), 
            ("Volume de Dados", self.test_large_data_processing),
            ("Sistema de Arquivos", self.test_file_system_stress),
            ("Recuperação de Erros", self.test_error_recovery)
        ]
        
        for test_name, test_method in stress_tests:
            self.print_status(f"\n🧪 EXECUTANDO: {test_name}", "INFO")
            self.print_status("-" * 40, "INFO")
            
            try:
                test_method()
            except Exception as e:
                self.print_status(f"❌ Erro no teste {test_name}: {e}", "ERROR")
                self.results[test_name.lower().replace(" ", "_")] = {"success": False, "error": str(e)}
            
            time.sleep(1)  # Pausa entre testes
        
        return self.generate_stress_report()

def main():
    """Função principal"""
    print("🔥 STRESS TESTING - BANCOENEM")
    print("Testes de robustez e performance sob carga")
    
    suite = StressTestSuite()
    success = suite.run_all_stress_tests()
    
    exit_code = 0 if success else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    main()