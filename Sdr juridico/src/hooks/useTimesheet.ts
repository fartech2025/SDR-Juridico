import { useState, useCallback, useMemo } from 'react'
import { timesheetService } from '@/services/timesheetService'
import type { Caso } from '@/types/domain'
import type {
  TimesheetEntry,
  TimesheetCreateInput,
  TimesheetUpdateInput,
  TimesheetSnapshot,
  FaturamentoResult,
} from '@/types/timesheet'

function getCurrentMonthPrefix(): string {
  return new Date().toISOString().slice(0, 7) // 'YYYY-MM'
}

function isSameMonth(dateStr: string, monthPrefix: string): boolean {
  return dateStr.startsWith(monthPrefix)
}

export function useTimesheet(casos: Caso[] = []) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // ── Snapshot mensal ──────────────────────────────────────────────────────────
  const snapshot = useMemo((): TimesheetSnapshot => {
    const mes = getCurrentMonthPrefix()
    const doMes = entries.filter((e) => isSameMonth(e.data, mes))

    const horasNoMes = doMes.reduce((s, e) => s + e.horas, 0)
    const valorBillableMes = doMes
      .filter((e) => e.tipo === 'billable')
      .reduce((s, e) => s + e.valorTotal, 0)
    const valorNaoBillableMes = doMes
      .filter((e) => e.tipo === 'non_billable')
      .reduce((s, e) => s + e.valorTotal, 0)

    const aprovadas = entries.filter((e) => e.status === 'aprovado' && e.tipo === 'billable')
    const horasAFaturar = aprovadas.reduce((s, e) => s + e.horas, 0)
    const valorAFaturar = aprovadas.reduce((s, e) => s + e.valorTotal, 0)
    const entradasRascunho = entries.filter((e) => e.status === 'rascunho').length

    // Agrupa por advogado
    const byAdv = new Map<string, { userId: string; nome: string; horas: number; valor: number }>()
    for (const e of doMes) {
      const key = e.responsavelUserId
      const prev = byAdv.get(key) ?? { userId: e.responsavelUserId, nome: e.responsavelNome ?? e.responsavelUserId, horas: 0, valor: 0 }
      byAdv.set(key, { ...prev, horas: prev.horas + e.horas, valor: prev.valor + e.valorTotal })
    }

    // Agrupa por caso
    const byCaso = new Map<string, { casoId: string; casoTitulo: string; horas: number; valor: number }>()
    for (const e of doMes) {
      if (!e.casoId) continue
      const key = e.casoId
      const prev = byCaso.get(key) ?? { casoId: e.casoId, casoTitulo: e.casoTitulo ?? e.casoId, horas: 0, valor: 0 }
      byCaso.set(key, { ...prev, horas: prev.horas + e.horas, valor: prev.valor + e.valorTotal })
    }

    return {
      horasNoMes,
      valorBillableMes,
      valorNaoBillableMes,
      horasAFaturar,
      valorAFaturar,
      entradasRascunho,
      horasPorAdvogado: [...byAdv.values()].sort((a, b) => b.horas - a.horas),
      entradasPorCaso: [...byCaso.values()].sort((a, b) => b.horas - a.horas),
    }
  }, [entries])

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await timesheetService.listEntries()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar timesheet'))
    } finally {
      setLoading(false)
    }
  }, [])

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const createEntry = useCallback(async (input: TimesheetCreateInput): Promise<TimesheetEntry> => {
    const created = await timesheetService.createEntry(input)
    setEntries((prev) => [created, ...prev])
    return created
  }, [])

  const updateEntry = useCallback(async (id: string, updates: TimesheetUpdateInput): Promise<TimesheetEntry> => {
    const updated = await timesheetService.updateEntry(id, updates)
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    await timesheetService.deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ── Aprovação ────────────────────────────────────────────────────────────────
  const aprovarEntradas = useCallback(async (ids: string[]): Promise<void> => {
    await timesheetService.aprovarEntradas(ids)
    setEntries((prev) =>
      prev.map((e) => (ids.includes(e.id) && e.status === 'rascunho' ? { ...e, status: 'aprovado' as const } : e)),
    )
  }, [])

  // ── Faturamento ──────────────────────────────────────────────────────────────
  const faturarPeriodo = useCallback(async (entriesToBill: TimesheetEntry[]): Promise<FaturamentoResult> => {
    const result = await timesheetService.faturarPeriodo(entriesToBill)
    // Atualiza estado local das entradas faturadas
    const faturadosIds = new Set(entriesToBill.map((e) => e.id))
    setEntries((prev) =>
      prev.map((e) =>
        faturadosIds.has(e.id) && e.status === 'aprovado'
          ? { ...e, status: 'faturado' as const }
          : e,
      ),
    )
    return result
  }, [])

  // casos não é usado diretamente no hook mas permite ao componente pai
  // passar a lista para enriquecer o select de casos no form
  void casos

  return {
    entries,
    loading,
    error,
    snapshot,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    aprovarEntradas,
    faturarPeriodo,
  }
}
