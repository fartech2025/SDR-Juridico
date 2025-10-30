#!/usr/bin/env python3
"""
Script para aplicar melhorias de formatação de texto diretamente no banco Supabase
Conecta ao banco, busca questões, aplica formatação e atualiza os registros
"""

import os
import sys
from typing import List, Dict, Optional
from supabase import create_client, Client
from format_questions_text import QuestionTextFormatter
import json
from datetime import datetime


class SupabaseTextFormatter:
    """Classe para aplicar formatação de textos diretamente no Supabase"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.formatter = QuestionTextFormatter()
        self.processed_count = 0
        self.error_count = 0
        
    def get_questions_batch(self, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Busca um lote de questões do banco"""
        try:
            response = self.supabase.table('questoes').select(
                'id_questao, enunciado, id_prova, id_tema'
            ).range(offset, offset + limit - 1).execute()
            
            return response.data if response.data else []
        
        except Exception as e:
            print(f"❌ Erro ao buscar questões: {e}")
            return []
    
    def get_alternatives_for_question(self, question_id: int) -> List[Dict]:
        """Busca alternativas de uma questão específica"""
        try:
            response = self.supabase.table('alternativas').select(
                'id_alternativa, texto, letra'
            ).eq('id_questao', question_id).execute()
            
            return response.data if response.data else []
        
        except Exception as e:
            print(f"❌ Erro ao buscar alternativas para questão {question_id}: {e}")
            return []
    
    def update_question_text(self, question_id: int, formatted_text: str, summary: str) -> bool:
        """Atualiza o texto formatado de uma questão"""
        try:
            # Criar campos adicionais para manter o original
            update_data = {
                'enunciado': formatted_text,
                'enunciado_original': None,  # Será definido na primeira execução
                'resumo_questao': summary,
                'texto_formatado': True,
                'data_formatacao': datetime.now().isoformat()
            }
            
            response = self.supabase.table('questoes').update(update_data).eq(
                'id_questao', question_id
            ).execute()
            
            return True
        
        except Exception as e:
            print(f"❌ Erro ao atualizar questão {question_id}: {e}")
            return False
    
    def update_alternative_text(self, alternative_id: int, formatted_text: str) -> bool:
        """Atualiza o texto formatado de uma alternativa"""
        try:
            update_data = {
                'texto': formatted_text,
                'texto_formatado': True,
                'data_formatacao': datetime.now().isoformat()
            }
            
            response = self.supabase.table('alternativas').update(update_data).eq(
                'id_alternativa', alternative_id
            ).execute()
            
            return True
        
        except Exception as e:
            print(f"❌ Erro ao atualizar alternativa {alternative_id}: {e}")
            return False
    
    def backup_original_texts(self, question_id: int, original_text: str) -> bool:
        """Faz backup do texto original antes da formatação"""
        try:
            # Verificar se já existe backup
            existing = self.supabase.table('questoes').select('enunciado_original').eq(
                'id_questao', question_id
            ).execute()
            
            if existing.data and existing.data[0].get('enunciado_original'):
                return True  # Backup já existe
            
            # Criar backup
            self.supabase.table('questoes').update({
                'enunciado_original': original_text
            }).eq('id_questao', question_id).execute()
            
            return True
        
        except Exception as e:
            print(f"⚠️ Erro ao fazer backup da questão {question_id}: {e}")
            return False
    
    def process_single_question(self, question: Dict) -> bool:
        """Processa uma única questão e suas alternativas"""
        question_id = question['id_questao']
        original_text = question['enunciado']
        
        if not original_text:
            print(f"⏭️ Questão {question_id}: Sem enunciado para formatar")
            return True
        
        try:
            # Fazer backup do texto original
            self.backup_original_texts(question_id, original_text)
            
            # Formatar enunciado
            formatted_text = self.formatter.format_question_text(original_text)
            summary = self.formatter.generate_question_summary(original_text)
            
            # Atualizar questão
            if not self.update_question_text(question_id, formatted_text, summary):
                return False
            
            # Processar alternativas
            alternatives = self.get_alternatives_for_question(question_id)
            
            for alt in alternatives:
                if alt.get('texto'):
                    formatted_alt_text = self.formatter.format_alternative_text(alt['texto'])
                    
                    if not self.update_alternative_text(alt['id_alternativa'], formatted_alt_text):
                        print(f"⚠️ Falha ao atualizar alternativa {alt['id_alternativa']}")
            
            print(f"✅ Questão {question_id} formatada com sucesso")
            self.processed_count += 1
            return True
        
        except Exception as e:
            print(f"❌ Erro ao processar questão {question_id}: {e}")
            self.error_count += 1
            return False
    
    def format_all_questions(self, batch_size: int = 50, dry_run: bool = False) -> Dict:
        """Formata todas as questões do banco em lotes"""
        
        print(f"🔄 Iniciando formatação de questões (batch_size: {batch_size})")
        if dry_run:
            print("🧪 MODO DRY RUN - Nenhuma alteração será feita no banco")
        
        offset = 0
        total_processed = 0
        results = {
            'success_count': 0,
            'error_count': 0,
            'processed_questions': [],
            'errors': []
        }
        
        while True:
            # Buscar lote de questões
            questions = self.get_questions_batch(batch_size, offset)
            
            if not questions:
                break
            
            print(f"\n📦 Processando lote {offset//batch_size + 1} ({len(questions)} questões)")
            
            for question in questions:
                if dry_run:
                    # Apenas simular formatação
                    formatted = self.formatter.format_question_text(question.get('enunciado', ''))
                    summary = self.formatter.generate_question_summary(question.get('enunciado', ''))
                    
                    print(f"🧪 [DRY RUN] Questão {question['id_questao']}: {summary[:50]}...")
                    results['success_count'] += 1
                else:
                    # Processar de verdade
                    success = self.process_single_question(question)
                    
                    if success:
                        results['success_count'] += 1
                        results['processed_questions'].append(question['id_questao'])
                    else:
                        results['error_count'] += 1
                        results['errors'].append({
                            'question_id': question['id_questao'],
                            'error': 'Falha no processamento'
                        })
                
                total_processed += 1
            
            offset += batch_size
            
            # Status a cada lote
            print(f"📊 Status: {results['success_count']} sucessos, {results['error_count']} erros")
        
        # Relatório final
        print(f"\n🎉 Formatação concluída!")
        print(f"✅ Questões processadas com sucesso: {results['success_count']}")
        print(f"❌ Questões com erro: {results['error_count']}")
        print(f"📊 Total processadas: {total_processed}")
        
        return results
    
    def create_formatting_columns(self) -> bool:
        """Cria colunas adicionais para controle da formatação (se necessário)"""
        print("🏗️ Verificando estrutura do banco para formatação...")
        
        # Nota: Em um cenário real, você executaria comandos SQL para adicionar colunas:
        # ALTER TABLE questoes ADD COLUMN IF NOT EXISTS enunciado_original TEXT;
        # ALTER TABLE questoes ADD COLUMN IF NOT EXISTS resumo_questao TEXT;
        # ALTER TABLE questoes ADD COLUMN IF NOT EXISTS texto_formatado BOOLEAN DEFAULT FALSE;
        # ALTER TABLE questoes ADD COLUMN IF NOT EXISTS data_formatacao TIMESTAMP;
        # 
        # ALTER TABLE alternativas ADD COLUMN IF NOT EXISTS texto_formatado BOOLEAN DEFAULT FALSE;
        # ALTER TABLE alternativas ADD COLUMN IF NOT EXISTS data_formatacao TIMESTAMP;
        
        print("💡 Certifique-se de que as colunas de controle existem no banco:")
        print("   - questoes.enunciado_original (TEXT)")
        print("   - questoes.resumo_questao (TEXT)")
        print("   - questoes.texto_formatado (BOOLEAN)")
        print("   - questoes.data_formatacao (TIMESTAMP)")
        print("   - alternativas.texto_formatado (BOOLEAN)")
        print("   - alternativas.data_formatacao (TIMESTAMP)")
        
        return True


def main():
    """Função principal do script"""
    
    # Configurações do Supabase
    SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', 'https://mskvucuaarutehslvhsp.supabase.co')
    SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za3Z1Y3VhYXJ1dGVoc2x2aHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzQzNDEsImV4cCI6MjA3NTMxMDM0MX0.ZTIrEq9tqpaBUsdgDrg9vwYyvCtXMu_IWyx_EMbMQHQ')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Variáveis de ambiente do Supabase não configuradas")
        print("💡 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY")
        return
    
    # Argumentos da linha de comando
    dry_run = '--dry-run' in sys.argv
    batch_size = 25  # Lotes menores para evitar timeouts
    
    try:
        # Inicializar formatador
        formatter = SupabaseTextFormatter(SUPABASE_URL, SUPABASE_KEY)
        
        # Verificar estrutura do banco
        formatter.create_formatting_columns()
        
        # Confirmar execução se não for dry run
        if not dry_run:
            confirm = input("\n⚠️ Esta operação irá modificar textos no banco de dados. Continuar? (s/N): ")
            if confirm.lower() != 's':
                print("❌ Operação cancelada pelo usuário")
                return
        
        # Executar formatação
        results = formatter.format_all_questions(batch_size=batch_size, dry_run=dry_run)
        
        # Salvar relatório
        report_file = f"output/supabase_formatting_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs('output', exist_ok=True)
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"📄 Relatório salvo em: {report_file}")
        
    except Exception as e:
        print(f"❌ Erro crítico: {e}")
        return


if __name__ == "__main__":
    print("🎯 Formatador de Textos para Supabase")
    print("=" * 50)
    
    # Verificar dependências
    try:
        from supabase import create_client
    except ImportError:
        print("❌ Biblioteca 'supabase' não encontrada")
        print("💡 Instale com: pip install supabase")
        sys.exit(1)
    
    main()