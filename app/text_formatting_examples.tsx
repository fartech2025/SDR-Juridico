// Exemplo de uso do FormattedTextRenderer no SimuladoProva.tsx

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
};