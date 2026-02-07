// src/features/dou/components/CasoDouSection.tsx
import { useState } from 'react'
import { Newspaper, Search, Settings2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useDOU } from '../hooks/useDOU'
import { DOUSearchModal } from './DOUSearchModal'
import { DOUMonitorConfig } from './DOUMonitorConfig'
import type { Caso, DOUPublicacao } from '@/types/domain'

interface CasoDouSectionProps {
  caso: Caso
  orgId: string | null
}

const tipoLabels: Record<string, string> = {
  intimacao: 'Intimacao',
  citacao: 'Citacao',
  edital: 'Edital',
  despacho: 'Despacho',
  sentenca: 'Sentenca',
  outro: 'Outro',
}

const tipoBorderColors: Record<string, string> = {
  intimacao: 'border-red-400',
  citacao: 'border-orange-400',
  edital: 'border-yellow-400',
  despacho: 'border-blue-400',
  sentenca: 'border-purple-400',
  outro: 'border-gray-300',
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function formatDateBR(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function PublicacaoItem({
  pub,
  onMarcarLida,
}: {
  pub: DOUPublicacao
  onMarcarLida: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const tipo = pub.tipo_publicacao || 'outro'
  const borderColor = tipoBorderColors[tipo] || 'border-gray-300'

  return (
    <div
      className={`border-l-2 ${borderColor} rounded-r-lg bg-gray-50 px-3 py-2 ${!pub.lida ? 'ring-1 ring-amber-200/50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gray-600">
              {tipoLabels[tipo] || tipo}
            </span>
            <span className="text-[10px] text-gray-500">
              {formatDateBR(pub.data_publicacao)}
            </span>
            {!pub.lida && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                Nova
              </span>
            )}
          </div>
          <p className="font-medium text-xs text-gray-900 leading-tight">
            {pub.titulo}
          </p>
          {pub.conteudo && (
            <>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                {expanded
                  ? pub.conteudo.replace(/<[^>]+>/g, '')
                  : truncate(pub.conteudo.replace(/<[^>]+>/g, ''), 120)}
              </p>
              {pub.conteudo.length > 120 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] hover:underline mt-0.5"
                  style={{ color: '#721011' }}
                >
                  {expanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!pub.lida && (
            <button
              type="button"
              onClick={() => onMarcarLida(pub.id)}
              className="rounded-md bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Lida
            </button>
          )}
          {pub.url_publicacao && (
            <a
              href={pub.url_publicacao}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 hover:bg-amber-100 text-center transition-colors"
            >
              Abrir
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function CasoDouSection({ caso, orgId }: CasoDouSectionProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [showPublicacoes, setShowPublicacoes] = useState(false)

  const {
    publicacoes,
    termos,
    loading,
    error,
    naoLidas,
    monitorarDOU,
    monitorarLoading,
    marcarLida,
    addTermo,
    removeTermo,
    toggleTermo,
    toggleMonitorarDOU,
    refresh,
  } = useDOU(caso.id)

  const hasPublicacoes = publicacoes.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
        >
          <Newspaper className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">Diario Oficial</h3>
          <p className="text-xs text-gray-500">DOU - Imprensa Nacional</p>
        </div>
        <div className="flex items-center gap-2">
          {naoLidas > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              {naoLidas} nova{naoLidas !== 1 ? 's' : ''}
            </span>
          )}
          <label className="relative inline-flex items-center cursor-pointer" title={monitorarDOU ? 'Monitoramento ativo' : 'Monitoramento pausado'}>
            <input
              type="checkbox"
              checked={monitorarDOU}
              onChange={(e) => toggleMonitorarDOU(e.target.checked)}
              disabled={monitorarLoading}
              className="sr-only peer"
            />
            <div
              className={`bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:transition-all ${monitorarLoading ? 'opacity-50' : ''}`}
              style={{ width: '2rem', height: '1.125rem' }}
            >
              <div
                className={`absolute top-[2px] left-[2px] bg-white rounded-full transition-all ${monitorarDOU ? 'translate-x-3.5' : ''}`}
                style={{ width: '0.875rem', height: '0.875rem' }}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-[10px] text-red-600 mb-4">
            {error}
          </div>
        )}

        {hasPublicacoes ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl bg-amber-50/50 border border-amber-100/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">
                  {publicacoes.length} publicacao{publicacoes.length !== 1 ? 'es' : ''} encontrada{publicacoes.length !== 1 ? 's' : ''}
                </p>
                {naoLidas > 0 && (
                  <span className="text-xs text-amber-700 font-medium">
                    {naoLidas} nao lida{naoLidas !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {termos.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400">Termos:</span>
                  {termos.filter(t => t.ativo).slice(0, 3).map(t => (
                    <span key={t.id} className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                      {t.termo}
                    </span>
                  ))}
                  {termos.filter(t => t.ativo).length > 3 && (
                    <span className="text-[10px] text-gray-400">
                      +{termos.filter(t => t.ativo).length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#721011' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                type="button"
                onClick={() => setShowPublicacoes(!showPublicacoes)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {showPublicacoes ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Publicacoes
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Buscar
              </button>
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors ml-auto"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Config Panel */}
            {isConfigOpen && orgId && (
              <DOUMonitorConfig
                casoId={caso.id}
                orgId={orgId}
                termos={termos}
                numeroProcesso={caso.numero_processo}
                onAddTermo={addTermo}
                onRemoveTermo={removeTermo}
                onToggleTermo={toggleTermo}
              />
            )}

            {/* Publicacoes List - collapsible */}
            {showPublicacoes && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {publicacoes.map((pub) => (
                  <PublicacaoItem
                    key={pub.id}
                    pub={pub}
                    onMarcarLida={marcarLida}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Newspaper className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Nenhuma publicacao encontrada</p>
            <p className="text-xs text-gray-400 mb-4">
              Busque no DOU ou configure termos de monitoramento
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#721011' }}
              >
                <Search className="w-4 h-4" />
                Buscar no DOU
              </button>
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                Monitorar
              </button>
            </div>
            {isConfigOpen && orgId && (
              <div className="mt-4 text-left">
                <DOUMonitorConfig
                  casoId={caso.id}
                  orgId={orgId}
                  termos={termos}
                  numeroProcesso={caso.numero_processo}
                  onAddTermo={addTermo}
                  onRemoveTermo={removeTermo}
                  onToggleTermo={toggleTermo}
                />
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && publicacoes.length === 0 && (
          <div className="space-y-2 mt-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        )}
      </div>

      {/* Search Modal */}
      <DOUSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        casoId={caso.id}
        numeroProcesso={caso.numero_processo}
      />
    </div>
  )
}
