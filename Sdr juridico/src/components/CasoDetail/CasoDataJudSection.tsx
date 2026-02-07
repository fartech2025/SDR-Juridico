// src/components/CasoDetail/CasoDataJudSection.tsx
import { useState } from 'react'
import { Scale, RefreshCw, Unlink, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { buscarProcessoPorNumero } from '@/services/datajudService'
import { CasoDataJudSearchModal } from './CasoDataJudSearchModal'
import type { Caso, DataJudProcesso, DataJudMovimento } from '@/types/domain'
import { toast } from 'sonner'

interface CasoDataJudSectionProps {
  caso: Caso
  clienteName: string
  orgId: string | null
  onProcessoLinked: (updatedCaso: Caso) => void
  onTimelineRefresh?: () => void
}

export function CasoDataJudSection({
  caso,
  clienteName,
  orgId,
  onProcessoLinked,
  onTimelineRefresh,
}: CasoDataJudSectionProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showMovimentos, setShowMovimentos] = useState(false)
  const [movimentos, setMovimentos] = useState<DataJudMovimento[]>([])
  const [movimentosLoading, setMovimentosLoading] = useState(false)

  const hasProcesso = !!caso.numero_processo

  /**
   * Persiste movimentos no banco (datajud_movimentacoes)
   * Usa upsert por processo_id + codigo + data_movimentacao para evitar duplicatas
   */
  const persistMovimentos = async (
    processoId: string,
    rawMovimentos: Array<{ codigo?: number; codigoNacional?: number; nome?: string; dataHora?: string; complemento?: string }>,
  ) => {
    if (!rawMovimentos.length) return

    const rows = rawMovimentos.map((mov) => ({
      datajud_processo_id: processoId,
      codigo: mov.codigo != null ? String(mov.codigo) : null,
      nome: mov.nome || 'Movimentacao',
      data_hora: mov.dataHora || new Date().toISOString(),
      complemento: mov.complemento || null,
      raw_response: mov as Record<string, unknown>,
    }))

    const { error } = await supabase
      .from('datajud_movimentacoes')
      .insert(rows)

    if (error) {
      console.error('Erro ao inserir movimentacoes:', error.message, error)
    }
  }

  const handleSelectProcesso = async (processo: DataJudProcesso) => {
    try {
      const now = new Date().toISOString()

      // 1. Inserir/atualizar na tabela datajud_processos
      let processoDbId: string | undefined

      if (orgId) {
        const rawResponse = processo.raw_response as Record<string, unknown> | undefined
        const movimentosRaw = (rawResponse?.movimentos ?? []) as Array<{
          codigo?: number; codigoNacional?: number; nome?: string; dataHora?: string; complemento?: string
        }>

        // Upsert pelo numero_processo (unique) — colunas alinhadas com schema do banco
        const { data: processoRow, error: processoError } = await supabase
          .from('datajud_processos')
          .upsert(
            {
              numero_processo: processo.numero_processo,
              tribunal: processo.tribunal,
              classe_processual: processo.classe_processual || null,
              grau: processo.grau || null,
              assunto: processo.assunto || null,
              cached_at: now,
              org_id: orgId,
              raw_response: rawResponse || null,
            },
            { onConflict: 'numero_processo' },
          )
          .select('id')
          .single()

        if (processoError) {
          console.error('Erro ao salvar processo no banco:', processoError)
          toast.error(`Erro ao salvar processo: ${processoError.message}`)
        } else {
          processoDbId = processoRow?.id
        }

        // 2. Inserir movimentacoes na tabela datajud_movimentacoes
        if (processoDbId && movimentosRaw.length > 0) {
          await persistMovimentos(processoDbId, movimentosRaw)
        }
      }

      // 3. Atualizar a tabela casos com os dados do processo
      const { error } = await supabase
        .from('casos')
        .update({
          numero_processo: processo.numero_processo,
          tribunal: processo.tribunal,
          grau: processo.grau,
          classe_processual: processo.classe_processual,
          assunto_principal: processo.assunto,
          datajud_processo_id: processoDbId || null,
          datajud_sync_status: 'sincronizado',
          datajud_last_sync_at: now,
        })
        .eq('id', caso.id)

      if (error) throw error

      const updatedCaso: Caso = {
        ...caso,
        numero_processo: processo.numero_processo,
        tribunal: processo.tribunal,
        grau: processo.grau,
        classe_processual: processo.classe_processual,
        assunto_principal: processo.assunto,
        datajud_processo_id: processoDbId,
        datajud_sync_status: 'sincronizado',
        datajud_last_sync_at: now,
      }

      onProcessoLinked(updatedCaso)
      onTimelineRefresh?.()
      toast.success(`Processo ${processo.numero_processo} vinculado com sucesso`)
    } catch (error) {
      console.error("Error linking processo:", error)
      toast.error("Erro ao vincular processo")
    }
  }

  const handleSyncMovimentos = async () => {
    if (!caso.numero_processo || !caso.tribunal) {
      toast.error("Nenhum processo vinculado")
      return
    }

    setIsSyncing(true)
    try {
      const result = await buscarProcessoPorNumero(caso.numero_processo, caso.tribunal)

      if (result.processos.length === 0) {
        toast.info("Nenhuma movimentacao encontrada no DataJud")
        return
      }

      const processo = result.processos[0]
      const rawMovs = processo.movimentos || []

      // Persistir movimentacoes no banco
      if (caso.datajud_processo_id) {
        await persistMovimentos(caso.datajud_processo_id, rawMovs)
        onTimelineRefresh?.()
      }

      const movs: DataJudMovimento[] = rawMovs.map((mov, idx) => ({
        id: `sync-${idx}`,
        datajud_processo_id: caso.datajud_processo_id || '',
        codigo: String(mov.codigo || ''),
        nome: mov.nome || '',
        data_hora: mov.dataHora || new Date().toISOString(),
        complemento: mov.complemento,
        detected_at: new Date().toISOString(),
        notified: false,
        created_at: new Date().toISOString(),
      }))

      setMovimentos(movs)
      setShowMovimentos(true)
      toast.success(`${movs.length} movimentacao(oes) encontrada(s)`)
    } catch (error) {
      console.error("Error syncing movimentos:", error)
      toast.error("Erro ao sincronizar movimentacoes")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleViewMovimentos = async () => {
    if (showMovimentos) {
      setShowMovimentos(false)
      return
    }
    if (movimentosLoading || !caso.numero_processo || !caso.tribunal) return

    setMovimentosLoading(true)
    try {
      const result = await buscarProcessoPorNumero(caso.numero_processo, caso.tribunal)

      if (result.processos.length === 0) {
        toast.info("Processo nao encontrado no DataJud")
        return
      }

      const processo = result.processos[0]
      const movs: DataJudMovimento[] = (processo.movimentos || []).map((mov, idx) => ({
        id: `mov-${idx}`,
        datajud_processo_id: caso.datajud_processo_id || '',
        codigo: String(mov.codigo || ''),
        nome: mov.nome || '',
        data_hora: mov.dataHora || new Date().toISOString(),
        complemento: mov.complemento,
        detected_at: new Date().toISOString(),
        notified: false,
        created_at: new Date().toISOString(),
      }))

      setMovimentos(movs)
      setShowMovimentos(true)
    } catch (error) {
      console.error("Error fetching movimentos:", error)
      toast.error("Erro ao buscar movimentacoes")
    } finally {
      setMovimentosLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!window.confirm('Desvincular processo judicial deste caso?')) return
    try {
      const { error } = await supabase
        .from('casos')
        .update({
          numero_processo: null,
          tribunal: null,
          grau: null,
          classe_processual: null,
          assunto_principal: null,
          datajud_processo_id: null,
          datajud_sync_status: 'nunca_sincronizado',
        })
        .eq('id', caso.id)

      if (error) throw error

      const updatedCaso: Caso = {
        ...caso,
        numero_processo: undefined,
        tribunal: undefined,
        grau: undefined,
        classe_processual: undefined,
        assunto_principal: undefined,
        datajud_processo_id: undefined,
        datajud_sync_status: "nunca_sincronizado",
      }
      onProcessoLinked(updatedCaso)
      onTimelineRefresh?.()
      toast.success("Processo desvinculado")
    } catch (error) {
      console.error("Error unlinking processo:", error)
      toast.error("Erro ao desvincular processo")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}
        >
          <Scale className="w-5 h-5" style={{ color: '#721011' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">Processo Judicial</h3>
          <p className="text-xs text-gray-500">DataJud - CNJ</p>
        </div>
        {hasProcesso && (
          <span className="inline-flex items-center rounded-full bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Vinculado
          </span>
        )}
      </div>

      <div className="p-5">
        {hasProcesso ? (
          <div className="space-y-4">
            {/* Process Info - compact */}
            <div className="rounded-xl bg-gray-50/80 border border-gray-200/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold" style={{ color: '#721011' }}>
                    {caso.numero_processo}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {caso.tribunal && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: '#721011' }}>
                        {caso.tribunal.toUpperCase()}
                      </span>
                    )}
                    {caso.grau && (
                      <span className="text-xs text-gray-500">{caso.grau}</span>
                    )}
                    {caso.classe_processual && (
                      <span className="text-xs text-gray-500">{caso.classe_processual}</span>
                    )}
                  </div>
                  {caso.assunto_principal && (
                    <p className="text-xs text-gray-600 mt-2">{caso.assunto_principal}</p>
                  )}
                </div>
              </div>

              {caso.datajud_last_sync_at && (
                <p className="text-[10px] text-gray-400 mt-3">
                  Sincronizado em {new Date(caso.datajud_last_sync_at).toLocaleString("pt-BR")}
                </p>
              )}

              {caso.datajud_sync_error && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
                  <p className="text-[10px] text-red-600">{caso.datajud_sync_error}</p>
                </div>
              )}
            </div>

            {/* Action Buttons - compact inline */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncMovimentos}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#721011' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={handleViewMovimentos}
                disabled={movimentosLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {showMovimentos ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {movimentosLoading ? 'Carregando...' : 'Movimentacoes'}
              </button>
              <button
                onClick={handleUnlink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors ml-auto"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desvincular
              </button>
            </div>

            {/* Movimentos - collapsible */}
            {showMovimentos && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Movimentacoes recentes
                </h4>
                {movimentos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Nenhuma movimentacao encontrada
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg">
                    {movimentos.map((movimento, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 bg-gray-50 rounded-r-lg px-3 py-2"
                        style={{ borderLeftColor: '#721011' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-gray-800">
                            {movimento.nome}
                          </p>
                          <p className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {new Date(movimento.data_hora).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        {movimento.complemento && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {movimento.complemento}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Scale className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Nenhum processo vinculado</p>
            <p className="text-xs text-gray-400 mb-4">
              Vincule um processo para sincronizar dados do DataJud
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#721011' }}
            >
              <Link2 className="w-4 h-4" />
              Vincular Processo
            </button>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <CasoDataJudSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProcesso={handleSelectProcesso}
        clienteName={clienteName}
        clienteId={caso.cliente}
      />
    </div>
  )
}
