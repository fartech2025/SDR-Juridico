// src/features/dou/components/DOUSearchModal.tsx
import { useState } from 'react'
import { Newspaper, Search, X, ExternalLink } from 'lucide-react'
import { useDOU } from '../hooks/useDOU'

interface DOUSearchModalProps {
  isOpen: boolean
  onClose: () => void
  casoId?: string
  numeroProcesso?: string
}

interface SearchResult {
  title?: string
  titulo?: string
  content?: string
  conteudo?: string
  pubDate?: string
  data_publicacao?: string
  artType?: string
  tipo_publicacao?: string
  artCategory?: string
  orgao_publicador?: string
  numberPage?: string
  pagina?: string
  urlTitle?: string
  url_publicacao?: string
}

function formatDateBR(dateStr: string | undefined) {
  if (!dateStr) return '-'
  try {
    if (dateStr.includes('/')) return dateStr
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '')
}

export function DOUSearchModal({
  isOpen,
  onClose,
  casoId,
  numeroProcesso,
}: DOUSearchModalProps) {
  const [termo, setTermo] = useState(numeroProcesso || '')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [source, setSource] = useState('')
  const [latency, setLatency] = useState(0)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const { searchDOU, searchLoading, error } = useDOU(casoId)

  const handleSearch = async () => {
    if (!termo.trim()) return

    try {
      const result = await searchDOU({
        termo: termo.trim(),
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      })

      setResults((result.publicacoes as SearchResult[]) || [])
      setSource(result.source || '')
      setLatency(result.latency_ms || 0)
    } catch {
      // error is set by useDOU
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
              >
                <Newspaper className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Buscar no DOU</h2>
                <p className="text-xs text-gray-500">Diario Oficial da Uniao</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="px-6 py-5 border-b border-gray-100 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="dou-search-termo" className="text-xs uppercase tracking-wide text-gray-500">
              Termo de busca
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="dou-search-termo"
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Numero do processo, nome, OAB..."
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="dou-search-data-inicio" className="text-xs uppercase tracking-wide text-gray-500">
                Data inicio
              </label>
              <input
                id="dou-search-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dou-search-data-fim" className="text-xs uppercase tracking-wide text-gray-500">
                Data fim
              </label>
              <input
                id="dou-search-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading || !termo.trim()}
              className="flex-1 h-10 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#721011' }}
            >
              {searchLoading ? 'Buscando...' : 'Buscar no DOU'}
            </button>
            {latency > 0 && (
              <span className="text-[10px] text-gray-400 shrink-0">
                {latency}ms ({source})
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((item, idx) => {
                const title = item.title || item.titulo || 'Sem titulo'
                const date = item.pubDate || item.data_publicacao
                const tipo = item.artType || item.tipo_publicacao || ''
                const orgao = item.artCategory || item.orgao_publicador || ''
                const content = item.content || item.conteudo || ''
                const page = item.numberPage || item.pagina || ''
                const urlTitle = item.urlTitle
                const url = item.url_publicacao || (urlTitle ? `https://www.in.gov.br/en/web/dou/-/${urlTitle}` : '')
                const isExpanded = expandedIdx === idx

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {tipo && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                              {tipo}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500">
                            {formatDateBR(date)}
                          </span>
                          {page && (
                            <span className="text-[10px] text-gray-400">
                              Pag. {page}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        {orgao && (
                          <p className="text-xs text-gray-500 mt-0.5">{orgao}</p>
                        )}
                        {content && (
                          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                            {isExpanded
                              ? stripHtml(content)
                              : stripHtml(content).slice(0, 200) + (content.length > 200 ? '...' : '')}
                          </p>
                        )}
                        {content && content.length > 200 && (
                          <button
                            type="button"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                            className="text-xs hover:underline mt-1"
                            style={{ color: '#721011' }}
                          >
                            {isExpanded ? 'Ver menos' : 'Ver mais'}
                          </button>
                        )}
                      </div>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : results.length === 0 && !searchLoading && latency > 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Newspaper className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma publicacao encontrada.</p>
            </div>
          ) : !searchLoading && latency === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Preencha o termo e clique em buscar
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
