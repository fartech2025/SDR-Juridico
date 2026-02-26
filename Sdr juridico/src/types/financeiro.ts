export type FinanceTransactionType = 'receita' | 'despesa'
export type FinanceTransactionStatus = 'previsto' | 'pago' | 'atrasado'

export interface FinanceTransaction {
  id: string
  type: FinanceTransactionType
  status: FinanceTransactionStatus
  category: string
  description: string
  amount: number
  dueDate: string
  paidDate?: string
  cliente?: string
  casoId?: string
  responsavelUserId?: string
  responsavelNome?: string
  responsavelRole?: 'advogado' | 'gestor'
  recurring?: boolean
  createdAt: string
  updatedAt: string
}

export interface FinanceCreateTransactionInput {
  type: FinanceTransactionType
  category: string
  description: string
  amount: number
  dueDate: string
  paidDate?: string
  cliente?: string
  casoId?: string
  responsavelUserId?: string
  recurring?: boolean
  recurrenceCount?: number
  recurrenceIntervalMonths?: number
}

export interface FinanceResponsavel {
  id: string
  nome: string
  role: 'advogado' | 'gestor'
}

export interface FinanceSnapshot {
  receitaRealizadaMes: number
  despesaRealizadaMes: number
  resultadoMes: number
  margemOperacional: number
  contasReceber: number
  contasPagar: number
  inadimplencia: number
  receitasAtrasadas: number
}

export interface CashflowPoint {
  month: string
  receita: number
  despesa: number
  saldo: number
}
