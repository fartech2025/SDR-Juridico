import React from 'react';
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
    const lines = text.split('\n');
    
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
      if (trimmed.match(/\([^)]*\d{4}[^)]*\)|\b[A-Z][A-Z\s]+\.\s+[^.]*\.\s+\d{4}/)) {
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
      if (trimmed.match(/^[a-e]\)|^\d+\.|^[•▪▫-]/)) {
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

export default FormattedTextRenderer;