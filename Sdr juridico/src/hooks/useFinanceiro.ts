import { useCallback, useEffect, useMemo, useState } from 'react'

import { financeiroService } from '@/services/financeiroService'
import type {
  CashflowPoint,
  FinanceCreateTransactionInput,
  FinanceResponsavel,
  FinanceSnapshot,
  FinanceTransaction,
} from '@/types/financeiro'
import type { Caso, Lead } from '@/types/domain'

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const isSameMonth = (dateValue: string, baseDate: Date) => {
  const date = new Date(dateValue)
  return date.getFullYear() === baseDate.getFullYear() && date.getMonth() === baseDate.getMonth()
}

const normalizeStatus = (tx: FinanceTransaction): FinanceTransaction['status'] => {
  if (tx.status === 'pago' || tx.paidDate) return 'pago'
  const dueDate = new Date(tx.dueDate)
  const today = new Date()
  if (dueDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'atrasado'
  return 'previsto'
}

export function useFinanceiro(leads: Lead[] = [], casos: Caso[] = []) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [responsaveis, setResponsaveis] = useState<FinanceResponsavel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [items, responsaveisItems] = await Promise.all([
        financeiroService.listTransactions(),
        financeiroService.listResponsaveis(),
      ])
      setTransactions(items.map((item) => ({ ...item, status: normalizeStatus(item) })))
      setResponsaveis(responsaveisItems)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar financeiro'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = useCallback(
    async (payload: FinanceCreateTransactionInput & { status?: FinanceTransaction['status'] }) => {
      const createdItems = await financeiroService.createTransaction(payload)
      const normalizedItems = createdItems.map((created) => ({ ...created, status: normalizeStatus(created) }))
      setTransactions((prev) => [...normalizedItems, ...prev])
      return normalizedItems
    },
    [],
  )

  const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<FinanceTransaction, 'id' | 'createdAt'>>) => {
    const updated = await financeiroService.updateTransaction(id, updates)
    if (!updated) return null
    const normalized = { ...updated, status: normalizeStatus(updated) }
    setTransactions((prev) => prev.map((item) => (item.id === id ? normalized : item)))
    return normalized
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    await financeiroService.deleteTransaction(id)
    setTransactions((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const snapshot = useMemo((): FinanceSnapshot => {
    const now = new Date()
    const receitaRealizadaMes = transactions
      .filter((tx) => tx.type === 'receita' && tx.status === 'pago' && isSameMonth(tx.paidDate || tx.dueDate, now))
      .reduce((acc, tx) => acc + tx.amount, 0)
    const despesaRealizadaMes = transactions
      .filter((tx) => tx.type === 'despesa' && tx.status === 'pago' && isSameMonth(tx.paidDate || tx.dueDate, now))
      .reduce((acc, tx) => acc + tx.amount, 0)

    const contasReceber = transactions
      .filter((tx) => tx.type === 'receita' && tx.status !== 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const contasPagar = transactions
      .filter((tx) => tx.type === 'despesa' && tx.status !== 'pago')
      .reduce((acc, tx) => acc + tx.amount, 0)

    const receitasAtrasadas = transactions
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
  }, [transactions])

  const cashflowSeries = useMemo((): CashflowPoint[] => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now)
      date.setMonth(now.getMonth() - (5 - index))
      return date
    })

    return months.map((monthDate) => {
      const key = formatMonthKey(monthDate)
      const receita = transactions
        .filter((tx) => tx.type === 'receita' && formatMonthKey(new Date(tx.paidDate || tx.dueDate)) === key)
        .reduce((acc, tx) => acc + tx.amount, 0)
      const despesa = transactions
        .filter((tx) => tx.type === 'despesa' && formatMonthKey(new Date(tx.paidDate || tx.dueDate)) === key)
        .reduce((acc, tx) => acc + tx.amount, 0)

      return {
        month: monthNames[monthDate.getMonth()],
        receita,
        despesa,
        saldo: receita - despesa,
      }
    })
  }, [transactions])

  const carteiraMetrics = useMemo(() => {
    const carteiraAtiva = casos.filter((caso) => caso.status === 'ativo').reduce((acc, caso) => acc + (caso.value || 0), 0)
    const contratosFechados = leads.filter((lead) => lead.status === 'ganho').length
    const ticketMedio = contratosFechados > 0
      ? Math.round(
          leads
            .filter((lead) => lead.status === 'ganho')
            .reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0) / contratosFechados,
        )
      : 0
    const pipeline = leads
      .filter((lead) => lead.status === 'qualificado' || lead.status === 'proposta')
      .reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0)

    return {
      carteiraAtiva,
      contratosFechados,
      ticketMedio,
      pipeline,
    }
  }, [casos, leads])

  const contasReceber = useMemo(
    () => transactions.filter((tx) => tx.type === 'receita' && tx.status !== 'pago'),
    [transactions],
  )
  const contasPagar = useMemo(
    () => transactions.filter((tx) => tx.type === 'despesa' && tx.status !== 'pago'),
    [transactions],
  )

  const carteiraPorResponsavel = useMemo(() => {
    const byUser = new Map<string, {
      id: string
      nome: string
      role: 'advogado' | 'gestor'
      receita: number
      despesa: number
      saldo: number
      pendenteReceber: number
      pendentePagar: number
    }>()

    const responsavelMap = new Map(responsaveis.map((item) => [item.id, item]))

    transactions.forEach((tx) => {
      const id = tx.responsavelUserId || 'sem_responsavel'
      const base = byUser.get(id) || {
        id,
        nome: tx.responsavelNome || responsavelMap.get(id)?.nome || 'Sem responsavel',
        role: tx.responsavelRole || responsavelMap.get(id)?.role || 'gestor',
        receita: 0,
        despesa: 0,
        saldo: 0,
        pendenteReceber: 0,
        pendentePagar: 0,
      }

      if (tx.type === 'receita') {
        base.receita += tx.amount
        if (tx.status !== 'pago') base.pendenteReceber += tx.amount
      } else {
        base.despesa += tx.amount
        if (tx.status !== 'pago') base.pendentePagar += tx.amount
      }

      base.saldo = base.receita - base.despesa
      byUser.set(id, base)
    })

    return [...byUser.values()].sort((a, b) => b.saldo - a.saldo)
  }, [responsaveis, transactions])

  return {
    transactions,
    responsaveis,
    carteiraPorResponsavel,
    loading,
    error,
    snapshot,
    cashflowSeries,
    carteiraMetrics,
    contasReceber,
    contasPagar,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
