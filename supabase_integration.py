"""
Módulo de integração com Supabase para o projeto BancoEnem
Gerencia a sincronização de dados entre SQLite local e Supabase
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseManager:
    """Gerenciador de conexão e operações com Supabase"""
    
    def __init__(self, url: str = None, key: str = None):
        """
        Inicializa o gerenciador Supabase
        
        Args:
            url: URL do projeto Supabase
            key: Chave de API do Supabase
        """
        self.url = url or os.getenv('SUPABASE_URL')
        self.key = key or os.getenv('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError(
                "URL e chave do Supabase são obrigatórias. "
                "Configure as variáveis SUPABASE_URL e SUPABASE_KEY ou passe como parâmetros."
            )
        
        self.client: Client = create_client(self.url, self.key)
        self.table_name = "enem_questions"
        
    def test_connection(self) -> bool:
        """Testa a conexão com o Supabase"""
        try:
            # Tentar fazer uma consulta simples
            result = self.client.table(self.table_name).select("count", count="exact").execute()
            logger.info(f"✅ Conexão com Supabase estabelecida. Registros na tabela: {result.count}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro na conexão com Supabase: {e}")
            return False
    
    def create_table_if_not_exists(self) -> bool:
        """
        Cria a tabela no Supabase se ela não existir
        Nota: Idealmente isso seria feito via SQL no painel do Supabase
        """
        try:
            # Verificar se a tabela existe fazendo uma consulta
            self.client.table(self.table_name).select("id").limit(1).execute()
            logger.info(f"✅ Tabela {self.table_name} já existe")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Tabela pode não existir ou erro de acesso: {e}")
            logger.info("💡 Crie a tabela manualmente no Supabase com o SQL fornecido")
            return False
    
    def get_create_table_sql(self) -> str:
        """Retorna o SQL para criar a tabela no Supabase"""
        return """
        CREATE TABLE IF NOT EXISTS enem_questions (
            id TEXT PRIMARY KEY,
            number INTEGER NOT NULL,
            page INTEGER NOT NULL,
            theme TEXT NOT NULL,
            text_full TEXT NOT NULL,
            content JSONB,
            images JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para melhor performance
        CREATE INDEX IF NOT EXISTS idx_enem_questions_number ON enem_questions(number);
        CREATE INDEX IF NOT EXISTS idx_enem_questions_theme ON enem_questions(theme);
        CREATE INDEX IF NOT EXISTS idx_enem_questions_page ON enem_questions(page);
        
        -- Trigger para atualizar updated_at automaticamente
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_enem_questions_updated_at 
            BEFORE UPDATE ON enem_questions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
    
    def sync_from_local_db(self, db_path: str = "enem.db", json_path: str = "output/enem2024_lc_questions_content.json") -> Dict[str, Any]:
        """
        Sincroniza dados do banco SQLite local para o Supabase
        
        Args:
            db_path: Caminho para o banco SQLite local
            json_path: Caminho para o arquivo JSON com dados completos
            
        Returns:
            Dicionário com estatísticas da sincronização
        """
        logger.info("🔄 Iniciando sincronização do banco local para Supabase...")
        
        stats = {
            "total_local": 0,
            "total_supabase_before": 0,
            "inserted": 0,
            "updated": 0,
            "errors": 0,
            "start_time": datetime.now(),
            "end_time": None
        }
        
        try:
            # Carregar dados do JSON para ter informações completas
            json_data = {}
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    json_data = json.load(f)
                    logger.info(f"📄 JSON carregado com {len(json_data.get('questions', []))} questões")
            
            # Criar mapeamento por ID do JSON
            json_questions = {q['id']: q for q in json_data.get('questions', [])}
            
            # Conectar ao banco local
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Buscar todos os dados locais
            cursor.execute("SELECT id, number, page, theme, text_full FROM questions")
            local_data = cursor.fetchall()
            stats["total_local"] = len(local_data)
            
            logger.info(f"📊 Encontrados {stats['total_local']} registros no banco local")
            
            # Verificar quantos registros já existem no Supabase
            existing_result = self.client.table(self.table_name).select("id").execute()
            existing_ids = {row['id'] for row in existing_result.data}
            stats["total_supabase_before"] = len(existing_ids)
            
            logger.info(f"📊 Encontrados {stats['total_supabase_before']} registros no Supabase")
            
            # Processar cada registro
            for row in local_data:
                try:
                    id_val, number, page, theme, text_full = row
                    
                    # Buscar dados completos do JSON
                    json_question = json_questions.get(id_val, {})
                    
                    # Preparar dados para inserção/atualização
                    record = {
                        "id": id_val,
                        "number": number,
                        "page": page,
                        "theme": theme,
                        "text_full": text_full,
                        "content": json_question.get('content', []),
                        "images": json_question.get('images', [])
                    }
                    
                    if id_val in existing_ids:
                        # Atualizar registro existente
                        self.client.table(self.table_name).update(record).eq('id', id_val).execute()
                        stats["updated"] += 1
                        logger.debug(f"⬆️ Atualizado: {id_val}")
                    else:
                        # Inserir novo registro
                        self.client.table(self.table_name).insert(record).execute()
                        stats["inserted"] += 1
                        logger.debug(f"➕ Inserido: {id_val}")
                        
                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"❌ Erro ao processar {row[0] if row else 'registro'}: {e}")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Erro geral na sincronização: {e}")
            stats["errors"] += 1
        
        stats["end_time"] = datetime.now()
        stats["duration"] = (stats["end_time"] - stats["start_time"]).total_seconds()
        
        # Log do resumo
        logger.info("📊 RESUMO DA SINCRONIZAÇÃO:")
        logger.info(f"   • Registros locais: {stats['total_local']}")
        logger.info(f"   • Registros no Supabase (antes): {stats['total_supabase_before']}")
        logger.info(f"   • Inseridos: {stats['inserted']}")
        logger.info(f"   • Atualizados: {stats['updated']}")
        logger.info(f"   • Erros: {stats['errors']}")
        logger.info(f"   • Duração: {stats['duration']:.2f}s")
        
        return stats
    
    def sync_to_local_db(self, db_path: str = "enem.db") -> Dict[str, Any]:
        """
        Sincroniza dados do Supabase para o banco SQLite local
        
        Args:
            db_path: Caminho para o banco SQLite local
            
        Returns:
            Dicionário com estatísticas da sincronização
        """
        logger.info("🔄 Iniciando sincronização do Supabase para banco local...")
        
        stats = {
            "total_supabase": 0,
            "total_local_before": 0,
            "inserted": 0,
            "updated": 0,
            "errors": 0,
            "start_time": datetime.now(),
            "end_time": None
        }
        
        try:
            # Buscar todos os dados do Supabase
            result = self.client.table(self.table_name).select("*").execute()
            supabase_data = result.data
            stats["total_supabase"] = len(supabase_data)
            
            logger.info(f"📊 Encontrados {stats['total_supabase']} registros no Supabase")
            
            # Conectar ao banco local
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Verificar registros existentes no local
            cursor.execute("SELECT id FROM questions")
            existing_ids = {row[0] for row in cursor.fetchall()}
            stats["total_local_before"] = len(existing_ids)
            
            logger.info(f"📊 Encontrados {stats['total_local_before']} registros no banco local")
            
            # Processar cada registro do Supabase
            for record in supabase_data:
                try:
                    id_val = record['id']
                    
                    if id_val in existing_ids:
                        # Atualizar registro existente
                        cursor.execute("""
                            UPDATE questions 
                            SET number = ?, page = ?, theme = ?, text_full = ?
                            WHERE id = ?
                        """, (record['number'], record['page'], record['theme'], 
                              record['text_full'], id_val))
                        stats["updated"] += 1
                        logger.debug(f"⬆️ Atualizado localmente: {id_val}")
                    else:
                        # Inserir novo registro
                        cursor.execute("""
                            INSERT INTO questions (id, number, page, theme, text_full)
                            VALUES (?, ?, ?, ?, ?)
                        """, (id_val, record['number'], record['page'], 
                              record['theme'], record['text_full']))
                        stats["inserted"] += 1
                        logger.debug(f"➕ Inserido localmente: {id_val}")
                        
                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"❌ Erro ao processar {record.get('id', 'registro')}: {e}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Erro geral na sincronização: {e}")
            stats["errors"] += 1
        
        stats["end_time"] = datetime.now()
        stats["duration"] = (stats["end_time"] - stats["start_time"]).total_seconds()
        
        # Log do resumo
        logger.info("📊 RESUMO DA SINCRONIZAÇÃO:")
        logger.info(f"   • Registros no Supabase: {stats['total_supabase']}")
        logger.info(f"   • Registros locais (antes): {stats['total_local_before']}")
        logger.info(f"   • Inseridos: {stats['inserted']}")
        logger.info(f"   • Atualizados: {stats['updated']}")
        logger.info(f"   • Erros: {stats['errors']}")
        logger.info(f"   • Duração: {stats['duration']:.2f}s")
        
        return stats
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtém estatísticas da tabela no Supabase"""
        try:
            # Total de registros
            count_result = self.client.table(self.table_name).select("*", count="exact").execute()
            total_records = count_result.count
            
            # Distribuição por temas
            theme_result = self.client.table(self.table_name).select("theme").execute()
            themes = {}
            for record in theme_result.data:
                theme = record['theme']
                themes[theme] = themes.get(theme, 0) + 1
            
            # Estatísticas por página
            page_result = self.client.table(self.table_name).select("page").execute()
            pages = {}
            for record in page_result.data:
                page = record['page']
                pages[page] = pages.get(page, 0) + 1
            
            return {
                "total_records": total_records,
                "total_themes": len(themes),
                "total_pages": len(pages),
                "themes_distribution": dict(sorted(themes.items(), key=lambda x: x[1], reverse=True)),
                "pages_distribution": dict(sorted(pages.items())),
                "timestamp": datetime.now()
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter estatísticas: {e}")
            return {"error": str(e)}
    
    def backup_supabase_to_json(self, output_path: str = "backup_supabase.json") -> bool:
        """Cria backup dos dados do Supabase em formato JSON"""
        try:
            logger.info(f"💾 Criando backup do Supabase em {output_path}...")
            
            result = self.client.table(self.table_name).select("*").execute()
            
            backup_data = {
                "timestamp": datetime.now().isoformat(),
                "total_records": len(result.data),
                "table_name": self.table_name,
                "data": result.data
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info(f"✅ Backup criado com sucesso: {len(result.data)} registros")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar backup: {e}")
            return False


def main():
    """Função principal para demonstração"""
    print("🚀 DEMONSTRAÇÃO DO SUPABASE MANAGER")
    print("="*50)
    
    # Verificar variáveis de ambiente
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or not key:
        print("❌ Configure as variáveis de ambiente:")
        print("   export SUPABASE_URL='sua_url_aqui'")
        print("   export SUPABASE_KEY='sua_chave_aqui'")
        return
    
    try:
        # Inicializar gerenciador
        manager = SupabaseManager()
        
        # Testar conexão
        if manager.test_connection():
            print("✅ Conexão estabelecida com sucesso!")
            
            # Mostrar SQL para criar tabela
            print("\n📝 SQL para criar a tabela (execute no painel do Supabase):")
            print(manager.get_create_table_sql())
            
            # Obter estatísticas
            stats = manager.get_statistics()
            if "error" not in stats:
                print(f"\n📊 Estatísticas atuais:")
                print(f"   • Total de registros: {stats['total_records']}")
                print(f"   • Total de temas: {stats['total_themes']}")
                print(f"   • Total de páginas: {stats['total_pages']}")
        else:
            print("❌ Falha na conexão")
            
    except Exception as e:
        print(f"❌ Erro: {e}")


if __name__ == "__main__":
    main()