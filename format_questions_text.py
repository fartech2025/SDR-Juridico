#!/usr/bin/env python3
"""
Script para melhorar a formatação dos textos das questões do ENEM
Aplica melhorias na disposição, formatação e legibilidade dos enunciados
"""

import re
import json
import html
from typing import Dict, List, Optional
import unicodedata


class QuestionTextFormatter:
    """Classe para formatação de textos de questões do ENEM"""
    
    def __init__(self):
        # Configurações de formatação
        self.max_line_length = 80
        self.paragraph_break = "\n\n"
        self.line_break = "\n"
        
        # Padrões para identificar diferentes tipos de conteúdo
        self.citation_patterns = [
            r'"([^"]*)"',  # Citações com aspas duplas
            r'"([^"]*)"',  # Citações com aspas curvas
            r'«([^»]*)»',  # Citações com guillemets
        ]
        
        self.reference_patterns = [
            r'\([^)]*\d{4}[^)]*\)',  # Referencias com anos (AUTOR, 2024)
            r'\b[A-Z][A-Z\s]+\.\s+[^.]*\.\s+\d{4}',  # Referências bibliográficas
        ]
        
        self.instruction_patterns = [
            r'Com base (?:no|na) .+?,',
            r'Considerando (?:o|a) .+?,',
            r'De acordo com (?:o|a) .+?,',
            r'A partir d[aoe] .+?,',
            r'Tendo em vista .+?,',
        ]

    def clean_html_entities(self, text: str) -> str:
        """Remove entidades HTML e caracteres especiais"""
        # Decodificar entidades HTML
        text = html.unescape(text)
        
        # Normalizar caracteres Unicode
        text = unicodedata.normalize('NFKC', text)
        
        # Remover caracteres de controle
        text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C' or char in '\n\t')
        
        return text

    def normalize_whitespace(self, text: str) -> str:
        """Normaliza espaços em branco e quebras de linha"""
        # Converter múltiplos espaços em um só
        text = re.sub(r' +', ' ', text)
        
        # Normalizar quebras de linha
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        text = re.sub(r'\n ', '\n', text)
        
        # Remover espaços no início e fim de linhas
        lines = text.split('\n')
        lines = [line.strip() for line in lines]
        text = '\n'.join(lines)
        
        return text.strip()

    def format_citations(self, text: str) -> str:
        """Melhora a formatação de citações"""
        # Adicionar espaçamento antes e depois de citações longas
        for pattern in self.citation_patterns:
            def replace_citation(match):
                citation = match.group(1)
                if len(citation) > 50:  # Citação longa
                    return f'\n\n"{citation}"\n\n'
                else:
                    return f'"{citation}"'
            
            text = re.sub(pattern, replace_citation, text)
        
        return text

    def format_references(self, text: str) -> str:
        """Melhora a formatação de referências bibliográficas"""
        for pattern in self.reference_patterns:
            # Colocar referências em linha separada
            text = re.sub(pattern, lambda m: f'\n\n{m.group(0)}', text)
        
        return text

    def format_instructions(self, text: str) -> str:
        """Melhora a formatação de instruções da questão"""
        for pattern in self.instruction_patterns:
            # Destacar instruções com quebra de linha
            text = re.sub(pattern, lambda m: f'\n{m.group(0)}', text, flags=re.IGNORECASE)
        
        return text

    def add_paragraph_breaks(self, text: str) -> str:
        """Adiciona quebras de parágrafo em pontos apropriados"""
        # Quebra após pontos finais seguidos de letra maiúscula
        text = re.sub(r'\.(\s+)([A-Z])', r'.\n\n\2', text)
        
        # Quebra antes de perguntas
        question_starters = [
            r'\bQual\b', r'\bQuais\b', r'\bQuem\b', r'\bQuando\b', 
            r'\bOnde\b', r'\bComo\b', r'\bPor que\b', r'\bO que\b'
        ]
        
        for starter in question_starters:
            text = re.sub(f'([.!?])\\s+({starter})', r'\1\n\n\2', text, flags=re.IGNORECASE)
        
        return text

    def format_lists_and_enumerations(self, text: str) -> str:
        """Melhora a formatação de listas e enumerações"""
        # Detectar listas com letras (a), b), c), etc.
        text = re.sub(r'\s*\b([a-e])\)\s*', r'\n\1) ', text)
        
        # Detectar listas numeradas
        text = re.sub(r'\s*\b(\d+)[.)]?\s*', r'\n\1. ', text)
        
        # Detectar marcadores com traços ou bullets
        text = re.sub(r'\s*[-•▪▫]\s*', r'\n• ', text)
        
        return text

    def improve_readability(self, text: str) -> str:
        """Aplica melhorias gerais de legibilidade"""
        # Espaçamento após pontuação
        text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)
        text = re.sub(r'([,;:])([A-Z])', r'\1 \2', text)
        
        # Espaçamento em números e unidades
        text = re.sub(r'(\d+)([a-zA-Z])', r'\1 \2', text)
        
        # Corrigir espaçamento em parênteses
        text = re.sub(r'\(\s+', '(', text)
        text = re.sub(r'\s+\)', ')', text)
        
        return text

    def format_question_text(self, text: str) -> str:
        """Aplica todas as melhorias de formatação ao texto da questão"""
        if not text or not isinstance(text, str):
            return ""
        
        # Etapas de formatação
        text = self.clean_html_entities(text)
        text = self.normalize_whitespace(text)
        text = self.format_citations(text)
        text = self.format_references(text)
        text = self.format_instructions(text)
        text = self.add_paragraph_breaks(text)
        text = self.format_lists_and_enumerations(text)
        text = self.improve_readability(text)
        text = self.normalize_whitespace(text)  # Normalizar novamente após todas as mudanças
        
        return text

    def format_alternative_text(self, text: str) -> str:
        """Formata o texto de uma alternativa"""
        if not text or not isinstance(text, str):
            return ""
        
        text = self.clean_html_entities(text)
        text = self.normalize_whitespace(text)
        text = self.improve_readability(text)
        
        # Para alternativas, manter texto mais compacto
        text = re.sub(r'\n+', ' ', text)
        
        return text.strip()

    def generate_question_summary(self, text: str, max_words: int = 15) -> str:
        """Gera um resumo da questão para facilitar identificação"""
        if not text:
            return "Questão sem enunciado"
        
        # Remover citações e referências para o resumo
        clean_text = text
        for pattern in self.citation_patterns + self.reference_patterns:
            clean_text = re.sub(pattern, '', clean_text)
        
        # Pegar as primeiras palavras significativas
        words = clean_text.split()
        significant_words = []
        
        for word in words:
            if len(word) > 2 and not word.lower() in ['com', 'para', 'que', 'uma', 'dos', 'das', 'por']:
                significant_words.append(word)
                if len(significant_words) >= max_words:
                    break
        
        summary = ' '.join(significant_words)
        
        # Adicionar reticências se foi truncado
        if len(words) > max_words:
            summary += "..."
        
        return summary


def format_json_questions(input_file: str, output_file: str):
    """Formata questões de um arquivo JSON e salva o resultado"""
    formatter = QuestionTextFormatter()
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Verificar se é o formato antigo ou novo
        if isinstance(data, dict) and 'questions' in data:
            # Formato do extrator (com questions array)
            questions = data['questions']
            source_info = {
                'source_pdf': data.get('source_pdf', 'unknown'),
                'processed_date': data.get('processed_date', '2025-10-28'),
                'total_questions': len(questions)
            }
        elif isinstance(data, list):
            # Formato direto (array de questões)
            questions = data
            source_info = {
                'source_pdf': 'direct_format',
                'processed_date': '2025-10-28',
                'total_questions': len(questions)
            }
        else:
            raise ValueError("Formato de arquivo JSON não reconhecido")
        
        formatted_questions = []
        
        for i, question in enumerate(questions):
            print(f"Formatando questão {i+1}/{len(questions)}...")
            
            # Criar cópia segura baseada no tipo
            if isinstance(question, dict):
                formatted_question = question.copy()
            else:
                formatted_question = {"raw_data": question}
            
            # Extrair texto da questão baseado na estrutura
            question_text = ""
            
            if isinstance(question, dict):
                # Formato do extractor com 'content' array
                if 'content' in question and isinstance(question['content'], list):
                    text_parts = []
                    for content_item in question['content']:
                        if isinstance(content_item, dict) and content_item.get('type') == 'text':
                            text_parts.append(content_item.get('value', ''))
                    question_text = ' '.join(text_parts)
                
                # Formato direto com 'enunciado'
                elif 'enunciado' in question:
                    question_text = question['enunciado']
                
                # Formato com texto direto
                elif 'text' in question:
                    question_text = question['text']
                
                # Tentar extrair de qualquer campo de texto
                else:
                    for key, value in question.items():
                        if isinstance(value, str) and len(value) > 50:
                            question_text = value
                            break
            
            # Formatar texto se encontrado
            if question_text:
                formatted_question['enunciado_formatado'] = formatter.format_question_text(question_text)
                formatted_question['resumo'] = formatter.generate_question_summary(question_text)
                formatted_question['enunciado_original'] = question_text
                formatted_question['texto_melhorado'] = True
            else:
                formatted_question['enunciado_formatado'] = ""
                formatted_question['resumo'] = "Questão sem texto identificado"
                formatted_question['texto_melhorado'] = False
            
            # Processar alternativas se existirem
            if 'alternativas' in question and isinstance(question['alternativas'], list):
                formatted_alternatives = []
                for alt in question['alternativas']:
                    if isinstance(alt, dict):
                        formatted_alt = alt.copy()
                        if 'texto' in alt:
                            formatted_alt['texto'] = formatter.format_alternative_text(alt['texto'])
                        formatted_alternatives.append(formatted_alt)
                    else:
                        formatted_alternatives.append(alt)
                formatted_question['alternativas'] = formatted_alternatives
            
            formatted_questions.append(formatted_question)
        
        # Salvar questões formatadas com metadados
        output_data = {
            'source_info': source_info,
            'formatting_info': {
                'processed_date': '2025-10-28',
                'formatter_version': '1.0',
                'improvements_applied': [
                    'Normalização de espaços em branco',
                    'Formatação de citações',
                    'Estruturação de parágrafos',
                    'Formatação de listas',
                    'Geração de resumos'
                ]
            },
            'questions': formatted_questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Formatação concluída! {len(formatted_questions)} questões salvas em {output_file}")
        
        return formatted_questions
        
    except Exception as e:
        print(f"❌ Erro ao formatar questões: {e}")
        import traceback
        traceback.print_exc()
        return None


def create_formatting_report(original_file: str, formatted_file: str, report_file: str):
    """Cria um relatório comparando textos originais e formatados"""
    try:
        with open(original_file, 'r', encoding='utf-8') as f:
            original = json.load(f)
        
        with open(formatted_file, 'r', encoding='utf-8') as f:
            formatted = json.load(f)
        
        report = {
            "summary": {
                "total_questions": len(original),
                "processing_date": "2025-10-28",
                "improvements_applied": [
                    "Normalização de espaços em branco",
                    "Formatação de citações longas",
                    "Melhoria na estrutura de parágrafos",
                    "Formatação de listas e enumerações",
                    "Correção de pontuação e espaçamento",
                    "Geração de resumos automáticos"
                ]
            },
            "sample_comparisons": []
        }
        
        # Adicionar algumas comparações de exemplo
        for i in range(min(3, len(original))):
            if 'enunciado' in original[i] and 'enunciado' in formatted[i]:
                comparison = {
                    "question_index": i + 1,
                    "original_length": len(original[i]['enunciado']),
                    "formatted_length": len(formatted[i]['enunciado']),
                    "original_preview": original[i]['enunciado'][:100] + "...",
                    "formatted_preview": formatted[i]['enunciado'][:100] + "...",
                    "summary": formatted[i].get('resumo', 'N/A')
                }
                report['sample_comparisons'].append(comparison)
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📊 Relatório de formatação salvo em {report_file}")
        
    except Exception as e:
        print(f"❌ Erro ao criar relatório: {e}")


if __name__ == "__main__":
    # Configurações
    input_file = "output/enem2024_lc_questions_content.json"
    output_file = "output/enem2024_lc_questions_formatted.json"
    report_file = "output/formatting_report.json"
    
    print("🔄 Iniciando formatação de textos das questões...")
    
    # Verificar se arquivo de entrada existe
    import os
    if not os.path.exists(input_file):
        print(f"❌ Arquivo {input_file} não encontrado!")
        print("💡 Certifique-se de ter executado o script de extração primeiro.")
        exit(1)
    
    # Executar formatação
    formatted_questions = format_json_questions(input_file, output_file)
    
    if formatted_questions:
        # Criar relatório
        create_formatting_report(input_file, output_file, report_file)
        
        print("\n🎉 Processo concluído com sucesso!")
        print(f"📁 Arquivo formatado: {output_file}")
        print(f"📊 Relatório: {report_file}")
        print("\n💡 Para usar as questões formatadas, atualize o sistema para carregar do arquivo formatado.")
    else:
        print("\n❌ Falha na formatação das questões.")