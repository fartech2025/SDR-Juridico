// src/components/CasoDetail/CasoDataJudSection.tsx
import { useState } from 'react'
import { datajudCaseService } from '@/services/datajudCaseService'
import { CasoDataJudSearchModal } from './CasoDataJudSearchModal'
import type { Caso, DataJudProcesso } from '@/types/domain'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface CasoDataJudSectionProps {
  caso: Caso
  clienteName: string
  onProcessoLinked: (updatedCaso: Caso) => void
}

export function CasoDataJudSection({
  caso,
  clienteName,
  onProcessoLinked,
}: CasoDataJudSectionProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showMovimentos, setShowMovimentos] = useState(false)
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [movimentosLoading, setMovimentosLoading] = useState(false)

  const hasProcesso = !!caso.numero_processo

  const handleSelectProcesso = async (processo: DataJudProcesso) => {
    try {
      const result = await datajudCaseService.linkProcessoToCaso(
        caso.id,
        processo
      )

      const updatedCaso: Caso = {
        ...caso,
        numero_processo: processo.numero_processo,
        tribunal: processo.tribunal,
        grau: processo.grau,
        classe_processual: processo.classe_processual,
        assunto_principal: processo.assunto,
        datajud_sync_status: "sincronizado",
        datajud_last_sync_at: new Date().toISOString(),
      }

      onProcessoLinked(updatedCaso)
      toast.success(`Processo ${processo.numero_processo} vinculado com sucesso`)
    } catch (error) {
      console.error("Error linking processo:", error)
      toast.error("Erro ao vincular processo")
    }
  }

  const handleSyncMovimentos = async () => {
    if (!caso.datajud_processo_id) {
      toast.error("Nenhum processo vinculado")
      return
    }

    setIsSyncing(true)
    try {
      const result = await datajudCaseService.syncProcessoMovimentos(
        caso.datajud_processo_id,
        caso.numero_processo!,
        caso.tribunal!
      )

      toast.success(
        `${result.novas_movimentacoes} nova(s) movimentação(ões) sincronizada(s)`
      )

      if (result.novas_movimentacoes > 0) {
        setMovimentos(result.movimentos)
        setShowMovimentos(true)
      }
    } catch (error) {
      console.error("Error syncing movimentos:", error)
      toast.error("Erro ao sincronizar movimentações")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleViewMovimentos = async () => {
    if (movimentosLoading) return
    
    setMovimentosLoading(true)
    try {
      const result = await datajudCaseService.getProcessoDetails(
        caso.numero_processo!,
        caso.tribunal!
      )

      setMovimentos(result.movimentos)
      setShowMovimentos(true)
    } catch (error) {
      console.error("Error fetching movimentos:", error)
      toast.error("Erro ao buscar movimentações")
    } finally {
      setMovimentosLoading(false)
    }
  }

  const handleUnlink = async () => {
    try {
      await datajudCaseService.unlinkProcessoFromCaso(caso.id)
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
      toast.success("Processo desvinculado")
    } catch (error) {
      console.error("Error unlinking processo:", error)
      toast.error("Erro ao desvincular processo")
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">DataJud - Processo Judicial</h3>
        <p className="text-sm text-gray-600">
          Gerencie a sincronização com processos judiciais
        </p>
      </div>

      {hasProcesso ? (
        <div className="space-y-4">
          {/* Processo Info */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Número do Processo
                </p>
                <p className="font-mono text-lg font-semibold text-blue-600">
                  {caso.numero_processo}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tribunal</p>
                <p className="text-lg font-semibold">{caso.tribunal}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Classe</p>
                <p className="text-sm">
                  {caso.classe_processual || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Grau</p>
                <p className="text-sm">{caso.grau || "Não informado"}</p>
              </div>
            </div>

            {caso.assunto_principal && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Assunto</p>
                <p className="text-sm text-gray-700">{caso.assunto_principal}</p>
              </div>
            )}

            {caso.datajud_last_sync_at && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Última sincronização:{" "}
                  {new Date(caso.datajud_last_sync_at).toLocaleString("pt-BR")}
                </p>
              </div>
            )}

            {caso.datajud_sync_error && (
              <div className="mt-4 rounded bg-red-100 p-2">
                <p className="text-xs text-red-700">
                  <strong>Erro:</strong> {caso.datajud_sync_error}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSyncMovimentos}
              disabled={isSyncing}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-400"
            >
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
            <button
              onClick={handleViewMovimentos}
              disabled={movimentosLoading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-400"
            >
              {movimentosLoading ? "Carregando..." : "Ver Movimentações"}
            </button>
            <button
              onClick={handleUnlink}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Desvincular
            </button>
            <a
              href={`https://www.cnj.jus.br/programas-e-acoes/datajud`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Abrir no Portal
            </a>
          </div>

          {/* Movimentos Timeline */}
          {showMovimentos && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold">Movimentações</h4>
              {movimentos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma movimentação encontrada
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {movimentos.map((movimento, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 bg-gray-50 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {movimento.nome}
                          </p>
                          {movimento.complemento && (
                            <p className="text-xs text-gray-600 mt-1">
                              {movimento.complemento}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {new Date(movimento.data_hora).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Nenhum processo judicial vinculado a este caso
          </p>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            Buscar Processo no DataJud
          </button>
        </div>
      )}

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
