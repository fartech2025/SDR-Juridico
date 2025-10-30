#!/usr/bin/env python3
"""
Script de configuração e teste da integração Supabase
Facilita a configuração inicial e teste da conexão
"""

import os
import sys
import json
from supabase_integration import SupabaseManager

def setup_environment():
    """Configura as variáveis de ambiente do Supabase"""
    print("🔧 CONFIGURAÇÃO DO SUPABASE")
    print("="*50)
    
    # Verificar se já existem
    current_url = os.getenv('SUPABASE_URL')
    current_key = os.getenv('SUPABASE_KEY')
    
    if current_url and current_key:
        print(f"✅ Variáveis já configuradas:")
        print(f"   URL: {current_url[:20]}...")
        print(f"   KEY: {current_key[:20]}...")
        
        response = input("\nDeseja reconfigurar? (s/N): ").lower()
        if response != 's':
            return current_url, current_key
    
    print("\n📝 Configure suas credenciais do Supabase:")
    print("   1. Acesse https://supabase.com/dashboard")
    print("   2. Vá em Settings > API")
    print("   3. Copie a URL e a chave anon/service_role")
    
    url = input("\n🔗 Digite a URL do projeto Supabase: ").strip()
    if not url:
        print("❌ URL é obrigatória")
        return None, None
    
    key = input("🔑 Digite a chave API do Supabase: ").strip()
    if not key:
        print("❌ Chave é obrigatória")
        return None, None
    
    # Salvar em arquivo .env local para desenvolvimento
    try:
        with open('.env', 'w') as f:
            f.write(f"SUPABASE_URL={url}\n")
            f.write(f"SUPABASE_KEY={key}\n")
        print("✅ Credenciais salvas em .env")
    except Exception as e:
        print(f"⚠️ Não foi possível salvar .env: {e}")
    
    # Definir para a sessão atual
    os.environ['SUPABASE_URL'] = url
    os.environ['SUPABASE_KEY'] = key
    
    return url, key

def test_connection_detailed():
    """Testa a conexão com detalhes"""
    print("\n🔍 TESTE DETALHADO DE CONEXÃO")
    print("="*50)
    
    try:
        manager = SupabaseManager()
        
        # Teste básico de conexão
        print("1. Testando conexão básica...")
        if manager.test_connection():
            print("   ✅ Conexão estabelecida")
        else:
            print("   ❌ Falha na conexão")
            return False
        
        # Teste de criação/verificação de tabela
        print("2. Verificando tabela...")
        if manager.create_table_if_not_exists():
            print("   ✅ Tabela acessível")
        else:
            print("   ⚠️ Tabela pode não existir - veja o SQL abaixo")
        
        # Estatísticas
        print("3. Obtendo estatísticas...")
        stats = manager.get_statistics()
        if "error" not in stats:
            print(f"   ✅ {stats['total_records']} registros encontrados")
            print(f"   📊 {stats['total_themes']} temas diferentes")
            print(f"   📄 {stats['total_pages']} páginas diferentes")
        else:
            print(f"   ❌ Erro nas estatísticas: {stats['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def show_table_sql():
    """Mostra o SQL para criar a tabela"""
    print("\n📝 SQL PARA CRIAR A TABELA NO SUPABASE")
    print("="*50)
    
    manager = SupabaseManager()
    sql = manager.get_create_table_sql()
    
    print("Copie e execute este SQL no SQL Editor do Supabase:")
    print("-" * 50)
    print(sql)
    print("-" * 50)
    
    # Salvar em arquivo
    with open('create_table.sql', 'w') as f:
        f.write(sql)
    print("✅ SQL salvo em 'create_table.sql'")

def sync_menu():
    """Menu de sincronização"""
    print("\n🔄 OPÇÕES DE SINCRONIZAÇÃO")
    print("="*50)
    print("1. Local → Supabase (enviar dados)")
    print("2. Supabase → Local (baixar dados)")
    print("3. Backup do Supabase")
    print("4. Estatísticas do Supabase")
    print("0. Voltar")
    
    choice = input("\nEscolha uma opção: ").strip()
    
    manager = SupabaseManager()
    
    if choice == "1":
        print("\n📤 SINCRONIZANDO LOCAL → SUPABASE")
        print("-" * 30)
        stats = manager.sync_from_local_db()
        print(f"\n✅ Sincronização concluída:")
        print(f"   • Inseridos: {stats['inserted']}")
        print(f"   • Atualizados: {stats['updated']}")
        print(f"   • Erros: {stats['errors']}")
        print(f"   • Duração: {stats['duration']:.2f}s")
        
    elif choice == "2":
        print("\n📥 SINCRONIZANDO SUPABASE → LOCAL")
        print("-" * 30)
        stats = manager.sync_to_local_db()
        print(f"\n✅ Sincronização concluída:")
        print(f"   • Inseridos: {stats['inserted']}")
        print(f"   • Atualizados: {stats['updated']}")
        print(f"   • Erros: {stats['errors']}")
        print(f"   • Duração: {stats['duration']:.2f}s")
        
    elif choice == "3":
        print("\n💾 CRIANDO BACKUP")
        print("-" * 30)
        filename = f"backup_supabase_{os.urandom(4).hex()}.json"
        if manager.backup_supabase_to_json(filename):
            print(f"✅ Backup criado: {filename}")
        else:
            print("❌ Erro ao criar backup")
            
    elif choice == "4":
        print("\n📊 ESTATÍSTICAS DO SUPABASE")
        print("-" * 30)
        stats = manager.get_statistics()
        if "error" not in stats:
            print(f"📈 Total de registros: {stats['total_records']}")
            print(f"🎯 Total de temas: {stats['total_themes']}")
            print(f"📄 Total de páginas: {stats['total_pages']}")
            
            print(f"\n🏷️ Top 5 temas:")
            for theme, count in list(stats['themes_distribution'].items())[:5]:
                print(f"   • {theme}: {count}")
                
            print(f"\n📑 Páginas com mais registros:")
            sorted_pages = sorted(stats['pages_distribution'].items(), 
                                key=lambda x: x[1], reverse=True)
            for page, count in sorted_pages[:5]:
                print(f"   • Página {page}: {count} registros")
        else:
            print(f"❌ Erro: {stats['error']}")

def main():
    """Função principal"""
    print("🚀 CONFIGURADOR SUPABASE - BANCOENEM")
    print("="*50)
    
    # Tentar carregar .env se existir
    if os.path.exists('.env'):
        print("📁 Carregando configurações de .env...")
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    while True:
        print("\n🎯 MENU PRINCIPAL")
        print("="*30)
        print("1. Configurar credenciais")
        print("2. Testar conexão")
        print("3. Mostrar SQL da tabela")
        print("4. Sincronização")
        print("5. Sair")
        
        choice = input("\nEscolha uma opção: ").strip()
        
        if choice == "1":
            url, key = setup_environment()
            if url and key:
                print("✅ Configuração concluída!")
            else:
                print("❌ Configuração cancelada")
                
        elif choice == "2":
            # Verificar se as credenciais estão configuradas
            if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
                print("❌ Configure as credenciais primeiro (opção 1)")
                continue
            test_connection_detailed()
            
        elif choice == "3":
            show_table_sql()
            
        elif choice == "4":
            # Verificar se as credenciais estão configuradas
            if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
                print("❌ Configure as credenciais primeiro (opção 1)")
                continue
            sync_menu()
            
        elif choice == "5":
            print("👋 Até logo!")
            break
            
        else:
            print("❌ Opção inválida")

if __name__ == "__main__":
    main()