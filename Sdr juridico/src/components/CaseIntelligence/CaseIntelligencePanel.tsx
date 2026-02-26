import { useState } from 'react'
import { Brain, AlertTriangle, TrendingUp, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { getInsight, DEFAULT_OPTIONS } from '@/services/caseIntelligenceService'
import { SourceStatusBar } from './SourceStatusBar'
import type { CaseInsight, CaseInsightOptions } from '@/types/caseIntelligence'

interface Props {
  cpf: string
  clienteId?: string
  /** Se true, exibe colapsado por padrão (para ClienteDrawer) */
  colapsado?: boolean
  onConfigureClick?: () => void
}

const RISCO_CONFIG = {
  baixo: { label: 'BAIXO',  color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  medio: { label: 'MÉDIO',  color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  alto:  { label: 'ALTO',   color: 'text-red-700',   bg: 'bg-red-50',   dot: 'bg-red-600'   },
}

function formatMoeda(valor: number | null): string {
  if (!valor) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
}

function formatPorcentagem(taxa: number): string {
  return `${Math.round(taxa * 100)}%`
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
          <div className="h-3 bg-gray-200 rounded w-3/5" />
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function CaseIntelligencePanel({ cpf, colapsado = false, onConfigureClick }: Props) {
  const [expandido, setExpandido] = useState(!colapsado)
  const [opts, setOpts] = useState<CaseInsightOptions>(DEFAULT_OPTIONS)
  const [estado, setEstado] = useState<'idle' | 'loading' | 'erro' | 'ok'>('idle')
  const [insight, setInsight] = useState<CaseInsight | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function analisar(forceRefresh = false) {
    setEstado('loading')
    setErro(null)
    try {
      const resultado = await getInsight(cpf, opts, forceRefresh)
      setInsight(resultado)
      setEstado('ok')
    } catch (err: any) {
      setErro(err?.message ?? 'Erro ao analisar')
      setEstado('erro')
    }
  }

  const riscoCfg = insight ? RISCO_CONFIG[insight.nivel_risco] : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 shrink-0" style={{ color: '#721011' }} />
          <span className="text-sm font-semibold text-gray-900">Inteligência Preditiva</span>
          {insight?.cached && (
            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">cache</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {estado === 'ok' && (
            <button
              onClick={(e) => { e.stopPropagation(); analisar(true) }}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Atualizar análise"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          {expandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-50">
          {/* Controles */}
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { key: 'useInternal',      label: 'Casos internos' },
                { key: 'useDataJud',       label: 'DataJud' },
                { key: 'useScraper',       label: 'Scraper local' },
                { key: 'useQueridoDiario', label: 'Diário Oficial' },
                { key: 'useTransparencia', label: 'Transparência' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opts[key as keyof CaseInsightOptions]}
                    onChange={(e) => setOpts(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-3 h-3 rounded accent-red-800"
                  />
                  <span className="text-gray-600">{label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => analisar()}
              disabled={estado === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: '#721011' }}
            >
              {estado === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analisando fontes públicas...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analisar com IA
                </>
              )}
            </button>
          </div>

          {/* Loading */}
          {estado === 'loading' && <SkeletonCard />}

          {/* Erro */}
          {estado === 'erro' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Erro na análise</p>
                <p className="text-xs mt-0.5">{erro}</p>
                <button
                  onClick={() => analisar()}
                  className="mt-2 text-xs underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Resultado */}
          {estado === 'ok' && insight && (
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <KpiCard
                  label="Processos"
                  value={String(insight.processos_datajud + insight.processos_scraper)}
                  sub={`DataJud ${insight.processos_datajud} · Scraper ${insight.processos_scraper}`}
                />
                <KpiCard
                  label="Valor médio"
                  value={formatMoeda(insight.valor_medio_causa)}
                />
                <KpiCard
                  label="Duração"
                  value={insight.duracao_media_meses ? `${insight.duracao_media_meses} meses` : '—'}
                />
                <KpiCard
                  label="Taxa sucesso"
                  value={formatPorcentagem(insight.taxa_sucesso_estimada)}
                />
              </div>

              {/* Risco + Área */}
              <div className="flex flex-wrap items-center gap-2">
                {riscoCfg && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${riscoCfg.bg} ${riscoCfg.color}`}>
                    <span className={`w-2 h-2 rounded-full ${riscoCfg.dot}`} />
                    Risco {riscoCfg.label}
                  </span>
                )}
                {insight.area_predominante && (
                  <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    {insight.area_predominante}
                  </span>
                )}
                {insight.tribunais_frequentes.slice(0, 2).map(t => (
                  <span key={t} className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    {t}
                  </span>
                ))}
              </div>

              {/* Narrativa */}
              {insight.narrativa && (
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{insight.narrativa}"
                </p>
              )}

              {/* Perfil Público */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 p-2 rounded-lg ${insight.has_sancao_ceis ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <span>{insight.has_sancao_ceis ? '⚠' : '✓'}</span>
                  {insight.has_sancao_ceis ? `${insight.sancoes.length} sanção CEIS` : 'Sem sanções CEIS'}
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded-lg ${insight.has_expulsao_ceaf ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <span>{insight.has_expulsao_ceaf ? '⚠' : '✓'}</span>
                  {insight.has_expulsao_ceaf ? 'Expulsão CEAF' : 'Sem expulsão CEAF'}
                </div>
                <div className={`flex items-center gap-1.5 p-2 rounded-lg ${insight.is_servidor_federal ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                  <span>{insight.is_servidor_federal ? 'ℹ' : '✓'}</span>
                  {insight.is_servidor_federal ? 'Servidor federal' : 'Não é servidor federal'}
                </div>
              </div>

              {/* Alertas */}
              {insight.alertas.length > 0 && (
                <div className="space-y-1">
                  {insight.alertas.map((alerta, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {alerta}
                    </div>
                  ))}
                </div>
              )}

              {/* Recomendação */}
              {insight.recomendacao && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg border-l-2" style={{ borderColor: '#721011', backgroundColor: '#72101108' }}>
                  <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#721011' }} />
                  <span className="text-gray-800">{insight.recomendacao}</span>
                </div>
              )}

              {/* Fontes */}
              <div className="pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-2">Fontes consultadas</p>
                <SourceStatusBar fontes={insight.fontes} onConfigureClick={onConfigureClick} />
                <p className="text-xs text-gray-400 mt-2">
                  Gerado {insight.cached ? 'do cache' : 'agora'} · {new Date(insight.generated_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
