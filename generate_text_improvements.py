#!/usr/bin/env python3
"""
Script para gerar componentes React que melhoram a renderização de textos formatados
Cria hooks e componentes para exibição otimizada dos enunciados
"""

import os
from typing import Dict, List


def create_text_renderer_component():
    """Cria componente React para renderização melhorada de textos"""
    
    component_code = '''import React from 'react';
import { useState } from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  showSummary?: boolean;
  maxHeight?: number;
}

interface TextSection {
  type: 'paragraph' | 'citation' | 'reference' | 'instruction' | 'list';
  content: string;
  level?: number;
}

export const FormattedTextRenderer: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  showSummary = false,
  maxHeight
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Função para detectar e classificar seções do texto
  const parseTextSections = (text: string): TextSection[] => {
    if (!text) return [];
    
    const sections: TextSection[] = [];
    const lines = text.split('\\n');
    
    let currentParagraph = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        if (currentParagraph) {
          sections.push({
            type: 'paragraph',
            content: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        continue;
      }
      
      // Detectar citações (texto entre aspas)
      if (trimmed.match(/^[""].*[""]$/)) {
        if (currentParagraph) {
          sections.push({
            type: 'paragraph',
            content: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        sections.push({
          type: 'citation',
          content: trimmed.replace(/^[""]|[""]$/g, '')
        });
        continue;
      }
      
      // Detectar referências (texto com parênteses e anos)
      if (trimmed.match(/\\([^)]*\\d{4}[^)]*\\)|\\b[A-Z][A-Z\\s]+\\.\\s+[^.]*\\.\\s+\\d{4}/)) {
        if (currentParagraph) {
          sections.push({
            type: 'paragraph',
            content: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        sections.push({
          type: 'reference',
          content: trimmed
        });
        continue;
      }
      
      // Detectar instruções
      if (trimmed.match(/^(Com base|Considerando|De acordo|A partir|Tendo em vista)/i)) {
        if (currentParagraph) {
          sections.push({
            type: 'paragraph',
            content: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        sections.push({
          type: 'instruction',
          content: trimmed
        });
        continue;
      }
      
      // Detectar listas
      if (trimmed.match(/^[a-e]\\)|^\\d+\\.|^[•▪▫-]/)) {
        if (currentParagraph) {
          sections.push({
            type: 'paragraph',
            content: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        sections.push({
          type: 'list',
          content: trimmed
        });
        continue;
      }
      
      // Adicionar à parágrafo atual
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
    }
    
    // Adicionar último parágrafo se existir
    if (currentParagraph) {
      sections.push({
        type: 'paragraph',
        content: currentParagraph.trim()
      });
    }
    
    return sections;
  };
  
  const sections = parseTextSections(text);
  
  // Função para renderizar cada seção
  const renderSection = (section: TextSection, index: number) => {
    const key = `section-${index}`;
    
    switch (section.type) {
      case 'citation':
        return (
          <blockquote
            key={key}
            className="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50/10 italic text-gray-300"
          >
            "{section.content}"
          </blockquote>
        );
      
      case 'reference':
        return (
          <p
            key={key}
            className="text-sm text-gray-400 mt-2 font-mono border-t border-gray-700 pt-2"
          >
            {section.content}
          </p>
        );
      
      case 'instruction':
        return (
          <div
            key={key}
            className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-3 my-3"
          >
            <p className="text-white font-medium">{section.content}</p>
          </div>
        );
      
      case 'list':
        return (
          <div key={key} className="ml-4 my-1">
            <p className="text-gray-200">{section.content}</p>
          </div>
        );
      
      default: // paragraph
        return (
          <p key={key} className="text-gray-200 leading-relaxed mb-3">
            {section.content}
          </p>
        );
    }
  };
  
  // Calcular se precisa de botão "Ver mais"
  const needsExpansion = maxHeight && text.length > 500;
  const displaySections = needsExpansion && !isExpanded 
    ? sections.slice(0, 2) 
    : sections;
  
  return (
    <div className={`formatted-text ${className}`}>
      {showSummary && (
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
          <h4 className="text-blue-400 font-semibold text-sm mb-2">📝 Resumo da Questão</h4>
          <p className="text-gray-300 text-sm">
            {text.split(' ').slice(0, 20).join(' ')}
            {text.split(' ').length > 20 ? '...' : ''}
          </p>
        </div>
      )}
      
      <div 
        className="text-content"
        style={maxHeight && !isExpanded ? { maxHeight: `${maxHeight}px`, overflow: 'hidden' } : {}}
      >
        {displaySections.map(renderSection)}
      </div>
      
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {isExpanded ? '▲ Ver menos' : '▼ Ver mais'}
        </button>
      )}
    </div>
  );
};

export default FormattedTextRenderer;'''
    
    return component_code


def create_text_formatter_hook():
    """Cria hook React para formatação de textos"""
    
    hook_code = '''import { useMemo } from 'react';

interface UseTextFormatterOptions {
  enableFormatting?: boolean;
  maxSummaryWords?: number;
  preserveOriginal?: boolean;
}

interface FormattedTextResult {
  formattedText: string;
  summary: string;
  wordCount: number;
  hasFormatting: boolean;
  sections: Array<{
    type: string;
    content: string;
  }>;
}

export const useTextFormatter = (
  text: string, 
  options: UseTextFormatterOptions = {}
): FormattedTextResult => {
  const {
    enableFormatting = true,
    maxSummaryWords = 15,
    preserveOriginal = false
  } = options;
  
  return useMemo(() => {
    if (!text || !enableFormatting) {
      return {
        formattedText: text || '',
        summary: '',
        wordCount: 0,
        hasFormatting: false,
        sections: []
      };
    }
    
    // Limpeza básica de HTML e entidades
    let cleanText = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    // Normalizar espaços
    cleanText = cleanText
      .replace(/\\s+/g, ' ')
      .replace(/\\n\\s*\\n/g, '\\n\\n')
      .trim();
    
    // Melhorar formatação de parágrafos
    cleanText = cleanText
      .replace(/\\.\\s+([A-Z])/g, '.\\n\\n$1')
      .replace(/([.!?])\\s+(Qual|Quais|Como|Por que|O que)/gi, '$1\\n\\n$2');
    
    // Formatar listas
    cleanText = cleanText
      .replace(/\\s*\\b([a-e])\\)\\s*/g, '\\n$1) ')
      .replace(/\\s*\\b(\\d+)[.)]\\s*/g, '\\n$1. ');
    
    // Destacar citações longas
    cleanText = cleanText.replace(
      /"([^"]{50,})"/g, 
      '\\n\\n"$1"\\n\\n'
    );
    
    // Gerar resumo
    const words = cleanText.split(/\\s+/).filter(word => 
      word.length > 2 && !['com', 'para', 'que', 'uma', 'dos', 'das', 'por'].includes(word.toLowerCase())
    );
    
    const summary = words
      .slice(0, maxSummaryWords)
      .join(' ') + (words.length > maxSummaryWords ? '...' : '');
    
    // Identificar seções
    const sections = cleanText.split('\\n\\n').map(section => {
      const trimmed = section.trim();
      
      if (trimmed.match(/^[""].*[""]$/)) {
        return { type: 'citation', content: trimmed };
      }
      
      if (trimmed.match(/\\([^)]*\\d{4}[^)]*\\)/)) {
        return { type: 'reference', content: trimmed };
      }
      
      if (trimmed.match(/^(Com base|Considerando|De acordo)/i)) {
        return { type: 'instruction', content: trimmed };
      }
      
      if (trimmed.match(/^[a-e]\\)|^\\d+\\.|^[•▪▫-]/)) {
        return { type: 'list', content: trimmed };
      }
      
      return { type: 'paragraph', content: trimmed };
    }).filter(section => section.content);
    
    return {
      formattedText: preserveOriginal ? text : cleanText,
      summary,
      wordCount: words.length,
      hasFormatting: cleanText !== text,
      sections
    };
  }, [text, enableFormatting, maxSummaryWords, preserveOriginal]);
};

export default useTextFormatter;'''
    
    return hook_code


def create_css_styles():
    """Cria estilos CSS otimizados para textos formatados"""
    
    css_code = '''/* Estilos para textos formatados de questões */
.formatted-text {
  @apply text-gray-200 leading-relaxed;
}

.formatted-text p {
  @apply mb-3 leading-7;
}

.formatted-text blockquote {
  @apply border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50/10 italic text-gray-300;
}

.formatted-text .reference {
  @apply text-sm text-gray-400 mt-2 font-mono border-t border-gray-700 pt-2;
}

.formatted-text .instruction {
  @apply bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-3 my-3;
}

.formatted-text .list-item {
  @apply ml-4 my-1 text-gray-200;
}

.formatted-text .citation {
  @apply bg-gray-800/30 border-l-4 border-yellow-400 pl-4 py-3 my-4 rounded-r-lg;
}

.formatted-text .summary {
  @apply bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700;
}

.formatted-text .expand-button {
  @apply mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors cursor-pointer;
}

/* Animações para expansão de texto */
.text-expand-enter {
  opacity: 0;
  max-height: 0;
}

.text-expand-enter-active {
  opacity: 1;
  max-height: 1000px;
  transition: opacity 300ms, max-height 300ms;
}

.text-expand-exit {
  opacity: 1;
  max-height: 1000px;
}

.text-expand-exit-active {
  opacity: 0;
  max-height: 0;
  transition: opacity 300ms, max-height 300ms;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .formatted-text {
    @apply text-sm;
  }
  
  .formatted-text p {
    @apply mb-2 leading-6;
  }
  
  .formatted-text blockquote {
    @apply pl-3 py-2 my-3;
  }
  
  .formatted-text .instruction {
    @apply p-2 my-2;
  }
}

/* Estilos para melhor legibilidade */
.formatted-text h4 {
  @apply text-blue-400 font-semibold mb-2;
}

.formatted-text strong {
  @apply font-semibold text-white;
}

.formatted-text em {
  @apply italic text-gray-300;
}

.formatted-text code {
  @apply bg-gray-800 px-2 py-1 rounded text-sm font-mono text-green-400;
}

/* Destaque para números e medidas */
.formatted-text .number {
  @apply font-semibold text-blue-300;
}

.formatted-text .unit {
  @apply text-gray-300 ml-1;
}

/* Estilos para alternativas melhoradas */
.alternative-text {
  @apply text-gray-200 leading-relaxed p-3 rounded-lg border border-gray-700 bg-gray-800/30;
}

.alternative-text:hover {
  @apply bg-gray-700/30 border-gray-600;
}

.alternative-text.selected {
  @apply bg-blue-600/20 border-blue-500;
}'''
    
    return css_code


def generate_frontend_improvements():
    """Gera todos os arquivos de melhoria para o frontend"""
    
    base_path = "/Users/fernandodias/Desktop/BancoEnem/app/src"
    
    # Criar diretório para componentes de texto
    text_components_dir = os.path.join(base_path, "components", "text")
    os.makedirs(text_components_dir, exist_ok=True)
    
    # Criar diretório para hooks
    hooks_dir = os.path.join(base_path, "hooks")
    os.makedirs(hooks_dir, exist_ok=True)
    
    # Criar diretório para estilos
    styles_dir = os.path.join(base_path, "styles")
    os.makedirs(styles_dir, exist_ok=True)
    
    files_created = []
    
    # Gerar componente FormattedTextRenderer
    renderer_path = os.path.join(text_components_dir, "FormattedTextRenderer.tsx")
    with open(renderer_path, 'w', encoding='utf-8') as f:
        f.write(create_text_renderer_component())
    files_created.append(renderer_path)
    
    # Gerar hook useTextFormatter
    hook_path = os.path.join(hooks_dir, "useTextFormatter.ts")
    with open(hook_path, 'w', encoding='utf-8') as f:
        f.write(create_text_formatter_hook())
    files_created.append(hook_path)
    
    # Gerar estilos CSS
    css_path = os.path.join(styles_dir, "formatted-text.css")
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(create_css_styles())
    files_created.append(css_path)
    
    # Gerar arquivo de índice para exportar componentes
    index_path = os.path.join(text_components_dir, "index.ts")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write('''export { default as FormattedTextRenderer } from './FormattedTextRenderer';
export { default as useTextFormatter } from '../hooks/useTextFormatter';''')
    files_created.append(index_path)
    
    return files_created


def create_usage_examples():
    """Cria exemplos de uso dos novos componentes"""
    
    example_code = '''// Exemplo de uso do FormattedTextRenderer no SimuladoProva.tsx

import React from 'react';
import { FormattedTextRenderer } from '@/components/text';

// Dentro do componente SimuladoProva
const questao = questoes[questaoAtual];

return (
  <div className="question-container">
    {/* Enunciado formatado */}
    <FormattedTextRenderer 
      text={questao.enunciado}
      showSummary={true}
      maxHeight={400}
      className="mb-6"
    />
    
    {/* Alternativas com formatação melhorada */}
    <div className="alternatives-container">
      {questao.alternativas?.map((alt, index) => {
        const letra = String.fromCharCode(65 + index); // A, B, C, D, E
        
        return (
          <label
            key={alt.id_alternativa}
            className={`alternative-text cursor-pointer transition-all duration-200 ${
              respostaSelecionada === alt.texto 
                ? 'selected' 
                : 'hover:bg-gray-700/30'
            }`}
          >
            <input
              type="radio"
              name="resposta"
              value={alt.texto}
              checked={respostaSelecionada === alt.texto}
              onChange={(e) => setRespostaSelecionada(e.target.value)}
              className="sr-only"
            />
            <span className="font-semibold mr-3 text-blue-400">{letra})</span>
            <FormattedTextRenderer 
              text={alt.texto}
              className="inline"
            />
          </label>
        );
      })}
    </div>
  </div>
);

// Exemplo com hook useTextFormatter
import { useTextFormatter } from '@/hooks/useTextFormatter';

const QuestionPreview = ({ questionText }) => {
  const formatted = useTextFormatter(questionText, {
    enableFormatting: true,
    maxSummaryWords: 10
  });
  
  return (
    <div>
      <h3>{formatted.summary}</h3>
      <p>Palavras: {formatted.wordCount}</p>
      <div>{formatted.formattedText}</div>
    </div>
  );
};'''
    
    return example_code


def main():
    """Função principal para gerar melhorias de formatação"""
    
    print("🎨 Gerando melhorias de formatação de textos...")
    print("=" * 60)
    
    # Gerar scripts Python
    print("\n📝 Scripts Python criados:")
    print("✅ format_questions_text.py - Formatação offline de questões")
    print("✅ supabase_text_formatter.py - Formatação direta no banco")
    
    # Gerar melhorias para o frontend
    print("\n🔧 Gerando componentes React...")
    try:
        files_created = generate_frontend_improvements()
        
        print("✅ Componentes React criados:")
        for file_path in files_created:
            print(f"   📄 {file_path}")
        
        # Salvar exemplos de uso
        example_path = "/Users/fernandodias/Desktop/BancoEnem/app/text_formatting_examples.tsx"
        with open(example_path, 'w', encoding='utf-8') as f:
            f.write(create_usage_examples())
        
        print(f"✅ Exemplos de uso: {example_path}")
        
    except Exception as e:
        print(f"❌ Erro ao gerar componentes: {e}")
    
    print("\n🚀 Próximos passos:")
    print("1. Execute format_questions_text.py para formatar questões offline")
    print("2. Use supabase_text_formatter.py --dry-run para testar formatação no banco")
    print("3. Importe FormattedTextRenderer nos componentes React")
    print("4. Adicione os estilos CSS ao projeto")
    print("5. Teste a nova formatação nas questões")
    
    print("\n💡 Benefícios das melhorias:")
    print("• ✨ Textos mais legíveis com parágrafos bem estruturados")
    print("• 📖 Citações destacadas visualmente")
    print("• 📝 Referências bibliográficas organizadas")
    print("• 📋 Listas e enumerações formatadas")
    print("• 🔍 Resumos automáticos das questões")
    print("• 📱 Layout responsivo para mobile")
    print("• ⚡ Performance otimizada com hooks React")


if __name__ == "__main__":
    main()