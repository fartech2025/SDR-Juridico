// =====================================================================
// TYPES: Timesheet / Honorários por Hora
// =====================================================================

export type TimesheetTipo = 'billable' | 'non_billable'
export type TimesheetStatus = 'rascunho' | 'aprovado' | 'faturado'

export interface TimesheetEntry {
  id: string
  orgId: string
  responsavelUserId: string
  responsavelNome?: string
  responsavelRole?: string
  casoId?: string
  casoTitulo?: string
  data: string              // YYYY-MM-DD
  horas: number
  descricao: string
  taxaHoraria: number
  valorTotal: number        // GENERATED ALWAYS AS (horas * taxa_horaria) no DB
  tipo: TimesheetTipo
  status: TimesheetStatus
  lancamentoId?: string     // FK para financeiro_lancamentos após faturamento
  createdAt: string
  updatedAt: string
}

export interface TimesheetCreateInput {
  casoId?: string
  data: string
  horas: number
  descricao: string
  taxaHoraria: number
  tipo: TimesheetTipo
  responsavelUserId: string
}

export interface TimesheetUpdateInput {
  data?: string
  horas?: number
  descricao?: string
  taxaHoraria?: number
  tipo?: TimesheetTipo
}

// KPIs calculados pelo hook via useMemo
export interface TimesheetSnapshot {
  horasNoMes: number
  valorBillableMes: number
  valorNaoBillableMes: number
  horasAFaturar: number   // soma de horas com status='aprovado' e tipo='billable'
  valorAFaturar: number   // soma de valor_total com status='aprovado' e tipo='billable'
  entradasRascunho: number
  horasPorAdvogado: { userId: string; nome: string; horas: number; valor: number }[]
  entradasPorCaso: { casoId: string; casoTitulo: string; horas: number; valor: number }[]
}

// Resultado de faturarPeriodo()
export interface FaturamentoResult {
  lancamentosIds: string[]
  totalFaturado: number
  entradasFaturadas: number
}
