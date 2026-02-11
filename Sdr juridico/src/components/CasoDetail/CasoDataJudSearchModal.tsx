// src/components/CasoDetail/CasoDataJudSearchModal.tsx
import { useState, useMemo } from 'react'
import { Search, X, Scale, AlertCircle } from 'lucide-react'
import {
  buscarProcessoAutomatico,
  buscarProcessosPorParte,
  buscarProcessosPorClasse,
  detectarTribunalPorNumero,
  formatarNumeroProcesso,
  extrairInfoProcesso,
  type ProcessoDataJud,
} from '@/services/datajudService'
import type { DataJudProcesso } from '@/types/domain'
import { toast } from 'sonner'

interface CasoDataJudSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProcesso: (processo: DataJudProcesso) => void
  clienteName: string
  clienteId?: string
}

type TipoBusca = 'numero' | 'parte' | 'classe'

const tribunais = [
  { id: 'stj', nome: 'STJ - Superior Tribunal de Justica' },
  { id: 'tst', nome: 'TST - Tribunal Superior do Trabalho' },
  { id: 'tse', nome: 'TSE - Tribunal Superior Eleitoral' },
  { id: 'stm', nome: 'STM - Superior Tribunal Militar' },
  { id: 'trf1', nome: 'TRF1 - Tribunal Regional Federal 1a Regiao' },
  { id: 'trf2', nome: 'TRF2 - Tribunal Regional Federal 2a Regiao' },
  { id: 'trf3', nome: 'TRF3 - Tribunal Regional Federal 3a Regiao' },
  { id: 'trf4', nome: 'TRF4 - Tribunal Regional Federal 4a Regiao' },
  { id: 'trf5', nome: 'TRF5 - Tribunal Regional Federal 5a Regiao' },
  { id: 'trf6', nome: 'TRF6 - Tribunal Regional Federal 6a Regiao' },
  { id: 'trt1', nome: 'TRT1 - TRT 1a Regiao (RJ)' },
  { id: 'trt2', nome: 'TRT2 - TRT 2a Regiao (SP)' },
  { id: 'trt3', nome: 'TRT3 - TRT 3a Regiao (MG)' },
  { id: 'trt4', nome: 'TRT4 - TRT 4a Regiao (RS)' },
  { id: 'trt5', nome: 'TRT5 - TRT 5a Regiao (BA)' },
  { id: 'trt15', nome: 'TRT15 - TRT 15a Regiao (Campinas-SP)' },
  { id: 'tjsp', nome: 'TJSP - Tribunal de Justica de Sao Paulo' },
  { id: 'tjrj', nome: 'TJRJ - Tribunal de Justica do Rio de Janeiro' },
  { id: 'tjmg', nome: 'TJMG - Tribunal de Justica de Minas Gerais' },
  { id: 'tjrs', nome: 'TJRS - Tribunal de Justica do Rio Grande do Sul' },
  { id: 'tjpr', nome: 'TJPR - Tribunal de Justica do Parana' },
  { id: 'tjsc', nome: 'TJSC - Tribunal de Justica de Santa Catarina' },
  { id: 'tjba', nome: 'TJBA - Tribunal de Justica da Bahia' },
  { id: 'tjdft', nome: 'TJDFT - Tribunal de Justica do DF' },
  { id: 'tjgo', nome: 'TJGO - Tribunal de Justica de Goias' },
  { id: 'tjce', nome: 'TJCE - Tribunal de Justica do Ceara' },
  { id: 'tjpe', nome: 'TJPE - Tribunal de Justica de Pernambuco' },
  { id: 'tjpa', nome: 'TJPA - Tribunal de Justica do Para' },
  { id: 'tjes', nome: 'TJES - Tribunal de Justica do Espirito Santo' },
  { id: 'tjma', nome: 'TJMA - Tribunal de Justica do Maranhao' },
  { id: 'tjam', nome: 'TJAM - Tribunal de Justica do Amazonas' },
]

function convertToDataJudProcesso(processo: ProcessoDataJud, tribunalId: string): DataJudProcesso {
  const info = extrairInfoProcesso(processo)
  return {
    id: processo.id || '',
    numero_processo: info.numero,
    tribunal: tribunalId,
    grau: processo.grau,
    classe_processual: typeof processo.classe === 'string' ? processo.classe : processo.classe?.nome,
    assunto: info.assuntos.join(', ') || undefined,
    dataAjuizamento: processo.dataAjuizamento,
    dataAtualizacao: processo.dataAtualizacao || processo.dataHoraUltimaAtualizacao,
    raw_response: processo as unknown as Record<string, unknown>,
    cached_at: new Date().toISOString(),
    org_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function CasoDataJudSearchModal({
  isOpen,
  onClose,
  onSelectProcesso,
  clienteName,
}: CasoDataJudSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(clienteName || '')
  const [tribunal, setTribunal] = useState('tjsp')
  const [tipoBusca, setTipoBusca] = useState<TipoBusca>('numero')
  const [processos, setProcessos] = useState<{ processo: ProcessoDataJud; tribunalId: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  // Auto-detect tribunal from process number
  const tribunalDetectado = useMemo(() => {
    if (tipoBusca === 'numero' && searchTerm.replace(/\D/g, '').length >= 16) {
      return detectarTribunalPorNumero(searchTerm)
    }
    return { tribunal: null, nomeCompleto: null, segmento: null }
  }, [searchTerm, tipoBusca])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um termo de busca')
      return
    }

    setLoading(true)
    setError(null)
    setProcessos([])
    const start = Date.now()

    try {
      if (tipoBusca === 'numero') {
        // Auto-detect tribunal and search (same logic as DataJudPage)
        toast.info('Detectando tribunal automaticamente...')
        const result = await buscarProcessoAutomatico(searchTerm)

        if (result.sucesso && result.processo) {
          setProcessos([{ processo: result.processo, tribunalId: result.tribunal || tribunal }])
          toast.success(`Processo encontrado no ${result.tribunal?.toUpperCase()}`)
        } else {
          setError(result.erro || 'Processo nao encontrado')
        }
      } else if (tipoBusca === 'parte') {
        const result = await buscarProcessosPorParte(searchTerm, tribunal, 20)
        setProcessos(result.processos.map(p => ({ processo: p, tribunalId: tribunal })))
        if (result.total === 0) setError('Nenhum processo encontrado')
        else toast.success(`${result.total} processo(s) encontrado(s)`)
      } else if (tipoBusca === 'classe') {
        const result = await buscarProcessosPorClasse(searchTerm, tribunal, 20)
        setProcessos(result.processos.map(p => ({ processo: p, tribunalId: tribunal })))
        if (result.total === 0) setError('Nenhum processo encontrado')
        else toast.success(`${result.total} processo(s) encontrado(s)`)
      }

      setLatency(Date.now() - start)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar processos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (processo: ProcessoDataJud, tribunalId: string) => {
    onSelectProcesso(convertToDataJudProcesso(processo, tribunalId))
    onClose()
  }

  if (!isOpen) return null

  const showTribunalSelect = tipoBusca !== 'numero'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}
              >
                <Scale className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Buscar Processos</h2>
                <p className="text-xs text-gray-500">DataJud - CNJ</p>
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
          {/* Search Type Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Tipo de Busca
            </label>
            <div className="flex gap-2">
              {([
                { id: 'numero' as TipoBusca, label: 'Por Numero' },
                { id: 'parte' as TipoBusca, label: 'Por Nome/Parte' },
                { id: 'classe' as TipoBusca, label: 'Por Classe' },
              ]).map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => {
                    setTipoBusca(tipo.id)
                    setProcessos([])
                    setError(null)
                    setLatency(null)
                  }}
                  className="flex-1 h-9 rounded-lg text-xs font-medium transition-colors border"
                  style={
                    tipoBusca === tipo.id
                      ? { backgroundColor: 'rgba(114, 16, 17, 0.08)', borderColor: 'rgba(114, 16, 17, 0.3)', color: 'var(--brand-primary)' }
                      : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tribunal (hidden for numero since auto-detected) */}
          {showTribunalSelect && (
            <div className="space-y-1.5">
              <label htmlFor="datajud-tribunal" className="text-xs uppercase tracking-wide text-gray-500">
                Tribunal
              </label>
              <select
                id="datajud-tribunal"
                value={tribunal}
                onChange={(e) => setTribunal(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              >
                {tribunais.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Term */}
          <div className="space-y-1.5">
            <label htmlFor="datajud-search-term" className="text-xs uppercase tracking-wide text-gray-500">
              {tipoBusca === 'numero' ? 'Numero do Processo' : tipoBusca === 'parte' ? 'Nome da Parte' : 'Classe Processual'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="datajud-search-term"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={
                  tipoBusca === 'numero'
                    ? '0000000-00.0000.0.00.0000'
                    : tipoBusca === 'parte'
                    ? 'Nome completo ou parcial da parte...'
                    : 'Ex: Acao Civil Publica'
                }
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Auto-detected tribunal for numero */}
          {tipoBusca === 'numero' && searchTerm.replace(/\D/g, '').length >= 16 && (
            <div
              className="rounded-lg p-3 border"
              style={
                tribunalDetectado.tribunal
                  ? { backgroundColor: 'rgba(114, 16, 17, 0.04)', borderColor: 'rgba(114, 16, 17, 0.15)' }
                  : { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }
              }
            >
              {tribunalDetectado.tribunal ? (
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-primary)' }} />
                  <div>
                    <p className="text-[10px] text-gray-500">Tribunal detectado automaticamente</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                      {tribunalDetectado.nomeCompleto}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-xs">
                    Nao foi possivel detectar o tribunal. Verifique o formato do numero.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="flex-1 h-10 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {loading ? 'Buscando...' : 'Buscar no DataJud'}
            </button>
            {latency != null && latency > 0 && (
              <span className="text-[10px] text-gray-400 shrink-0">
                {latency}ms
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}

          {!loading && processos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                {processos.length} resultado{processos.length !== 1 ? 's' : ''} encontrado{processos.length !== 1 ? 's' : ''}
              </p>
              {processos.map(({ processo, tribunalId }, idx) => {
                const info = extrairInfoProcesso(processo)
                return (
                  <div
                    key={info.numero || idx}
                    className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-all"
                    onClick={() => handleSelect(processo, tribunalId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>
                          {formatarNumeroProcesso(info.numero)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: 'var(--brand-primary)' }}
                          >
                            {(info.tribunal || tribunalId).toUpperCase()}
                          </span>
                          {info.classe && (
                            <span className="text-xs text-gray-500">{info.classe}</span>
                          )}
                        </div>
                        {info.assuntos.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1.5">{info.assuntos.join(', ')}</p>
                        )}
                        {info.orgaoJulgador && (
                          <p className="text-[10px] text-gray-400 mt-1">{info.orgaoJulgador}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {info.dataAjuizamento && info.dataAjuizamento !== '-' && (
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {info.dataAjuizamento}
                          </span>
                        )}
                        <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--brand-primary)' }}>
                          Vincular
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && processos.length === 0 && !error && latency == null && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Preencha os campos e clique em buscar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tipoBusca === 'numero'
                  ? 'O tribunal sera detectado automaticamente pelo numero'
                  : 'Selecione o tribunal e digite o termo de busca'}
              </p>
            </div>
          )}
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
