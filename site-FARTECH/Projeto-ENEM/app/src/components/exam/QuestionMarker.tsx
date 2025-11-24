import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface QuestionStatus {
  answered: boolean;
  correct?: boolean; // undefined = não respondida, true = correta, false = incorreta
  selectedAnswer?: string;
}

interface QuestionMarkerProps {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: QuestionStatus[];
  onQuestionClick: (questionIndex: number) => void;
  onFinishExam: () => void;
  className?: string;
}

export const QuestionMarker: React.FC<QuestionMarkerProps> = ({
  totalQuestions,
  currentQuestion,
  questionStatuses,
  onQuestionClick,
  onFinishExam,
  className = ''
}) => {
  const getQuestionStatusColor = (index: number): string => {
    const status = questionStatuses[index];
    
    if (!status?.answered) {
      return index === currentQuestion 
        ? 'bg-blue-500 border-blue-400 text-white' // Questão atual
        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'; // Não respondida
    }
    
    if (status.correct === true) {
      return 'bg-green-600 border-green-500 text-white'; // Correta
    }
    
    if (status.correct === false) {
      return 'bg-red-600 border-red-500 text-white'; // Incorreta
    }
    
    return 'bg-yellow-600 border-yellow-500 text-white'; // Respondida mas não verificada
  };

  const getQuestionIcon = (index: number) => {
    const status = questionStatuses[index];
    
    if (!status?.answered) {
      return null;
    }
    
    if (status.correct === true) {
      return <CheckIcon className="w-3 h-3" />;
    }
    
    if (status.correct === false) {
      return <XMarkIcon className="w-3 h-3" />;
    }
    
    return null;
  };

  const answeredCount = questionStatuses.filter(status => status?.answered).length;
  const correctCount = questionStatuses.filter(status => status?.correct === true).length;
  const incorrectCount = questionStatuses.filter(status => status?.correct === false).length;

  return (
    <div className={`glass-card p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📊 Progresso do Simulado
        </h3>
        <button
          onClick={onFinishExam}
          className="btn-secondary text-sm px-3 py-1 hover:bg-red-600 hover:border-red-500 hover:text-white transition-colors"
          title="Encerrar simulado"
        >
          Encerrar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <div className="text-slate-400">Total</div>
          <div className="font-bold text-white">{totalQuestions}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400">Respondidas</div>
          <div className="font-bold text-blue-400">{answeredCount}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400">Acertos</div>
          <div className="font-bold text-green-400">{correctCount}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400">Erros</div>
          <div className="font-bold text-red-400">{incorrectCount}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progresso</span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
        </div>
        <div className="progress-bar h-2">
          <div 
            className="progress-fill h-full"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Grid */}
      <div className="space-y-2">
        <div className="text-sm text-slate-400">
          Questões ({currentQuestion + 1}/{totalQuestions})
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-32 overflow-y-auto">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <button
              key={index}
              onClick={() => onQuestionClick(index)}
              className={`
                relative w-8 h-8 rounded-full border-2 text-xs font-bold
                transition-all duration-200 hover:scale-110 focus:outline-none
                focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800
                ${getQuestionStatusColor(index)}
                ${index === currentQuestion ? 'ring-2 ring-blue-300 ring-offset-1 ring-offset-slate-800' : ''}
              `}
              title={`Questão ${index + 1}${questionStatuses[index]?.answered ? ' - Respondida' : ' - Não respondida'}`}
            >
              {getQuestionIcon(index) || (index + 1)}
              
              {/* Indicador de questão atual */}
              {index === currentQuestion && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-700 border border-slate-600 rounded-full" />
          <span className="text-slate-400">Não respondida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border border-blue-400 rounded-full" />
          <span className="text-slate-400">Atual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 border border-green-500 rounded-full flex items-center justify-center">
            <CheckIcon className="w-2 h-2 text-white" />
          </div>
          <span className="text-slate-400">Correta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 border border-red-500 rounded-full flex items-center justify-center">
            <XMarkIcon className="w-2 h-2 text-white" />
          </div>
          <span className="text-slate-400">Incorreta</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t border-slate-700">
        <button
          onClick={() => onQuestionClick(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="btn-ghost text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        <button
          onClick={() => onQuestionClick(Math.min(totalQuestions - 1, currentQuestion + 1))}
          disabled={currentQuestion === totalQuestions - 1}
          className="btn-ghost text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próxima →
        </button>
        <div className="flex-1" />
        <button
          onClick={onFinishExam}
          className="btn-primary text-xs px-3 py-1"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
};

export default QuestionMarker;