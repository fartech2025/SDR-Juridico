#!/usr/bin/env python3
"""
Extensão do script principal para incluir sincronização com Supabase
Permite executar extração + sincronização em um comando
"""

import sys
import os
import argparse
from datetime import datetime

# Importar módulos locais
try:
    from supabase_integration import SupabaseManager
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

def run_extraction():
    """Executa o script principal de extração"""
    print("🔄 Executando extração do PDF...")
    
    # Importar e executar o main.py
    try:
        # Simular execução do main.py
        import subprocess
        result = subprocess.run([sys.executable, "main.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Extração concluída com sucesso!")
            print(result.stdout)
            return True
        else:
            print("❌ Erro na extração:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Erro ao executar extração: {e}")
        return False

def sync_to_supabase():
    """Sincroniza dados para o Supabase"""
    if not SUPABASE_AVAILABLE:
        print("❌ Módulo Supabase não disponível. Instale com: pip install supabase")
        return False
    
    # Verificar credenciais
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
        print("❌ Credenciais do Supabase não configuradas.")
        print("💡 Execute: python3 supabase_setup.py")
        return False
    
    try:
        print("🔄 Sincronizando com Supabase...")
        manager = SupabaseManager()
        
        # Testar conexão
        if not manager.test_connection():
            print("❌ Falha na conexão com Supabase")
            return False
        
        # Sincronizar dados
        stats = manager.sync_from_local_db()
        
        print("✅ Sincronização concluída!")
        print(f"   • Inseridos: {stats['inserted']}")
        print(f"   • Atualizados: {stats['updated']}")
        print(f"   • Erros: {stats['errors']}")
        
        return stats['errors'] == 0
        
    except Exception as e:
        print(f"❌ Erro na sincronização: {e}")
        return False

def main():
    """Função principal com argumentos"""
    parser = argparse.ArgumentParser(
        description="BancoEnem - Extractor e Sincronizador",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  python3 main_extended.py --extract                    # Só extração
  python3 main_extended.py --sync                       # Só sincronização
  python3 main_extended.py --extract --sync             # Ambos
  python3 main_extended.py --full                       # Processo completo
  python3 main_extended.py --status                     # Status do sistema
        """
    )
    
    parser.add_argument('--extract', action='store_true', 
                       help='Executar extração do PDF')
    parser.add_argument('--sync', action='store_true', 
                       help='Sincronizar com Supabase')
    parser.add_argument('--full', action='store_true', 
                       help='Processo completo (extração + sincronização)')
    parser.add_argument('--status', action='store_true', 
                       help='Mostrar status do sistema')
    parser.add_argument('--force', action='store_true', 
                       help='Forçar re-extração mesmo se arquivos existirem')
    
    args = parser.parse_args()
    
    # Se nenhum argumento, mostrar ajuda
    if not any([args.extract, args.sync, args.full, args.status]):
        parser.print_help()
        return
    
    print("🚀 BANCOENEM - PROCESSO INTEGRADO")
    print("="*50)
    print(f"⏰ Início: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    success = True
    
    # Status do sistema
    if args.status:
        print("\n📊 STATUS DO SISTEMA")
        print("-" * 30)
        
        # Verificar arquivos
        files_status = {
            "PDF": os.path.exists("2024_PV_impresso_D1_CD1.pdf"),
            "JSON": os.path.exists("output/enem2024_lc_questions_content.json"),
            "SQL": os.path.exists("output/enem2024_import.sql"),
            "DB": os.path.exists("enem.db"),
            "Images": os.path.exists("output/images")
        }
        
        for file_type, exists in files_status.items():
            status = "✅" if exists else "❌"
            print(f"{status} {file_type}")
        
        # Verificar Supabase
        if SUPABASE_AVAILABLE and os.getenv('SUPABASE_URL'):
            try:
                manager = SupabaseManager()
                if manager.test_connection():
                    stats = manager.get_statistics()
                    print(f"✅ Supabase: {stats.get('total_records', 0)} registros")
                else:
                    print("❌ Supabase: Conexão falhou")
            except:
                print("❌ Supabase: Erro de configuração")
        else:
            print("⚠️ Supabase: Não configurado")
    
    # Processo completo
    if args.full:
        args.extract = True
        args.sync = True
    
    # Extração
    if args.extract:
        print("\n📄 FASE 1: EXTRAÇÃO")
        print("-" * 30)
        
        # Verificar se precisa extrair
        if not args.force and os.path.exists("output/enem2024_lc_questions_content.json"):
            print("⚠️ Arquivos de saída já existem. Use --force para re-extrair.")
        else:
            if not run_extraction():
                success = False
    
    # Sincronização
    if args.sync and success:
        print("\n☁️ FASE 2: SINCRONIZAÇÃO")
        print("-" * 30)
        
        if not sync_to_supabase():
            success = False
    
    # Resultado final
    print("\n" + "="*50)
    if success:
        print("🎉 PROCESSO CONCLUÍDO COM SUCESSO!")
    else:
        print("❌ PROCESSO CONCLUÍDO COM ERROS")
    
    print(f"⏰ Fim: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())