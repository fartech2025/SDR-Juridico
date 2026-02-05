// src/components/CasoDetail/DOUSearchModal.tsx
import { useState } from 'react'
import { useDOU } from '@/hooks/useDOU'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Buscar no Diario Oficial da Uniao</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Search Form */}
        <div className="mb-4 space-y-3">
          <div>
            <label htmlFor="dou-search-termo" className="block text-sm font-medium text-gray-700">
              Termo de busca
            </label>
            <input
              id="dou-search-termo"
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Numero do processo, nome, OAB..."
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dou-search-data-inicio" className="block text-sm font-medium text-gray-700">
                Data inicio
              </label>
              <input
                id="dou-search-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dou-search-data-fim" className="block text-sm font-medium text-gray-700">
                Data fim
              </label>
              <input
                id="dou-search-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={searchLoading || !termo.trim()}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:bg-gray-400"
          >
            {searchLoading ? 'Buscando...' : 'Buscar'}
          </button>

          {latency > 0 && (
            <p className="text-xs text-gray-500">
              Busca realizada em {latency}ms (fonte: {source})
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {searchLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => {
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
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {tipo && (
                          <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                            {tipo}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDateBR(date)}
                        </span>
                        {page && (
                          <span className="text-xs text-gray-400">
                            Pag. {page}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      {orgao && (
                        <p className="text-xs text-gray-500">{orgao}</p>
                      )}
                      {content && (
                        <p className="text-xs text-gray-600 mt-1">
                          {isExpanded
                            ? stripHtml(content)
                            : stripHtml(content).slice(0, 200) + (content.length > 200 ? '...' : '')}
                        </p>
                      )}
                      {content && content.length > 200 && (
                        <button
                          type="button"
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                          className="text-xs text-blue-600 hover:underline mt-1"
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
                        className="shrink-0 rounded bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-200"
                      >
                        Abrir
                      </a>
                    )}
                  </div>
                </div>
              )
            })
          ) : results.length === 0 && !searchLoading && latency > 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Nenhuma publicacao encontrada.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
