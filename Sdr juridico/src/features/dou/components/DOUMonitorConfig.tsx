// src/features/dou/components/DOUMonitorConfig.tsx
import { useState } from 'react'
import type { DOUTermoMonitorado } from '@/types/domain'

interface DOUMonitorConfigProps {
  casoId: string
  orgId: string
  termos: DOUTermoMonitorado[]
  numeroProcesso?: string
  onAddTermo: (termo: string, tipo: string, orgId: string) => Promise<void>
  onRemoveTermo: (id: string) => Promise<void>
  onToggleTermo: (id: string, ativo: boolean) => Promise<void>
}

const tipoOptions = [
  { value: 'numero_processo', label: 'Numero do processo' },
  { value: 'nome_parte', label: 'Nome da parte' },
  { value: 'oab', label: 'OAB' },
  { value: 'custom', label: 'Personalizado' },
]

export function DOUMonitorConfig({
  casoId,
  orgId,
  termos,
  numeroProcesso,
  onAddTermo,
  onRemoveTermo,
  onToggleTermo,
}: DOUMonitorConfigProps) {
  const [novoTermo, setNovoTermo] = useState('')
  const [novoTipo, setNovoTipo] = useState('numero_processo')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    const value = novoTermo.trim()
    if (!value) return

    setAdding(true)
    setError(null)
    try {
      await onAddTermo(value, novoTipo, orgId)
      setNovoTermo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar termo')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remover este termo de monitoramento?')) return
    try {
      await onRemoveTermo(id)
    } catch (err) {
      console.error('Erro ao remover termo:', err)
    }
  }

  const suggestProcesso = () => {
    if (numeroProcesso && !termos.some((t) => t.termo === numeroProcesso)) {
      setNovoTermo(numeroProcesso)
      setNovoTipo('numero_processo')
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">
        Termos monitorados
      </h4>
      <p className="text-xs text-gray-500">
        Configure os termos que serao buscados automaticamente no DOU.
      </p>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="dou-novo-termo" className="block text-xs font-medium text-gray-600">
            Termo
          </label>
          <input
            id="dou-novo-termo"
            type="text"
            value={novoTermo}
            onChange={(e) => setNovoTermo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Digite o termo..."
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="w-44">
          <label htmlFor="dou-novo-tipo" className="block text-xs font-medium text-gray-600">
            Tipo
          </label>
          <select
            id="dou-novo-tipo"
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {tipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !novoTermo.trim()}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-400"
        >
          {adding ? '...' : 'Adicionar'}
        </button>
      </div>

      {numeroProcesso && !termos.some((t) => t.termo === numeroProcesso) && (
        <button
          type="button"
          onClick={suggestProcesso}
          className="text-xs text-blue-600 hover:underline"
        >
          Adicionar numero do processo: {numeroProcesso}
        </button>
      )}

      {termos.length > 0 ? (
        <div className="space-y-2">
          {termos.map((termo) => (
            <div
              key={termo.id}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termo.ativo}
                    onChange={() => onToggleTermo(termo.id, !termo.ativo)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${termo.ativo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                    {termo.termo}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {tipoOptions.find((o) => o.value === termo.tipo)?.label || termo.tipo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(termo.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">
          Nenhum termo configurado. Adicione termos para monitorar automaticamente.
        </p>
      )}
    </div>
  )
}
