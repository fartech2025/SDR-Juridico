import type { DataSourceStatus } from '@/types/caseIntelligence'

interface Props {
  fontes: DataSourceStatus[]
  onConfigureClick?: () => void
}

const STATUS_CONFIG = {
  ok:         { dot: 'bg-green-500',  label: 'ativo' },
  sem_chave:  { dot: 'bg-amber-400',  label: 'sem chave' },
  offline:    { dot: 'bg-gray-400',   label: 'offline' },
  erro:       { dot: 'bg-red-500',    label: 'erro' },
  desativado: { dot: 'bg-gray-200',   label: 'desativado' },
}

export function SourceStatusBar({ fontes, onConfigureClick }: Props) {
  const semChave = fontes.filter(f => f.status === 'sem_chave')

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {fontes.map((fonte) => {
          const cfg = STATUS_CONFIG[fonte.status]
          const isSemChave = fonte.status === 'sem_chave'

          return (
            <button
              key={fonte.id}
              onClick={isSemChave ? onConfigureClick : undefined}
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                fonte.status === 'desativado'
                  ? 'bg-gray-50 text-gray-400 border border-gray-100'
                  : 'bg-gray-50 text-gray-700 border border-gray-200',
                isSemChave ? 'cursor-pointer hover:bg-amber-50 hover:border-amber-300' : 'cursor-default',
              ].join(' ')}
              title={isSemChave ? 'Clique para configurar' : `${fonte.count} registros`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
              {fonte.label}
              {fonte.count > 0 && (
                <span className="text-gray-500">({fonte.count})</span>
              )}
              {isSemChave && (
                <span className="text-amber-600 ml-0.5">→ configurar</span>
              )}
            </button>
          )
        })}
      </div>

      {semChave.length > 0 && (
        <p className="text-xs text-gray-500">
          {semChave.map(f => f.label).join(', ')} requer
          {semChave.length > 1 ? 'em chaves gratuitas' : ' chave gratuita'}.{' '}
          <button
            onClick={onConfigureClick}
            className="underline hover:text-gray-700 transition-colors"
          >
            Configurar →
          </button>
        </p>
      )}
    </div>
  )
}
