import * as React from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  FilterX,
  Landmark,
  PercentSquare,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui'
import logoMark from '@/assets/logo-mark.png'
import { useCasos } from '@/hooks/useCasos'
import { useFinanceiro } from '@/hooks/useFinanceiro'
import { useLeads } from '@/hooks/useLeads'
import { cn } from '@/utils/cn'
import { addPdfHeader, addPdfFooters, getTableTheme, MARGIN } from '@/services/pdfReportService'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) => `${Math.round(value)}%`

const getTodayIso = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
let companyLogoDataUrl: string | null = null

const getCompanyLogoDataUrl = async () => {
  if (companyLogoDataUrl) return companyLogoDataUrl
  try {
    const response = await fetch(logoMark)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler logo'))
      reader.readAsDataURL(blob)
    })
    companyLogoDataUrl = dataUrl
    return dataUrl
  } catch {
    return null
  }
}

// Análise de categorias
const analyzeCategories = (transactions: any[]) => {
  const receitas = new Map<string, number>()
  const despesas = new Map<string, number>()

  transactions.forEach((tx) => {
    const map = tx.type === 'receita' ? receitas : despesas
    map.set(tx.category, (map.get(tx.category) || 0) + tx.amount)
  })

  return {
    receitas: [...receitas.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    despesas: [...despesas.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  }
}

// Projeção de fluxo de caixa
const projectCashflow = (transactions: any[], months: number = 6) => {
  const projection: any[] = []
  const now = new Date()
  const monthBase = new Map<string, { receita: number; despesa: number }>()

  // Agrupa dados históricos por mês
  transactions.forEach((tx) => {
    const date = new Date(tx.paidDate || tx.dueDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthBase.has(key)) monthBase.set(key, { receita: 0, despesa: 0 })
    const month = monthBase.get(key)!
    if (tx.type === 'receita' && tx.status === 'pago') month.receita += tx.amount
    if (tx.type === 'despesa' && tx.status === 'pago') month.despesa += tx.amount
  })

  // Calcula média móvel para projeção
  const avgReceita = monthBase.size > 0 ? Array.from(monthBase.values()).reduce((acc, m) => acc + m.receita, 0) / monthBase.size : 0
  const avgDespesa = monthBase.size > 0 ? Array.from(monthBase.values()).reduce((acc, m) => acc + m.despesa, 0) / monthBase.size : 0

  for (let i = 0; i < months; i++) {
    const projDate = new Date(now)
    projDate.setMonth(now.getMonth() + i)
    const key = `${projDate.getFullYear()}-${String(projDate.getMonth() + 1).padStart(2, '0')}`
    const existing = monthBase.get(key)
    projection.push({
      month: monthLabels[projDate.getMonth()],
      receita: existing ? existing.receita : avgReceita,
      despesa: existing ? existing.despesa : avgDespesa,
      saldo: (existing ? existing.receita : avgReceita) - (existing ? existing.despesa : avgDespesa),
    })
  }

  return projection
}

// Calcula índices financeiros
const calculateFinancialIndexes = (snapshot: any, transactions: any[]) => {
  const totalReceita = transactions.filter((tx) => tx.type === 'receita' && tx.status === 'pago').reduce((acc, tx) => acc + tx.amount, 0)
  const totalDespesa = transactions.filter((tx) => tx.type === 'despesa' && tx.status === 'pago').reduce((acc, tx) => acc + tx.amount, 0)
  const lucroLiquido = totalReceita - totalDespesa
  const margemBruta = totalReceita > 0 ? Math.round((lucroLiquido / totalReceita) * 100) : 0
  const dias_caixa = totalDespesa > 0 ? Math.round((snapshot.contasPagar / (totalDespesa / 30)) * 100) / 100 : 0
  const taxa_inadimplencia = snapshot.contasReceber > 0 ? Math.round((snapshot.inadimplencia * snapshot.contasReceber) / 10000) : 0

  return {
    margemBruta,
    dias_caixa,
    taxa_inadimplencia,
    roic: totalReceita > 0 ? Math.round((lucroLiquido / totalReceita) * 100) : 0,
    lucratividade: totalReceita > 0 ? Math.round((lucroLiquido / totalReceita) * 100) : 0,
  }
}

export function FinanceiroPage() {
  const { leads } = useLeads()
  const { casos } = useCasos()
  const {
    loading,
    transactions,
    responsaveis,
    carteiraPorResponsavel,
    carteiraMetrics,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceiro(leads, casos)

  const [form, setForm] = React.useState({
    type: 'receita' as 'receita' | 'despesa',
    category: 'Contratos',
    description: '',
    amount: '',
    dueDate: getTodayIso(),
    cliente: '',
    responsavelUserId: '',
    recurring: false,
    recurrenceCount: 2,
  })
  const [saving, setSaving] = React.useState(false)
  const [exportingPdf, setExportingPdf] = React.useState(false)
  const [actioningId, setActioningId] = React.useState<string | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [roleFilter, setRoleFilter] = React.useState<'todos' | 'advogado' | 'gestor'>('todos')
  const [responsavelFilter, setResponsavelFilter] = React.useState<string>('todos')
  const [reportMonth, setReportMonth] = React.useState(() => getTodayIso().slice(0, 7))

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.description || !form.amount || Number(form.amount) <= 0) return

    setSaving(true)
    try {
      await createTransaction({
        type: form.type,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        cliente: form.cliente || undefined,
        responsavelUserId: form.responsavelUserId || undefined,
        recurring: form.recurring,
        recurrenceCount: form.recurring ? form.recurrenceCount : 1,
      })
      setForm((prev) => ({
        ...prev,
        description: '',
        amount: '',
        cliente: '',
        recurring: false,
        recurrenceCount: 2,
      }))
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setActioningId(id)
    try {
      await updateTransaction(id, { status: 'pago', paidDate: getTodayIso() })
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActioningId(id)
    try {
      await deleteTransaction(id)
    } finally {
      setActioningId(null)
    }
  }

  React.useEffect(() => {
    if (!form.responsavelUserId && responsaveis.length > 0) {
      setForm((prev) => ({ ...prev, responsavelUserId: responsaveis[0].id }))
    }
  }, [form.responsavelUserId, responsaveis])

  const filteredTransactions = React.useMemo(
    () =>
      transactions.filter((tx) => {
        if (roleFilter !== 'todos' && tx.responsavelRole !== roleFilter) return false
        if (responsavelFilter !== 'todos' && tx.responsavelUserId !== responsavelFilter) return false
        return true
      }),
    [transactions, roleFilter, responsavelFilter],
  )

  const monthKey = React.useCallback(
    (dateValue: string) => {
      const date = new Date(dateValue)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    },
    [],
  )

  // ─────────────────────────────── ANÁLISES AVANÇADAS ───────────────────────────────
  const categoryAnalysis = React.useMemo(() => analyzeCategories(filteredTransactions), [filteredTransactions])
  const cashflowProjection = React.useMemo(() => projectCashflow(filteredTransactions), [filteredTransactions])

  const snapshot = React.useMemo(() => {
    const now = new Date()
    const isSameMonth = (value: string) => {
      const date = new Date(value)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    }

    const receitaRealizadaMes = filteredTransactions
      .filter((tx) => tx.type === 'receita' && tx.status === 'pago' && isSameMonth(tx.paidDate || tx.dueDate))
      .reduce((acc, tx) => acc + tx.amount, 0)
    const despesaRealizadaMes = filteredTransactions
      .filter((tx) => tx.type === 'despesa' && tx.status === 'pago' && isSameMonth(tx.paidDate || tx.dueDate))
      .reduce((acc, tx) => acc + tx.amount, 0)
    const contasReceber = filteredTransactions
      .filter((tx) => tx.type === 'receita' && tx.status !== 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const contasPagar = filteredTransactions
      .filter((tx) => tx.type === 'despesa' && tx.status !== 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const receitasAtrasadas = filteredTransactions
      .filter((tx) => tx.type === 'receita' && tx.status === 'atrasado')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const resultadoMes = receitaRealizadaMes - despesaRealizadaMes
    const margemOperacional = receitaRealizadaMes > 0 ? Math.round((resultadoMes / receitaRealizadaMes) * 100) : 0
    const inadimplencia = contasReceber > 0 ? Math.round((receitasAtrasadas / contasReceber) * 100) : 0
    
    return {
      receitaRealizadaMes,
      despesaRealizadaMes,
      resultadoMes,
      margemOperacional,
      contasReceber,
      contasPagar,
      inadimplencia,
      receitasAtrasadas,
    }
  }, [filteredTransactions])

  const financialIndexes = React.useMemo(() => calculateFinancialIndexes(snapshot, filteredTransactions), [snapshot, filteredTransactions])

  const cashflowSeries = React.useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now)
      date.setMonth(now.getMonth() - (5 - index))
      return date
    })

    return months.map((monthDate) => {
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      const receita = filteredTransactions
        .filter((tx) => tx.type === 'receita' && monthKey(tx.paidDate || tx.dueDate) === key)
        .reduce((acc, tx) => acc + tx.amount, 0)
      const despesa = filteredTransactions
        .filter((tx) => tx.type === 'despesa' && monthKey(tx.paidDate || tx.dueDate) === key)
        .reduce((acc, tx) => acc + tx.amount, 0)
      return {
        month: monthLabels[monthDate.getMonth()],
        receita,
        despesa,
        saldo: receita - despesa,
      }
    })
  }, [filteredTransactions, monthKey])

  const contasReceber = React.useMemo(
    () => filteredTransactions.filter((tx) => tx.type === 'receita' && tx.status !== 'pago'),
    [filteredTransactions],
  )
  const contasPagar = React.useMemo(
    () => filteredTransactions.filter((tx) => tx.type === 'despesa' && tx.status !== 'pago'),
    [filteredTransactions],
  )

  const carteiraFiltrada = React.useMemo(
    () =>
      carteiraPorResponsavel.filter((item) => {
        if (roleFilter !== 'todos' && item.role !== roleFilter) return false
        if (responsavelFilter !== 'todos' && item.id !== responsavelFilter) return false
        return true
      }),
    [carteiraPorResponsavel, roleFilter, responsavelFilter],
  )

  const reportMonthOptions = React.useMemo(() => {
    const keys = new Set(filteredTransactions.map((tx) => monthKey(tx.dueDate)))
    if (keys.size === 0) {
      keys.add(getTodayIso().slice(0, 7))
    }
    return [...keys]
      .sort((a, b) => (a > b ? -1 : 1))
      .map((key) => {
        const [year, month] = key.split('-')
        const monthIndex = Number(month) - 1
        return {
          value: key,
          label: `${monthLabels[monthIndex]}/${year}`,
        }
      })
  }, [filteredTransactions, monthKey])

  React.useEffect(() => {
    if (!reportMonthOptions.some((item) => item.value === reportMonth)) {
      setReportMonth(reportMonthOptions[0]?.value || getTodayIso().slice(0, 7))
    }
  }, [reportMonth, reportMonthOptions])

  const extratoMensal = React.useMemo(
    () =>
      filteredTransactions
        .filter((tx) => monthKey(tx.dueDate) === reportMonth)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [filteredTransactions, monthKey, reportMonth],
  )

  const demonstrativoMensal = React.useMemo(() => {
    const receitaPrevista = extratoMensal
      .filter((tx) => tx.type === 'receita')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const receitaRealizada = extratoMensal
      .filter((tx) => tx.type === 'receita' && tx.status === 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const despesaPrevista = extratoMensal
      .filter((tx) => tx.type === 'despesa')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const despesaRealizada = extratoMensal
      .filter((tx) => tx.type === 'despesa' && tx.status === 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const totalAtrasado = extratoMensal
      .filter((tx) => tx.status === 'atrasado')
      .reduce((acc, tx) => acc + tx.amount, 0)

    return {
      receitaPrevista,
      receitaRealizada,
      despesaPrevista,
      despesaRealizada,
      saldoPrevisto: receitaPrevista - despesaPrevista,
      saldoRealizado: receitaRealizada - despesaRealizada,
      totalAtrasado,
    }
  }, [extratoMensal])

  const selectedReportMonthLabel = React.useMemo(
    () => reportMonthOptions.find((item) => item.value === reportMonth)?.label || reportMonth,
    [reportMonth, reportMonthOptions],
  )

  const exportExtratoCsv = React.useCallback(() => {
    const headers = [
      'vencimento',
      'tipo',
      'status',
      'categoria',
      'descricao',
      'cliente',
      'responsavel',
      'valor',
    ]
    const rows = extratoMensal.map((tx) => [
      tx.dueDate,
      tx.type,
      tx.status,
      tx.category,
      tx.description,
      tx.cliente || '',
      tx.responsavelNome || '',
      tx.amount.toFixed(2),
    ])
    const csv = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `extrato_${reportMonth}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [extratoMensal, reportMonth])

  const exportExtratoPdf = React.useCallback(async () => {
    setExportingPdf(true)
    try {
      const jsPDFModule = await import('jspdf')
      const { autoTable, applyPlugin } = await import('jspdf-autotable')
      const jsPDFClass = jsPDFModule.default || jsPDFModule.jsPDF
      const applyPluginFn = applyPlugin as unknown as (pdfClass: unknown) => void
      const autoTableFn = autoTable as unknown as (
        doc: unknown,
        options: Record<string, unknown>,
      ) => void
      try {
        applyPluginFn(jsPDFClass)
      } catch {
        // Already applied
      }

      const doc = new jsPDFClass('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header padrão
      await addPdfHeader(doc, 'RELATÓRIO FINANCEIRO MENSAL', `Mês de referência: ${selectedReportMonthLabel}`)

      let y = 40
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo Demonstrativo', MARGIN, y)
      y += 4
      doc.setDrawColor(220)
      doc.line(MARGIN, y, pageWidth - MARGIN, y)
      y += 6

      const summaryLines = [
        ['Receita prevista', formatCurrency(demonstrativoMensal.receitaPrevista)],
        ['Receita realizada', formatCurrency(demonstrativoMensal.receitaRealizada)],
        ['Despesa prevista', formatCurrency(demonstrativoMensal.despesaPrevista)],
        ['Despesa realizada', formatCurrency(demonstrativoMensal.despesaRealizada)],
        ['Saldo previsto', formatCurrency(demonstrativoMensal.saldoPrevisto)],
        ['Saldo realizado', formatCurrency(demonstrativoMensal.saldoRealizado)],
        ['Total em atraso', formatCurrency(demonstrativoMensal.totalAtrasado)],
      ]
      summaryLines.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(`${label}:`, MARGIN, y)
        doc.setFont('helvetica', 'normal')
        doc.text(value, MARGIN + 42, y)
        y += 5
      })
      y += 3

      const tableTheme = getTableTheme()
      autoTableFn(doc, {
        startY: y,
        head: [['Vencimento', 'Tipo', 'Status', 'Categoria', 'Descrição', 'Responsável', 'Valor']],
        body: extratoMensal.map((tx) => [
          tx.dueDate,
          tx.type === 'receita' ? 'Receita' : 'Despesa',
          tx.status,
          tx.category,
          tx.description,
          tx.responsavelNome || 'Sem responsável',
          formatCurrency(tx.amount),
        ]),
        ...tableTheme,
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 17 },
          2: { cellWidth: 16 },
          6: { halign: 'right', cellWidth: 24 },
        },
      })

      // Footer padrão
      addPdfFooters(doc, 'Demonstrativo Financeiro')
      doc.save(`relatorio_financeiro_${reportMonth}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF financeiro:', error)
      window.alert('Não foi possível exportar o PDF do relatório.')
    } finally {
      setExportingPdf(false)
    }
  }, [demonstrativoMensal, extratoMensal, reportMonth, selectedReportMonthLabel])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-text-muted">Carregando módulo financeiro...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={Landmark}
        eyebrow="Financeiro"
        title="Gestão Financeira"
        subtitle="Análise de receitas, despesas, fluxo de caixa e indicadores financeiros."
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        }
      />

      {/* ─────────────────────────────── KPI PRINCIPAL ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn('border-border bg-surface/90', snapshot.resultadoMes >= 0 ? 'border-green-200' : 'border-red-200')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Resultado operacional</CardTitle>
            <DollarSign className={cn('h-5 w-5', snapshot.resultadoMes >= 0 ? 'text-green-600' : 'text-red-600')} />
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', snapshot.resultadoMes >= 0 ? 'text-green-700' : 'text-red-700')}>
              {formatCurrency(snapshot.resultadoMes)}
            </p>
            <p className="mt-1 text-xs text-text-subtle">Margem: {formatPercent(snapshot.margemOperacional)}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Receita realizada</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(snapshot.receitaRealizadaMes)}</p>
            <p className="mt-1 text-xs text-text-subtle">Mês atual</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Despesa realizada</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(snapshot.despesaRealizadaMes)}</p>
            <p className="mt-1 text-xs text-text-subtle">Mês atual</p>
          </CardContent>
        </Card>

        <Card className={cn('border-border bg-surface/90', snapshot.inadimplencia > 20 ? 'border-amber-200' : 'border-border')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Taxa de inadimplência</CardTitle>
            {snapshot.inadimplencia > 20 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <PercentSquare className="h-5 w-5" style={{ color: '#721011' }} />
            )}
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', snapshot.inadimplencia > 20 ? 'text-amber-700' : 'text-text')}>
              {formatPercent(snapshot.inadimplencia)}
            </p>
            <p className="mt-1 text-xs text-text-subtle">{formatCurrency(snapshot.receitasAtrasadas)} em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────── ÍNDICES FINANCEIROS ───────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader>
          <CardTitle>Índices Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-surface-alt p-4 text-center">
              <p className="text-xs uppercase text-text-subtle">Margem Bruta</p>
              <p className="mt-2 text-xl font-bold text-text">{formatPercent(financialIndexes.margemBruta)}</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-4 text-center">
              <p className="text-xs uppercase text-text-subtle">Dias de Caixa</p>
              <p className="mt-2 text-xl font-bold text-text">{financialIndexes.dias_caixa}</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-4 text-center">
              <p className="text-xs uppercase text-text-subtle">ROIC</p>
              <p className="mt-2 text-xl font-bold text-text">{formatPercent(financialIndexes.roic)}</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-4 text-center">
              <p className="text-xs uppercase text-text-subtle">Lucratividade</p>
              <p className="mt-2 text-xl font-bold text-text">{formatPercent(financialIndexes.lucratividade)}</p>
            </div>
            <div className="rounded-lg bg-surface-alt p-4 text-center">
              <p className="text-xs uppercase text-text-subtle">Taxa de Inadimplência</p>
              <p className="mt-2 text-xl font-bold text-text">{formatPercent(financialIndexes.taxa_inadimplencia)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─────────────────────────────── FLUXO DE CAIXA ───────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader>
          <CardTitle>Fluxo de Caixa (6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-80 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashflowSeries}>
              <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar yAxisId="left" dataKey="receita" fill="#2E7D32" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" dataKey="despesa" fill="#721011" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="saldo" stroke="#5B4FCF" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─────────────────────────────── MODAL NOVO LANÇAMENTO ───────────────────────────────── */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Lançamento" maxWidth="36rem">
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Tipo</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as 'receita' | 'despesa' }))}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Categoria</label>
              <Input
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="Categoria"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-gray-500">Descrição</label>
            <Input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Descrição do lançamento"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Valor (R$)</label>
              <Input
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="0,00"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Vencimento</label>
              <Input
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                type="date"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-gray-500">Cliente (opcional)</label>
            <Input
              value={form.cliente}
              onChange={(event) => setForm((prev) => ({ ...prev, cliente: event.target.value }))}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-gray-500">Responsável</label>
            <select
              value={form.responsavelUserId}
              onChange={(event) => setForm((prev) => ({ ...prev, responsavelUserId: event.target.value }))}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sem responsável</option>
              {responsaveis.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.role})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(event) => setForm((prev) => ({ ...prev, recurring: event.target.checked }))}
            />
            Lançamento recorrente
          </label>
          {form.recurring && (
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">Número de parcelas</label>
              <Input
                value={String(form.recurrenceCount)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    recurrenceCount: Math.max(2, Math.min(Number(event.target.value || 2), 36)),
                  }))
                }
                type="number"
                min="2"
                max="36"
                placeholder="Parcelas"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────── ANÁLISE DE CATEGORIAS ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            {categoryAnalysis.receitas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAnalysis.receitas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill="#2E7D32"
                    dataKey="value"
                  >
                    {categoryAnalysis.receitas.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2E7D32', '#1B5E20', '#558B2F', '#7CB342'][index % 4]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-muted">
                <p className="text-sm">Sem dados de receita</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            {categoryAnalysis.despesas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAnalysis.despesas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill="#721011"
                    dataKey="value"
                  >
                    {categoryAnalysis.despesas.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#721011', '#D32F2F', '#F44336', '#E57373'][index % 4]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-muted">
                <p className="text-sm">Sem dados de despesa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────── PROJEÇÃO DE FLUXO ───────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa (6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-80 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflowProjection}>
              <CartesianGrid stroke="var(--color-border-soft)" strokeDasharray="4 6" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <YAxis tickLine={false} axisLine={false} stroke="var(--color-text-subtle)" />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="receita" fill="#2E7D32" />
              <Bar dataKey="despesa" fill="#721011" />
              <Bar dataKey="saldo" fill="#5B4FCF" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─────────────────────────────── CONTAS A RECEBER/PAGAR ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Contas a Receber ({contasReceber.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 max-h-96 overflow-y-auto">
            {contasReceber.length === 0 && <p className="text-sm text-text-muted">Nenhum título pendente.</p>}
            {contasReceber.slice(0, 12).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{item.description}</p>
                  <p className="text-xs text-text-subtle">
                    {item.dueDate} • {item.category} • {item.responsavelNome}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">{formatCurrency(item.amount)}</p>
                  <Badge variant={item.status === 'atrasado' ? 'danger' : 'info'}>{item.status}</Badge>
                  <div className="mt-1 flex justify-end gap-1">
                    <button
                      onClick={() => handleMarkPaid(item.id)}
                      disabled={actioningId === item.id}
                      className="text-xs text-green-700 hover:underline disabled:opacity-50"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actioningId === item.id}
                      className="text-xs text-red-700 hover:underline disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-base">Contas a Pagar ({contasPagar.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 max-h-96 overflow-y-auto">
            {contasPagar.length === 0 && <p className="text-sm text-text-muted">Nenhuma obrigação pendente.</p>}
            {contasPagar.slice(0, 12).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{item.description}</p>
                  <p className="text-xs text-text-subtle">
                    {item.dueDate} • {item.category} • {item.responsavelNome}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-700">{formatCurrency(item.amount)}</p>
                  <Badge variant={item.status === 'atrasado' ? 'danger' : 'warning'}>{item.status}</Badge>
                  <div className="mt-1 flex justify-end gap-1">
                    <button
                      onClick={() => handleMarkPaid(item.id)}
                      disabled={actioningId === item.id}
                      className="text-xs text-green-700 hover:underline disabled:opacity-50"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actioningId === item.id}
                      className="text-xs text-red-700 hover:underline disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────── CARTEIRA POR RESPONSÁVEL ───────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <CardTitle className="text-base">Carteira por Advogado/Gestor</CardTitle>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as 'todos' | 'advogado' | 'gestor')}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="advogado">Advogados</option>
                <option value="gestor">Gestores</option>
              </select>
              <select
                value={responsavelFilter}
                onChange={(event) => setResponsavelFilter(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="todos">Todos responsáveis</option>
                {responsaveis
                  .filter((item) => roleFilter === 'todos' || item.role === roleFilter)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {carteiraFiltrada.length === 0 && <p className="text-sm text-text-muted">Sem dados para o filtro selecionado.</p>}
          {carteiraFiltrada.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">{item.nome}</p>
                <p className="text-xs text-text-subtle">{item.role}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold', item.saldo >= 0 ? 'text-green-700' : 'text-red-700')}>
                  Saldo: {formatCurrency(item.saldo)}
                </p>
                <p className="text-xs text-text-subtle">
                  Rec. {formatCurrency(item.receita)} | Desp. {formatCurrency(item.despesa)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ─────────────────────────────── EXTRATO MENSAL ───────────────────────────────── */}
      <Card className="border-border bg-surface/90">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Demonstrativo Mensal</CardTitle>
            <p className="mt-1 text-xs text-text-subtle">Relatório detalhado de receitas e despesas do mês selecionado</p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <select
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm md:w-44"
            >
              {reportMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={exportExtratoCsv}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="primary" type="button" size="sm" onClick={exportExtratoPdf} disabled={exportingPdf}>
              <Download className="mr-1 h-4 w-4" />
              {exportingPdf ? 'PDF...' : 'PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {(
              [
                ['Receita prevista', demonstrativoMensal.receitaPrevista, '#2E7D32'] as const,
                ['Receita realizada', demonstrativoMensal.receitaRealizada, '#2E7D32'] as const,
                ['Despesa prevista', demonstrativoMensal.despesaPrevista, '#721011'] as const,
                ['Despesa realizada', demonstrativoMensal.despesaRealizada, '#721011'] as const,
                ['Saldo previsto', demonstrativoMensal.saldoPrevisto, '#5B4FCF'] as const,
                ['Total atrasado', demonstrativoMensal.totalAtrasado, '#D32F2F'] as const,
              ] as const
            ).map(([label, value, color]) => (
              <div key={label} className="rounded-lg bg-surface-alt p-3 text-center">
                <p className="text-xs uppercase text-text-subtle">{label}</p>
                <p className="mt-2 text-sm font-bold" style={{ color }}>
                  {formatCurrency(value as number)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto border-t border-border pt-4">
            {extratoMensal.length === 0 && <p className="text-sm text-text-muted">Nenhum lançamento para o mês selecionado.</p>}
            {extratoMensal.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{tx.description}</p>
                  <p className="text-xs text-text-subtle">
                    {tx.dueDate} • {tx.category} • {tx.responsavelNome || 'Sem responsável'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', tx.type === 'receita' ? 'text-green-700' : 'text-red-700')}>
                    {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                  <Badge variant={tx.status === 'pago' ? 'success' : tx.status === 'atrasado' ? 'danger' : 'warning'}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
