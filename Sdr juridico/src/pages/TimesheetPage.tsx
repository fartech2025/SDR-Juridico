import React, { useEffect } from 'react'
import { Clock, Plus, CheckCheck, DollarSign, FileText, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UpgradeWall } from '@/components/UpgradeWall'
import { useTimesheet } from '@/hooks/useTimesheet'
import { useCasos } from '@/hooks/useCasos'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePermissionsContext } from '@/contexts/PermissionsContext'
import { usePlan } from '@/hooks/usePlan'
import type { TimesheetEntry, TimesheetCreateInput } from '@/types/timesheet'

// ── Utilitários ────────────────────────────────────────────────────────────────
function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMonthPrefix() {
  return new Date().toISOString().slice(0, 7)
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatHoras(h: number) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`
}

function statusBadge(status: TimesheetEntry['status']) {
  const map = {
    rascunho: { label: 'Rascunho', bg: 'bg-gray-100', text: 'text-gray-600' },
    aprovado: { label: 'Aprovado', bg: 'bg-amber-100', text: 'text-amber-700' },
    faturado: { label: 'Faturado', bg: 'bg-green-100', text: 'text-green-700' },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function tipoBadge(tipo: TimesheetEntry['tipo']) {
  return tipo === 'billable' ? (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      Faturável
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
      Interno
    </span>
  )
}

// ── Formulário inicial ─────────────────────────────────────────────────────────
const FORM_INITIAL = {
  data: getTodayIso(),
  casoId: '',
  horas: '',
  taxaHoraria: '',
  descricao: '',
  tipo: 'billable' as TimesheetEntry['tipo'],
}

// ── Componente principal ───────────────────────────────────────────────────────
export function TimesheetPage() {
  const { canUseTimesheet } = usePlan()
  if (!canUseTimesheet) {
    return <UpgradeWall feature="Timesheet & Honorários" minPlan="Profissional" />
  }

  return <TimesheetContent />
}

function TimesheetContent() {
  const { casos, fetchCasos } = useCasos()
  const { user } = useCurrentUser()
  const { isOrgAdmin, isFartechAdmin } = usePermissionsContext()
  const isGestor = isOrgAdmin || isFartechAdmin

  const {
    entries,
    loading,
    snapshot,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    aprovarEntradas,
    faturarPeriodo,
  } = useTimesheet(casos)

  useEffect(() => {
    void fetchEntries()
    void fetchCasos()
  }, [fetchEntries, fetchCasos])

  // ── Estado local ─────────────────────────────────────────────────────────────
  const [filterMonth, setFilterMonth] = React.useState(getCurrentMonthPrefix)
  const [filterAdvogado, setFilterAdvogado] = React.useState('todos')
  const [filterStatus, setFilterStatus] = React.useState<'todos' | TimesheetEntry['status']>('todos')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showForm, setShowForm] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<TimesheetEntry | null>(null)
  const [form, setForm] = React.useState(FORM_INITIAL)
  const [saving, setSaving] = React.useState(false)
  const [actioningId, setActioningId] = React.useState<string | null>(null)
  const [showConfirmFaturar, setShowConfirmFaturar] = React.useState(false)
  const [faturandoResult, setFaturandoResult] = React.useState<{ total: number; count: number } | null>(null)

  // ── Computed ─────────────────────────────────────────────────────────────────
  const advogadosUnicos = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entries) {
      if (!map.has(e.responsavelUserId)) {
        map.set(e.responsavelUserId, e.responsavelNome ?? e.responsavelUserId)
      }
    }
    return [...map.entries()].map(([id, nome]) => ({ id, nome }))
  }, [entries])

  const entriesFiltradas = React.useMemo(() => {
    return entries.filter((e) => {
      if (!e.data.startsWith(filterMonth)) return false
      if (filterAdvogado !== 'todos' && e.responsavelUserId !== filterAdvogado) return false
      if (filterStatus !== 'todos' && e.status !== filterStatus) return false
      return true
    })
  }, [entries, filterMonth, filterAdvogado, filterStatus])

  const minhasEntradas = React.useMemo(() => {
    return entries.filter((e) => e.responsavelUserId === user?.id && e.data.startsWith(filterMonth))
  }, [entries, user?.id, filterMonth])

  const aprovadosParaFaturar = React.useMemo(() => {
    return entries.filter((e) => e.status === 'aprovado' && e.tipo === 'billable')
  }, [entries])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function abrirFormNovo() {
    setEditingEntry(null)
    setForm({ ...FORM_INITIAL, data: getTodayIso() })
    setShowForm(true)
  }

  function abrirFormEditar(entry: TimesheetEntry) {
    setEditingEntry(entry)
    setForm({
      data: entry.data,
      casoId: entry.casoId ?? '',
      horas: String(entry.horas),
      taxaHoraria: String(entry.taxaHoraria),
      descricao: entry.descricao,
      tipo: entry.tipo,
    })
    setShowForm(true)
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao || !form.horas || Number(form.horas) <= 0) return
    if (!user?.id) return
    setSaving(true)
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, {
          data: form.data,
          horas: Number(form.horas),
          descricao: form.descricao,
          taxaHoraria: Number(form.taxaHoraria) || 0,
          tipo: form.tipo,
        })
      } else {
        const input: TimesheetCreateInput = {
          data: form.data,
          casoId: form.casoId || undefined,
          horas: Number(form.horas),
          descricao: form.descricao,
          taxaHoraria: Number(form.taxaHoraria) || 0,
          tipo: form.tipo,
          responsavelUserId: user.id,
        }
        await createEntry(input)
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setActioningId(id)
    try { await deleteEntry(id) } finally { setActioningId(null) }
  }

  async function handleAprovar() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setActioningId('aprovar')
    try {
      await aprovarEntradas(ids)
      setSelectedIds(new Set())
    } finally {
      setActioningId(null)
    }
  }

  async function handleFaturar() {
    setActioningId('faturar')
    try {
      const result = await faturarPeriodo(aprovadosParaFaturar)
      setFaturandoResult({ total: result.totalFaturado, count: result.entradasFaturadas })
      setShowConfirmFaturar(false)
    } finally {
      setActioningId(null)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(ids: string[]) {
    const allSelected = ids.every((id) => selectedIds.has(id))
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(ids))
  }

  const rascunhosFiltrados = entriesFiltradas.filter((e) => e.status === 'rascunho')
  const rascunhosIds = rascunhosFiltrados.map((e) => e.id)
  const todasSelecionadas = rascunhosIds.length > 0 && rascunhosIds.every((id) => selectedIds.has(id))

  // ── KPI cards ─────────────────────────────────────────────────────────────────
  const kpiCards = [
    { icon: Clock, label: 'Horas no Mês', value: formatHoras(snapshot.horasNoMes), color: '#721011' },
    { icon: DollarSign, label: 'Valor Faturável', value: formatCurrency(snapshot.valorBillableMes), color: '#BF6F32' },
    { icon: FileText, label: 'A Faturar', value: formatCurrency(snapshot.valorAFaturar), color: '#721011' },
    { icon: AlertCircle, label: 'Rascunhos', value: String(snapshot.entradasRascunho), color: snapshot.entradasRascunho > 0 ? '#BF6F32' : '#6B5E58' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: '#721011' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Timesheet</h1>
          <p className="text-sm text-gray-500">Controle de horas e geração de honorários</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
            style={{ '--tw-ring-color': 'rgba(114,16,17,0.2)' } as React.CSSProperties}
          />
          <Button onClick={abrirFormNovo} style={{ backgroundColor: '#721011' }} className="text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Horas
          </Button>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">{k.label}</p>
              <k.icon className="h-4 w-4" style={{ color: k.color }} />
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Painel do Gestor ──────────────────────────────────────────────────── */}
      {isGestor && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Painel do Gestor</h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro advogado */}
              <select
                value={filterAdvogado}
                onChange={(e) => setFilterAdvogado(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs"
              >
                <option value="todos">Todos os advogados</option>
                {advogadosUnicos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
              {/* Filtro status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs"
              >
                <option value="todos">Todos os status</option>
                <option value="rascunho">Rascunho</option>
                <option value="aprovado">Aprovado</option>
                <option value="faturado">Faturado</option>
              </select>
              {/* Ações em lote */}
              {selectedIds.size > 0 && (
                <Button
                  variant="outline"
                  onClick={handleAprovar}
                  disabled={actioningId === 'aprovar'}
                  className="text-xs"
                >
                  <CheckCheck className="mr-1.5 h-3 w-3" />
                  {actioningId === 'aprovar' ? 'Aprovando...' : `Aprovar (${selectedIds.size})`}
                </Button>
              )}
              {aprovadosParaFaturar.length > 0 && (
                <Button
                  onClick={() => setShowConfirmFaturar(true)}
                  disabled={actioningId === 'faturar'}
                  className="text-xs text-white hover:opacity-90"
                  style={{ backgroundColor: '#721011' }}
                >
                  <DollarSign className="mr-1.5 h-3 w-3" />
                  Faturar Aprovados ({aprovadosParaFaturar.length})
                </Button>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={todasSelecionadas}
                      onChange={() => toggleSelectAll(rascunhosIds)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Advogado</th>
                  <th className="px-4 py-3 text-left">Caso</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                  <th className="px-4 py-3 text-right">Taxa</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entriesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                      Nenhuma entrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  entriesFiltradas.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        {e.status === 'rascunho' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.responsavelNome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{e.casoTitulo ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={e.descricao}>{e.descricao}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900">{formatHoras(e.horas)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(e.taxaHoraria)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(e.valorTotal)}</td>
                      <td className="px-4 py-3 text-center">{tipoBadge(e.tipo)}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(e.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Minhas Horas ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Minhas Horas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Caso</th>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-right">Horas</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Tipo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {minhasEntradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhuma hora registrada neste mês.{' '}
                    <button onClick={abrirFormNovo} className="font-medium underline" style={{ color: '#721011' }}>
                      Registrar agora
                    </button>
                  </td>
                </tr>
              ) : (
                minhasEntradas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{e.casoTitulo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={e.descricao}>{e.descricao}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900">{formatHoras(e.horas)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(e.valorTotal)}</td>
                    <td className="px-4 py-3 text-center">{tipoBadge(e.tipo)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(e.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {e.status === 'rascunho' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => abrirFormEditar(e)}
                            className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            disabled={actioningId === e.id}
                            className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Registrar / Editar Horas ───────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingEntry ? 'Editar Registro de Horas' : 'Registrar Horas'}
        maxWidth="36rem"
      >
        <form className="space-y-3" onSubmit={handleSubmitForm}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Data</label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TimesheetEntry['tipo'] }))}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="billable">Faturável (billable)</option>
                <option value="non_billable">Interno (non-billable)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-gray-500">Caso (opcional)</label>
            <select
              value={form.casoId}
              onChange={(e) => setForm((p) => ({ ...p, casoId: e.target.value }))}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sem vínculo com caso</option>
              {casos
                .filter((c) => c.status === 'ativo')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.cliente}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-gray-500">Descrição</label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              placeholder="Ex: Elaboração de petição inicial, Audiência de instrução..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Horas</label>
              <Input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={form.horas}
                onChange={(e) => setForm((p) => ({ ...p, horas: e.target.value }))}
                placeholder="Ex: 2.5"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Taxa Horária (R$)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.taxaHoraria}
                onChange={(e) => setForm((p) => ({ ...p, taxaHoraria: e.target.value }))}
                placeholder="Ex: 300.00"
              />
            </div>
          </div>

          {/* Preview do valor */}
          {form.horas && form.taxaHoraria && Number(form.horas) > 0 && Number(form.taxaHoraria) > 0 && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm">
              <span className="text-gray-500">Valor estimado: </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(Number(form.horas) * Number(form.taxaHoraria))}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: '#721011' }}
              className="text-white hover:opacity-90"
            >
              {saving ? 'Salvando...' : editingEntry ? 'Salvar Alterações' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Confirmar Faturamento ──────────────────────────────────────── */}
      <Modal
        open={showConfirmFaturar}
        onClose={() => setShowConfirmFaturar(false)}
        title="Confirmar Faturamento"
        maxWidth="28rem"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Serão criados lançamentos no módulo Financeiro como <strong>receitas a receber</strong> para as seguintes entradas:
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1">
            <p className="text-sm font-medium text-amber-800">
              {aprovadosParaFaturar.length} entradas aprovadas
            </p>
            <p className="text-xl font-bold text-amber-900">
              {formatCurrency(aprovadosParaFaturar.reduce((s, e) => s + e.valorTotal, 0))}
            </p>
            <p className="text-xs text-amber-700">
              {formatHoras(aprovadosParaFaturar.reduce((s, e) => s + e.horas, 0))} de trabalho faturável
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Esta ação é irreversível. As entradas serão marcadas como "Faturado" e os lançamentos aparecerão em Financeiro.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowConfirmFaturar(false)}>Cancelar</Button>
          <Button
            onClick={handleFaturar}
            disabled={actioningId === 'faturar'}
            style={{ backgroundColor: '#721011' }}
            className="text-white hover:opacity-90"
          >
            {actioningId === 'faturar' ? 'Faturando...' : 'Confirmar e Faturar'}
          </Button>
        </div>
      </Modal>

      {/* ── Toast: Faturamento concluído ──────────────────────────────────────── */}
      {faturandoResult && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 text-white shadow-lg"
          onClick={() => setFaturandoResult(null)}
          role="status"
        >
          <CheckCheck className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Faturamento realizado!</p>
            <p className="text-xs opacity-90">
              {faturandoResult.count} entradas → {formatCurrency(faturandoResult.total)} no Financeiro
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
