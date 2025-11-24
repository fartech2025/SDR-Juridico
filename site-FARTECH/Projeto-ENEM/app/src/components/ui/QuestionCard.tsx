import React, { useState } from 'react';
import { 
  ClockIcon, 
  BookOpenIcon, 
  StarIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface QuestionCardProps {
  id: string;
  year: number;
  subject: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  excerpt: string;
  imageUrl?: string;
  timeLimit?: number;
  isCompleted?: boolean;
  isCorrect?: boolean;
  isFavorite?: boolean;
  viewCount?: number;
  successRate?: number;
  tags?: string[];
  onStart: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  id: _id,
  year,
  subject,
  theme,
  difficulty,
  excerpt,
  imageUrl,
  timeLimit = 3,
  isCompleted = false,
  isCorrect,
  isFavorite = false,
  viewCount,
  successRate,
  tags = [],
  onStart,
  onToggleFavorite,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getDifficultyConfig = (level: string) => {
    switch (level) {
      case 'easy':
        return {
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          label: 'Fácil'
        };
      case 'medium':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          label: 'Médio'
        };
      case 'hard':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          label: 'Difícil'
        };
      default:
        return {
          color: 'text-slate-400',
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/30',
          label: 'Normal'
        };
    }
  };

  const difficultyConfig = getDifficultyConfig(difficulty);

  return (
    <div className={`glass-card hover-lift glow-on-hover group relative overflow-hidden ${className}`}>
      {/* Status Corner */}
      {isCompleted && (
        <div className="absolute top-4 right-4 z-10">
          {isCorrect ? (
            <div className="flex items-center gap-1 status-success">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-xs">Acertou</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 status-error">
              <XCircleIcon className="w-4 h-4" />
              <span className="text-xs">Errou</span>
            </div>
          )}
        </div>
      )}

      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
        >
          {isFavorite ? (
            <StarSolidIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon className="w-5 h-5 text-slate-400 hover:text-yellow-400" />
          )}
        </button>
      )}

      {/* Image Section */}
      {imageUrl && (
        <div className="relative h-40 bg-slate-800 rounded-t-2xl overflow-hidden">
          {!imageError && (
            <img
              src={imageUrl}
              alt={`Questão ${year} - ${subject}`}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {(!imageLoaded || imageError) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpenIcon className="w-12 h-12 text-slate-600" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-medium text-blue-400">ENEM {year}</span>
              <span>•</span>
              <span>{subject}</span>
            </div>
            
            <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
              {theme}
            </h3>
          </div>

          {/* Difficulty Badge */}
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium
            ${difficultyConfig.bg} ${difficultyConfig.border} ${difficultyConfig.color}
          `}>
            <div className={`w-2 h-2 rounded-full ${difficultyConfig.color.replace('text-', 'bg-')}`} />
            {difficultyConfig.label}
          </div>
        </div>

        {/* Excerpt */}
        <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded-md border border-slate-700"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-slate-400">
                +{tags.length - 3} mais
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            {timeLimit && (
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{timeLimit} min</span>
              </div>
            )}
            
            {viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                <span>{viewCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {successRate !== undefined && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                successRate >= 70 ? 'bg-green-400' : 
                successRate >= 40 ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span>{successRate}% acerto</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onStart}
          className="btn-primary w-full flex items-center justify-center gap-2 group"
        >
          <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {isCompleted ? 'Refazer Questão' : 'Iniciar Questão'}
        </button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/30 rounded-2xl transition-colors pointer-events-none" />
    </div>
  );
};

interface QuestionGridProps {
  questions: Array<QuestionCardProps & { id: string }>;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const QuestionGrid: React.FC<QuestionGridProps> = ({
  questions,
  loading = false,
  emptyMessage = "Nenhuma questão encontrada",
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-card p-6 space-y-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-700 rounded w-24" />
                <div className="h-5 bg-slate-700 rounded w-3/4" />
              </div>
              <div className="h-6 bg-slate-700 rounded-full w-16" />
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-5/6" />
              <div className="h-4 bg-slate-700 rounded w-4/6" />
            </div>
            
            <div className="flex gap-2">
              <div className="h-6 bg-slate-700 rounded w-12" />
              <div className="h-6 bg-slate-700 rounded w-16" />
            </div>
            
            <div className="h-10 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          {...question}
          className={`fade-in`}
        />
      ))}
    </div>
  );
};

export default QuestionCard;