import type {
  AgendaRow,
  CasoRow,
  ClienteRow,
  DocumentoRow,
  LeadRow,
  TarefaRow,
  TimelineEventRow,
} from '@/lib/supabaseClient'
import type {
  AgendaItem,
  Caso,
  Cliente,
  Documento,
  Lead,
  LeadHeat,
  Tarefa,
  TimelineCategory,
  TimelineEvent,
} from '@/types/domain'

const pad = (value: number) => value.toString().padStart(2, '0')

const toLocalDate = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const toLocalTime = (value: string) => {
  const date = new Date(value)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const resolveHeat = (row: LeadRow): LeadHeat => {
  if (row.heat) return row.heat
  const base = row.ultimo_contato || row.created_at
  if (!base) return 'morno'
  const diffMs = Date.now() - new Date(base).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 2) return 'quente'
  if (diffDays <= 7) return 'morno'
  return 'frio'
}

const resolveCaseStatus = (status: CasoRow['status']): Caso['status'] => {
  if (status === 'encerrado') return 'encerrado'
  if (status === 'suspenso') return 'suspenso'
  return 'ativo'
}

const resolveDocType = (doc: DocumentoRow) => {
  return doc.tipo || 'DOCUMENTO'
}

const resolveTimelineCategory = (event: TimelineEventRow): TimelineCategory => {
  const tags = event.tags || []
  const mapped = tags.find((tag) =>
    ['docs', 'agenda', 'comercial', 'juridico', 'automacao', 'humano'].includes(tag)
  ) as TimelineCategory | undefined
  if (mapped) return mapped
  if (event.categoria) return event.categoria
  return 'juridico'
}

const resolveTaskPriority = (priority: TarefaRow['priority']): Tarefa['priority'] => {
  if (priority === 1) return 'baixa'
  if (priority === 3) return 'alta'
  return 'normal'
}

const resolveTaskLinks = (row: TarefaRow) => {
  const entidadeId = row.entidade_id || null
  if (row.entidade === 'lead') {
    return { leadId: entidadeId, clienteId: null, casoId: null }
  }
  if (row.entidade === 'cliente') {
    return { leadId: null, clienteId: entidadeId, casoId: null }
  }
  if (row.entidade === 'caso') {
    return { leadId: null, clienteId: null, casoId: entidadeId }
  }
  return { leadId: null, clienteId: null, casoId: null }
}

export const mapLeadRowToLead = (row: LeadRow): Lead => ({
  id: row.id,
  name: row.nome,
  email: row.email,
  phone: row.telefone || '',
  area: row.area || 'Sem area',
  origin: row.origem || row.empresa || 'Outro',
  status: row.status,
  heat: resolveHeat(row),
  createdAt: row.created_at,
  lastContactAt: row.ultimo_contato || undefined,
  owner: row.responsavel || 'Nao atribuido',
})

export const mapCasoRowToCaso = (row: CasoRow): Caso => {
  return {
    id: row.id,
    title: row.titulo,
    cliente: row.cliente?.nome || 'Sem cliente',
    area: row.area || 'Geral',
    status: resolveCaseStatus(row.status),
    heat: row.heat || 'morno',
    stage: row.stage || 'triagem',
    value: row.valor || 0,
    createdAt: row.created_at,
    updatedAt: row.data_encerramento || row.updated_at,
    leadId: row.lead_id || undefined,
    tags: row.tags || [],
    slaRisk: row.sla_risk || 'ok',
  }
}

export const mapClienteRowToCliente = (
  row: ClienteRow,
  data: {
    caseCount: number
    area: string
    status: Cliente['status']
    health: Cliente['health']
    lastUpdate: string
  }
): Cliente => ({
  id: row.id,
  name: row.nome,
  area: data.area,
  status: data.status,
  health: data.health,
  caseCount: data.caseCount,
  owner: row.responsavel || 'Nao atribuido',
  lastUpdate: data.lastUpdate,
})

export const mapDocumentoRowToDocumento = (row: DocumentoRow): Documento => ({
  id: row.id,
  title: row.titulo,
  cliente: row.cliente_nome || 'Sem cliente',
  casoId: row.caso_id || undefined,
  type: resolveDocType(row),
  status: row.status || 'pendente',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  requestedBy: row.solicitado_por || 'Sistema',
  tags: row.tags || [],
})

export const mapAgendamentoRowToAgendaItem = (row: AgendaRow): AgendaItem => {
  const startAt = new Date(row.data_inicio)
  const endAt = new Date(row.data_fim)
  const durationMinutes = Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000))

  return {
    id: row.id,
    title: row.titulo,
    type: row.tipo || 'Compromisso',
    tipo: row.tipo || 'Compromisso',
    date: toLocalDate(row.data_inicio),
    time: toLocalTime(row.data_inicio),
    durationMinutes: durationMinutes || 30,
    cliente: row.cliente_nome || 'Sem cliente',
    casoId: row.caso_id || undefined,
    owner: row.responsavel || 'Nao atribuido',
    location: row.local || 'Indefinido',
    status: row.status || 'pendente',
  }
}

export const mapTarefaRowToTarefa = (row: TarefaRow): Tarefa => ({
  id: row.id,
  title: row.titulo,
  description: row.descricao || null,
  priority: resolveTaskPriority(row.priority),
  status: row.status || 'pendente',
  dueDate: row.due_at || null,
  createdAt: row.created_at,
  completedAt: row.completed_at || null,
  ownerId: row.assigned_user_id,
  submittedAt: (row as any).submitted_at || null,
  confirmedAt: (row as any).confirmed_at || null,
  confirmedBy: (row as any).confirmed_by || null,
  rejectedReason: (row as any).rejected_reason || null,
  submittedAt: (row as any).submitted_at || null,
  confirmedAt: (row as any).confirmed_at || null,
  confirmedBy: (row as any).confirmed_by || null,
  rejectedReason: (row as any).rejected_reason || null,
  ...resolveTaskLinks(row),
})

export const mapTimelineRowToTimelineEvent = (row: TimelineEventRow): TimelineEvent => {
  const title = row.titulo || row.descricao || 'Evento'
  return {
    id: row.id,
    casoId: row.caso_id,
    title,
    category: resolveTimelineCategory(row),
    channel: row.canal || 'Sistema',
    date: row.data_evento || row.created_at,
    description: row.descricao || '',
    tags: row.tags || [],
    author: row.autor || 'Sistema',
  }
}
