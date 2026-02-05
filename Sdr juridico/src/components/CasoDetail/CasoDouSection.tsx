// src/components/CasoDetail/CasoDouSection.tsx
import { useState } from 'react'
import { useDOU } from '@/hooks/useDOU'
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
  intimacao: 'border-red-500',
  citacao: 'border-orange-500',
  edital: 'border-yellow-500',
  despacho: 'border-blue-500',
  sentenca: 'border-purple-500',
  outro: 'border-gray-400',
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
  const borderColor = tipoBorderColors[tipo] || 'border-gray-400'

  return (
    <div
      className={`border-l-4 ${borderColor} rounded-lg bg-gray-50 p-4 ${!pub.lida ? 'ring-1 ring-amber-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
              {tipoLabels[tipo] || tipo}
            </span>
            <span className="text-xs text-gray-500">
              {formatDateBR(pub.data_publicacao)}
            </span>
            {!pub.lida && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Nova
              </span>
            )}
          </div>
          <p className="font-medium text-sm text-gray-900">
            {pub.titulo}
          </p>
          {pub.orgao_publicador && (
            <p className="text-xs text-gray-500 mt-0.5">
              {pub.orgao_publicador}
            </p>
          )}
          {pub.conteudo && (
            <p className="text-xs text-gray-600 mt-1">
              {expanded
                ? pub.conteudo
                : truncate(pub.conteudo.replace(/<[^>]+>/g, ''), 200)}
            </p>
          )}
          {pub.conteudo && pub.conteudo.length > 200 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
          {pub.termo_encontrado && (
            <p className="text-[10px] text-gray-400 mt-1">
              Termo: {pub.termo_encontrado} (score: {pub.relevancia?.toFixed(1)})
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!pub.lida && (
            <button
              type="button"
              onClick={() => onMarcarLida(pub.id)}
              className="rounded bg-gray-200 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-300"
            >
              Marcar lida
            </button>
          )}
          {pub.url_publicacao && (
            <a
              href={pub.url_publicacao}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-200 text-center"
            >
              Ver no DOU
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
  const [collapsed, setCollapsed] = useState(false)

  const {
    publicacoes,
    termos,
    loading,
    error,
    naoLidas,
    marcarLida,
    addTermo,
    removeTermo,
    toggleTermo,
    refresh,
  } = useDOU(caso.id)

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div
        className="mb-4 flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Diario Oficial da Uniao</h3>
          {naoLidas > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">
          {collapsed ? '+' : '-'}
        </span>
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Buscar no DOU
            </button>
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Configurar monitoramento
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-400"
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Monitor Config (collapsible) */}
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

          {/* Publicacoes List */}
          {loading && publicacoes.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : publicacoes.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {publicacoes.map((pub) => (
                <PublicacaoItem
                  key={pub.id}
                  pub={pub}
                  onMarcarLida={marcarLida}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                Nenhuma publicacao encontrada para este caso.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Use "Buscar no DOU" para pesquisar ou configure termos de monitoramento.
              </p>
            </div>
          )}
        </div>
      )}

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
