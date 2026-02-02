#!/usr/bin/env python3
"""
Script para executar a migration DataJud via Supabase REST API.
Útil quando CLI está falhando ou para automação.

Uso:
    python3 execute_datajud_migration.py --url <URL> --key <API_KEY>
    
Exemplo:
    python3 execute_datajud_migration.py \\
        --url "https://xocqcoebreoiaqxoutar.supabase.co" \\
        --key "sua-chave-api-publica"
"""

import argparse
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌ requests não está instalado. Instale com: pip install requests")
    sys.exit(1)


def load_migration_sql(filepath: str) -> str:
    """Carregar arquivo SQL da migration."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {filepath}")
    
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def execute_migration(supabase_url: str, api_key: str, sql: str) -> dict:
    """Executar SQL via REST API do Supabase."""
    
    if not supabase_url.endswith("/"):
        supabase_url += "/"
    
    url = f"{supabase_url}rest/v1/rpc/execute_sql"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "query": sql
    }
    
    print("🔄 Executando migration...")
    print(f"   URL: {supabase_url}")
    print(f"   Tamanho do SQL: {len(sql)} caracteres")
    print()
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Migration executada com sucesso!")
            return {"success": True, "data": response.json()}
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.text)
            return {"success": False, "error": response.text, "status": response.status_code}
            
    except requests.exceptions.Timeout:
        print("❌ Timeout: A migration demorou mais de 2 minutos. Pode estar executando.")
        return {"success": False, "error": "timeout"}
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return {"success": False, "error": str(e)}


def verify_tables(supabase_url: str, api_key: str) -> bool:
    """Verificar se as tabelas foram criadas."""
    
    if not supabase_url.endswith("/"):
        supabase_url += "/"
    
    verify_sql = """
    SELECT COUNT(*) as total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND tablename IN (
        'datajud_processos',
        'datajud_movimentacoes',
        'datajud_api_calls',
        'datajud_sync_jobs'
      );
    """
    
    url = f"{supabase_url}rest/v1/rpc/query"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {"sql": verify_sql}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                count = data[0].get("total_tables", 0)
                print(f"✅ {count}/4 tabelas DataJud foram criadas")
                return count == 4
    except:
        pass
    
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Executar migration DataJud via Supabase REST API"
    )
    
    parser.add_argument(
        "--url",
        required=True,
        help="URL do Supabase (ex: https://xocqcoebreoiaqxoutar.supabase.co)"
    )
    
    parser.add_argument(
        "--key",
        required=True,
        help="Chave API pública do Supabase (anon key)"
    )
    
    parser.add_argument(
        "--file",
        default="supabase/migrations/20260131_datajud_casos_integration.sql",
        help="Arquivo SQL da migration (padrão: supabase/migrations/20260131_...)"
    )
    
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verificar tabelas após execução"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 Supabase DataJud Migration Executor")
    print("=" * 60)
    print()
    
    # Carregar SQL
    try:
        sql = load_migration_sql(args.file)
        print(f"✅ SQL carregado: {len(sql)} caracteres")
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    print()
    
    # Executar migration
    result = execute_migration(args.url, args.key, sql)
    
    if not result["success"]:
        print()
        print("❌ Falha ao executar migration")
        sys.exit(1)
    
    print()
    
    # Verificar (opcional)
    if args.verify:
        print("🔍 Verificando tabelas...")
        if verify_tables(args.url, args.key):
            print("✅ Todas as tabelas foram criadas com sucesso!")
        else:
            print("⚠️  Algumas tabelas podem estar faltando. Verifique manualmente.")
    
    print()
    print("=" * 60)
    print("✅ Processo concluído!")
    print("=" * 60)
    print()
    print("Próximos passos:")
    print("  1. Deploy Edge Function:")
    print("     supabase functions deploy datajud-enhanced")
    print()
    print("  2. Build Frontend:")
    print("     npm run build")
    print()
    print("  3. Deploy para Produção:")
    print("     git push origin main")


if __name__ == "__main__":
    main()
