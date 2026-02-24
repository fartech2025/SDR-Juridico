// src/components/CasoDetail/CasoDataJudSearchModal.tsx
import { useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Search, Scale, AlertCircle } from 'lucide-react'
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
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface CasoDataJudSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProcesso: (processo: DataJudProcesso) => void
  clienteName: string
  clienteId?: string
}

type TipoBusca = 'numero' | 'parte' | 'classe'

const tribunais = [
  { id: 'stj',   nome: 'STJ - Superior Tribunal de Justica' },
  { id: 'tst',   nome: 'TST - Tribunal Superior do Trabalho' },
  { id: 'tse',   nome: 'TSE - Tribunal Superior Eleitoral' },
  { id: 'stm',   nome: 'STM - Superior Tribunal Militar' },
  { id: 'trf1',  nome: 'TRF1 - Tribunal Regional Federal 1a Regiao' },
  { id: 'trf2',  nome: 'TRF2 - Tribunal Regional Federal 2a Regiao' },
  { id: 'trf3',  nome: 'TRF3 - Tribunal Regional Federal 3a Regiao' },
  { id: 'trf4',  nome: 'TRF4 - Tribunal Regional Federal 4a Regiao' },
  { id: 'trf5',  nome: 'TRF5 - Tribunal Regional Federal 5a Regiao' },
  { id: 'trf6',  nome: 'TRF6 - Tribunal Regional Federal 6a Regiao' },
  { id: 'trt1',  nome: 'TRT1 - TRT 1a Regiao (RJ)' },
  { id: 'trt2',  nome: 'TRT2 - TRT 2a Regiao (SP)' },
  { id: 'trt3',  nome: 'TRT3 - TRT 3a Regiao (MG)' },
  { id: 'trt4',  nome: 'TRT4 - TRT 4a Regiao (RS)' },
  { id: 'trt5',  nome: 'TRT5 - TRT 5a Regiao (BA)' },
  { id: 'trt15', nome: 'TRT15 - TRT 15a Regiao (Campinas-SP)' },
  { id: 'tjsp',  nome: 'TJSP - Tribunal de Justica de Sao Paulo' },
  { id: 'tjrj',  nome: 'TJRJ - Tribunal de Justica do Rio de Janeiro' },
  { id: 'tjmg',  nome: 'TJMG - Tribunal de Justica de Minas Gerais' },
  { id: 'tjrs',  nome: 'TJRS - Tribunal de Justica do Rio Grande do Sul' },
  { id: 'tjpr',  nome: 'TJPR - Tribunal de Justica do Parana' },
  { id: 'tjsc',  nome: 'TJSC - Tribunal de Justica de Santa Catarina' },
  { id: 'tjba',  nome: 'TJBA - Tribunal de Justica da Bahia' },
  { id: 'tjdft', nome: 'TJDFT - Tribunal de Justica do DF' },
  { id: 'tjgo',  nome: 'TJGO - Tribunal de Justica de Goias' },
  { id: 'tjce',  nome: 'TJCE - Tribunal de Justica do Ceara' },
  { id: 'tjpe',  nome: 'TJPE - Tribunal de Justica de Pernambuco' },
  { id: 'tjpa',  nome: 'TJPA - Tribunal de Justica do Para' },
  { id: 'tjes',  nome: 'TJES - Tribunal de Justica do Espirito Santo' },
  { id: 'tjma',  nome: 'TJMA - Tribunal de Justica do Maranhao' },
  { id: 'tjam',  nome: 'TJAM - Tribunal de Justica do Amazonas' },
]

function convertToDataJudProcesso(processo: ProcessoDataJud, tribunalId: string): DataJudProcesso {
  const info = extrairInfoProcesso(processo)
  return {
    id:               processo.id || '',
    numero_processo:  info.numero,
    tribunal:         tribunalId,
    grau:             processo.grau,
    classe_processual: typeof processo.classe === 'string' ? processo.classe : processo.classe?.nome,
    assunto:          info.assuntos.join(', ') || undefined,
    dataAjuizamento:  processo.dataAjuizamento,
    dataAtualizacao:  processo.dataAtualizacao || processo.dataHoraUltimaAtualizacao,
    raw_response:     processo as unknown as Record<string, unknown>,
    cached_at:        new Date().toISOString(),
    org_id:           '',
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }
}

const RING_STYLE = { '--tw-ring-color': 'rgba(114, 16, 17, 0.2)' } as CSSProperties

export function CasoDataJudSearchModal({
  isOpen,
  onClose,
  onSelectProcesso,
  clienteName,
}: CasoDataJudSearchModalProps) {
  const [searchTerm, setSearchTerm]   = useState(clienteName || '')
  const [tribunal, setTribunal]       = useState('tjsp')
  const [tipoBusca, setTipoBusca]     = useState<TipoBusca>('numero')
  const [processos, setProcessos]     = useState<{ processo: ProcessoDataJud; tribunalId: string }[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [latency, setLatency]         = useState<number | null>(null)

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
        toast.info('Detectando tribunal automaticamente...')
        const result = await buscarProcessoAutomatico(searchTerm)
        if (result.sucesso && result.processo) {
          setProcessos([{ processo: result.processo, tribunalId: result.tribunal || tribunal }])
          toast.success(`Processo encontrado no ${result.tribunal?.toUpperCase()}`)
        } else {
          setError(result.erro || 'Processo não encontrado')
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar processos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (processo: ProcessoDataJud, tribunalId: string) => {
    onSelectProcesso(convertToDataJudProcesso(processo, tribunalId))
    onClose()
  }

  const showTribunalSelect = tipoBusca !== 'numero'

  const tipos: { id: TipoBusca; label: string }[] = [
    { id: 'numero', label: 'Por Número' },
    { id: 'parte',  label: 'Por Nome/Parte' },
    { id: 'classe', label: 'Por Classe' },
  ]

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Buscar Processo"
      description="DataJud — CNJ"
      maxWidth="42rem"
      footer={
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      }
    >
      <div className="space-y-4">
        {/* Tipo de busca */}
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Tipo de busca</p>
          <div className="flex gap-2">
            {tipos.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => {
                  setTipoBusca(tipo.id)
                  setProcessos([])
                  setError(null)
                  setLatency(null)
                }}
                className="flex-1 h-9 rounded-xl text-xs font-medium transition-colors border"
                style={
                  tipoBusca === tipo.id
                    ? { backgroundColor: 'rgba(114, 16, 17, 0.08)', borderColor: 'rgba(114, 16, 17, 0.3)', color: '#721011' }
                    : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tribunal */}
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
              style={RING_STYLE}
            >
              {tribunais.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Termo de busca */}
        <div className="space-y-1.5">
          <label htmlFor="datajud-search-term" className="text-xs uppercase tracking-wide text-gray-500">
            {tipoBusca === 'numero' ? 'Número do processo' : tipoBusca === 'parte' ? 'Nome da parte' : 'Classe processual'}
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
                  : 'Ex: Ação Civil Pública'
              }
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={RING_STYLE}
            />
          </div>
        </div>

        {/* Tribunal detectado automaticamente */}
        {tipoBusca === 'numero' && searchTerm.replace(/\D/g, '').length >= 16 && (
          <div
            className="rounded-xl p-3 border text-xs"
            style={
              tribunalDetectado.tribunal
                ? { backgroundColor: 'rgba(114, 16, 17, 0.04)', borderColor: 'rgba(114, 16, 17, 0.15)' }
                : { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }
            }
          >
            {tribunalDetectado.tribunal ? (
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 shrink-0" style={{ color: '#721011' }} />
                <div>
                  <p className="text-[10px] text-gray-500">Tribunal detectado automaticamente</p>
                  <p className="font-semibold" style={{ color: '#721011' }}>{tribunalDetectado.nomeCompleto}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>Não foi possível detectar o tribunal. Verifique o formato do número.</p>
              </div>
            )}
          </div>
        )}

        {/* Botão buscar */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 bg-brand-primary! hover:bg-brand-primary/90! text-white!"
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
          >
            {loading ? 'Buscando...' : 'Buscar no DataJud'}
          </Button>
          {latency != null && latency > 0 && (
            <span className="text-[10px] text-gray-400 shrink-0">{latency}ms</span>
          )}
        </div>

        {/* Erro */}
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        )}

        {/* Resultados */}
        {!loading && processos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {processos.length} resultado{processos.length !== 1 ? 's' : ''} encontrado{processos.length !== 1 ? 's' : ''}
            </p>
            <div className="overflow-auto rounded-xl border border-gray-100 max-h-72">
              {processos.map(({ processo, tribunalId }, idx) => {
                const info = extrairInfoProcesso(processo)
                return (
                  <div
                    key={info.numero || idx}
                    onClick={() => handleSelect(processo, tribunalId)}
                    className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold" style={{ color: '#721011' }}>
                          {formatarNumeroProcesso(info.numero)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: '#721011' }}
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
                        <p className="text-[10px] font-medium mt-1" style={{ color: '#721011' }}>
                          Vincular →
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!loading && processos.length === 0 && !error && latency == null && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Preencha os campos e clique em buscar</p>
              <p className="text-xs text-gray-400 mt-1">
                {tipoBusca === 'numero'
                  ? 'O tribunal será detectado automaticamente pelo número'
                  : 'Selecione o tribunal e digite o termo de busca'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
