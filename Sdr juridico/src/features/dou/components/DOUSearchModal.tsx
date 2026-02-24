// src/features/dou/components/DOUSearchModal.tsx
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Newspaper, Search, AlertCircle, ExternalLink } from 'lucide-react'
import { useDOU } from '../hooks/useDOU'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

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

const RING_STYLE = { '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as CSSProperties

export function DOUSearchModal({
  isOpen,
  onClose,
  casoId,
  numeroProcesso,
}: DOUSearchModalProps) {
  const [termo, setTermo]           = useState(numeroProcesso || '')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [results, setResults]       = useState<SearchResult[]>([])
  const [source, setSource]         = useState('')
  const [latency, setLatency]       = useState(0)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const { searchDOU, searchLoading, error } = useDOU(casoId)

  const handleSearch = async () => {
    if (!termo.trim()) return
    try {
      const result = await searchDOU({
        termo:      termo.trim(),
        dataInicio: dataInicio || undefined,
        dataFim:    dataFim    || undefined,
      })
      setResults((result.publicacoes as SearchResult[]) || [])
      setSource(result.source || '')
      setLatency(result.latency_ms || 0)
    } catch {
      // error is set by useDOU
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Buscar no DOU"
      description="Diário Oficial da União"
      maxWidth="42rem"
      footer={
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      }
    >
      <div className="space-y-4">
        {/* Termo de busca */}
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
              placeholder="Número do processo, nome, OAB..."
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={RING_STYLE}
            />
          </div>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="dou-data-inicio" className="text-xs uppercase tracking-wide text-gray-500">
              Data início
            </label>
            <input
              id="dou-data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={RING_STYLE}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dou-data-fim" className="text-xs uppercase tracking-wide text-gray-500">
              Data fim
            </label>
            <input
              id="dou-data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={RING_STYLE}
            />
          </div>
        </div>

        {/* Botão buscar */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            onClick={handleSearch}
            disabled={searchLoading || !termo.trim()}
          >
            {searchLoading ? 'Buscando...' : 'Buscar no DOU'}
          </Button>
          {latency > 0 && (
            <span className="text-[10px] text-gray-400 shrink-0">{latency}ms {source && `(${source})`}</span>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Skeleton loading */}
        {searchLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        )}

        {/* Resultados */}
        {!searchLoading && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            <div className="overflow-auto rounded-xl border border-gray-100 max-h-72">
              {results.map((item, idx) => {
                const title    = item.title || item.titulo || 'Sem título'
                const date     = item.pubDate || item.data_publicacao
                const tipo     = item.artType || item.tipo_publicacao || ''
                const orgao    = item.artCategory || item.orgao_publicador || ''
                const content  = item.content || item.conteudo || ''
                const page     = item.numberPage || item.pagina || ''
                const urlTitle = item.urlTitle
                const url      = item.url_publicacao || (urlTitle ? `https://www.in.gov.br/en/web/dou/-/${urlTitle}` : '')
                const isExpanded = expandedIdx === idx

                return (
                  <div
                    key={idx}
                    className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {tipo && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                              {tipo}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500">{formatDateBR(date)}</span>
                          {page && (
                            <span className="text-[10px] text-gray-400">Pág. {page}</span>
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
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
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
          </div>
        )}

        {/* Sem resultados */}
        {!searchLoading && results.length === 0 && latency > 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Nenhuma publicação encontrada.</p>
          </div>
        )}

        {/* Estado inicial */}
        {!searchLoading && latency === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Preencha o termo e clique em buscar</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
