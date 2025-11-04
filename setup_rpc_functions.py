#!/usr/bin/env python3
"""
setup_rpc_functions.py

Cria automaticamente as funções RPC faltando no Supabase Cloud:
  ✅ pg_foreign_keys()  ← CRIADA EM 04/11/2025
  ⏳ get_all_tables()    ← PRÓXIMA

Uso:
  python3 setup_rpc_functions.py

Pré-requisitos:
  - .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
  - ou variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
"""

import os
import sys
import requests
from typing import Optional

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def get_supabase_credentials() -> Optional[tuple]:
    """Obter credenciais do Supabase das variáveis de ambiente"""
    url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print_error("Credenciais do Supabase não encontradas!")
        print_info("Configure as variáveis de ambiente:")
        print("  export VITE_SUPABASE_URL='https://seu-projeto.supabase.co'")
        print("  export VITE_SUPABASE_ANON_KEY='sua_chave_anon'")
        return None
    
    return (url, key)

def execute_sql(url: str, key: str, sql: str) -> bool:
    """Executar SQL no Supabase via REST API"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': f'Bearer {key}'
        }
        
        # Usar o endpoint RPC do Supabase
        response = requests.post(
            f"{url}/rest/v1/rpc/sql",
            headers=headers,
            json={"sql": sql},
            timeout=30
        )
        
        # Se não funcionar com RPC, tentar com exec
        if response.status_code >= 400:
            # Alternativa: enviar via sql.http
            response = requests.post(
                f"{url}/rest/v1/rpc/exec",
                headers=headers,
                json={"query": sql},
                timeout=30
            )
        
        return response.status_code < 400
    
    except Exception as e:
        print_error(f"Erro ao executar SQL: {e}")
        return False

def main():
    print("\n" + "="*80)
    print("🔧 Criador de Funções RPC - Supabase Cloud")
    print("="*80 + "\n")
    
    # Obter credenciais
    credentials = get_supabase_credentials()
    if not credentials:
        print_warning("Método 1: Via Variáveis de Ambiente")
        print("  Defina as variáveis e execute novamente\n")
        
        print_warning("Método 2: Via Supabase Dashboard (Recomendado)")
        print("  1. Acesse https://supabase.com/dashboard")
        print("  2. SQL Editor → New Query")
        print("  3. Cole os SQLs dos arquivos")
        print("  4. RUN\n")
        
        print_warning("Método 3: Via .env.local")
        print("  Crie arquivo app/.env.local com:")
        print("  VITE_SUPABASE_URL=https://seu-projeto.supabase.co")
        print("  VITE_SUPABASE_ANON_KEY=sua_chave_anon\n")
        
        sys.exit(1)
    
    url, key = credentials
    print_success(f"Conectado ao Supabase: {url}")
    
    # SQL para get_all_tables
    sql_get_all_tables = """
    CREATE OR REPLACE FUNCTION public.get_all_tables()
    RETURNS TABLE (table_name TEXT)
    LANGUAGE SQL
    SECURITY DEFINER
    AS $$
      SELECT table_name::TEXT
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    $$;
    
    GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_all_tables() TO anon;
    """
    
    # SQL para pg_foreign_keys
    sql_pg_foreign_keys = """
    create or replace function public.pg_foreign_keys()
    returns table(
      tabela_origem text,
      coluna_origem text,
      tabela_destino text,
      coluna_destino text
    )
    language sql
    stable
    as $$
      select
        tc.table_name as tabela_origem,
        kcu.column_name as coluna_origem,
        ccu.table_name as tabela_destino,
        ccu.column_name as coluna_destino
      from
        information_schema.table_constraints as tc
        join information_schema.key_column_usage as kcu
          on tc.constraint_name = kcu.constraint_name
          and tc.table_schema = kcu.table_schema
        join information_schema.constraint_column_usage as ccu
          on ccu.constraint_name = tc.constraint_name
          and ccu.table_schema = tc.table_schema
      where
        tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = 'public'
      order by
        tc.table_name,
        kcu.column_name;
    $$;

    grant execute on function public.pg_foreign_keys() to anon, authenticated;
    """
    
    print("\n" + "="*80)
    print("Criando funções RPC...")
    print("="*80 + "\n")
    
    # Tentar criar get_all_tables
    print("1️⃣  Criando get_all_tables()...")
    if execute_sql(url, key, sql_get_all_tables):
        print_success("get_all_tables() criada com sucesso!")
    else:
        print_warning("get_all_tables() pode já existir ou há erro de permissões")
    
    # Tentar criar pg_foreign_keys
    print("\n2️⃣  Criando pg_foreign_keys()...")
    if execute_sql(url, key, sql_pg_foreign_keys):
        print_success("pg_foreign_keys() criada com sucesso!")
    else:
        print_warning("pg_foreign_keys() pode já existir ou há erro de permissões")
    
    print("\n" + "="*80)
    print("📋 INSTRUÇÕES MANUAIS (se o script acima não funcionou):")
    print("="*80 + "\n")
    
    print_info("Abra https://supabase.com/dashboard")
    print("  1. SQL Editor → New Query")
    print("  2. Cole: SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql")
    print("  3. RUN")
    print("  4. Cole: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql")
    print("  5. RUN")
    print("  6. Recarregue a aplicação (F5)\n")
    
    print_success("Próximo passo: Recarregue http://localhost:5173 no navegador\n")

if __name__ == "__main__":
    main()
