// src/components/CasoDetail/CasoDataJudSearchModal.tsx
import { useState } from 'react'
import { datajudCaseService } from '@/services/datajudCaseService'
import type { DataJudProcesso } from '@/types/domain'
import { Skeleton } from '@/components/ui/skeleton'
import { PageState } from '@/components/PageState'

interface CasoDataJudSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProcesso: (processo: DataJudProcesso) => void
  clienteName: string
  clienteId?: string
}

export function CasoDataJudSearchModal({
  isOpen,
  onClose,
  onSelectProcesso,
  clienteName,
  clienteId,
}: CasoDataJudSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(clienteName || "")
  const [tribunal, setTribunal] = useState("stj")
  const [searchType, setSearchType] = useState<"numero" | "parte" | "classe">("parte")
  const [processos, setProcessos] = useState<DataJudProcesso[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  const tribunals = [
    { value: "stj", label: "Superior Tribunal de Justiça" },
    { value: "tst", label: "Tribunal Superior do Trabalho" },
    { value: "trf", label: "Tribunal Regional Federal" },
    { value: "trt", label: "Tribunal Regional do Trabalho" },
    { value: "tre", label: "Tribunal Regional Eleitoral" },
    { value: "stf", label: "Supremo Tribunal Federal" },
  ]

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Digite um termo de busca")
      return
    }

    setLoading(true)
    setError(null)
    setProcessos([])

    try {
      const result = await datajudCaseService.searchProcessos({
        tribunal,
        searchType,
        query: searchTerm,
        clienteId,
      })

      setProcessos(result.processos || [])
      setLatency(result.latency_ms)

      if (result.total === 0) {
        setError("Nenhum processo encontrado")
      }
    } catch (err) {
      console.error("Search error:", err)
      setError(err instanceof Error ? err.message : "Erro ao buscar processos")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Buscar Processos no DataJud</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Search Form */}
        <div className="mb-6 space-y-4">
          <div>
            <label htmlFor="datajud-search-type" className="block text-sm font-medium text-gray-700">
              Tipo de Busca
            </label>
            <select
              id="datajud-search-type"
              name="searchType"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="parte">Por Parte (Nome/CPF/CNPJ)</option>
              <option value="numero">Por Número do Processo</option>
              <option value="classe">Por Classe</option>
            </select>
          </div>

          <div>
            <label htmlFor="datajud-tribunal" className="block text-sm font-medium text-gray-700">
              Tribunal
            </label>
            <select
              id="datajud-tribunal"
              name="tribunal"
              value={tribunal}
              onChange={(e) => setTribunal(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            >
              {tribunals.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="datajud-search-term" className="block text-sm font-medium text-gray-700">
              Termo de Busca
            </label>
            <input
              id="datajud-search-term"
              name="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Digite o termo para buscar..."
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:bg-gray-400"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>

          {latency && (
            <p className="text-sm text-gray-500">
              Busca realizada em {latency}ms
            </p>
          )}
        </div>

        {/* Results */}
        <PageState
          status={
            loading ? "loading" : error ? "error" : processos.length ? "ready" : "empty"
          }
          errorDescription={error || undefined}
          emptyDescription="Nenhum processo encontrado"
        >
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : processos.length > 0 ? (
              processos.map((processo) => (
                <div
                  key={processo.numero_processo}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    onSelectProcesso(processo)
                    onClose()
                  }}
                >
                  <div className="font-mono text-sm font-semibold text-blue-600">
                    {processo.numero_processo}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Tribunal:</strong> {processo.tribunal} |{" "}
                    <strong>Classe:</strong> {processo.classe_processual || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {processo.assunto}
                  </div>
                  {processo.dataAtualizacao && (
                    <div className="text-xs text-gray-400 mt-1">
                      Última atualização:{" "}
                      {new Date(processo.dataAtualizacao).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              ))
            ) : null}
          </div>
        </PageState>
      </div>
    </div>
  )
}
