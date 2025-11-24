import { useMemo } from 'react';

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
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    // Melhorar formatação de parágrafos
    cleanText = cleanText
      .replace(/\.\s+([A-Z])/g, '.\n\n$1')
      .replace(/([.!?])\s+(Qual|Quais|Como|Por que|O que)/gi, '$1\n\n$2');
    
    // Formatar listas
    cleanText = cleanText
      .replace(/\s*\b([a-e])\)\s*/g, '\n$1) ')
      .replace(/\s*\b(\d+)[.)]\s*/g, '\n$1. ');
    
    // Destacar citações longas
    cleanText = cleanText.replace(
      /"([^"]{50,})"/g, 
      '\n\n"$1"\n\n'
    );
    
    // Gerar resumo
    const words = cleanText.split(/\s+/).filter(word => 
      word.length > 2 && !['com', 'para', 'que', 'uma', 'dos', 'das', 'por'].includes(word.toLowerCase())
    );
    
    const summary = words
      .slice(0, maxSummaryWords)
      .join(' ') + (words.length > maxSummaryWords ? '...' : '');
    
    // Identificar seções
    const sections = cleanText.split('\n\n').map(section => {
      const trimmed = section.trim();
      
      if (trimmed.match(/^[""].*[""]$/)) {
        return { type: 'citation', content: trimmed };
      }
      
      if (trimmed.match(/\([^)]*\d{4}[^)]*\)/)) {
        return { type: 'reference', content: trimmed };
      }
      
      if (trimmed.match(/^(Com base|Considerando|De acordo)/i)) {
        return { type: 'instruction', content: trimmed };
      }
      
      if (trimmed.match(/^[a-e]\)|^\d+\.|^[•▪▫-]/)) {
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

export default useTextFormatter;