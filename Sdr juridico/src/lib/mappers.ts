import type {
  AgendamentoRow,
  CasoRow,
  ClienteRow,
  DocumentoRow,
  LeadRow,
  NotaRow,
} from '@/lib/supabaseClient'
import type {
  AgendaItem,
  Caso,
  Cliente,
  Documento,
  Lead,
  LeadHeat,
  LeadStatus,
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

const shortUserLabel = (value: string) => `Usuario ${value.slice(0, 8)}`

const leadStatusMap: Record<LeadRow['status'], LeadStatus> = {
  novo: 'novo',
  em_triagem: 'em_contato',
  qualificado: 'qualificado',
  nao_qualificado: 'perdido',
  convertido: 'ganho',
  perdido: 'perdido',
}

const resolveHeat = (row: LeadRow): LeadHeat => {
  if (row.qualificacao && typeof row.qualificacao === 'object') {
    const stored = (row.qualificacao as { heat?: string }).heat
    if (stored === 'quente' || stored === 'morno' || stored === 'frio') {
      return stored
    }
  }

  const base = row.last_contact_at || row.created_at
  if (!base) return 'morno'
  const diffMs = Date.now() - new Date(base).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 2) return 'quente'
  if (diffDays <= 7) return 'morno'
  return 'frio'
}

const resolveCaseStatus = (status: CasoRow['status']): Caso['status'] => {
  if (status === 'encerrado' || status === 'arquivado') return 'encerrado'
  return 'ativo'
}

const resolveCaseStage = (status: CasoRow['status']): Caso['stage'] => {
  if (status === 'triagem') return 'triagem'
  if (status === 'negociacao') return 'negociacao'
  if (status === 'contrato') return 'negociacao'
  if (status === 'andamento') return 'em_andamento'
  if (status === 'encerrado' || status === 'arquivado') return 'conclusao'
  return 'triagem'
}

const resolveCaseHeat = (prioridade: number): LeadHeat => {
  if (prioridade >= 3) return 'quente'
  if (prioridade === 2) return 'morno'
  return 'frio'
}

const resolveSlaRisk = (prioridade: number): Caso['slaRisk'] => {
  if (prioridade >= 3) return 'critico'
  if (prioridade === 2) return 'atencao'
  return 'ok'
}

const resolveDocStatus = (doc: DocumentoRow): Documento['status'] => {
  if (doc.meta && typeof doc.meta === 'object') {
    const status = (doc.meta as { status?: string }).status
    if (status === 'pendente' || status === 'aprovado' || status === 'rejeitado' || status === 'solicitado') {
      return status
    }
  }

  if (doc.visibility === 'cliente') return 'aprovado'
  if (doc.visibility === 'interno') return 'solicitado'
  return 'pendente'
}

const resolveDocType = (doc: DocumentoRow) => {
  if (doc.meta && typeof doc.meta === 'object') {
    const meta = doc.meta as { tipo?: string; type?: string }
    if (meta.tipo) return meta.tipo
    if (meta.type) return meta.type
  }

  if (doc.mime_type) {
    const [, subtype] = doc.mime_type.split('/')
    if (subtype) return subtype.toUpperCase()
  }

  return 'Documento'
}

const resolveDocUpdatedAt = (doc: DocumentoRow) => {
  if (doc.meta && typeof doc.meta === 'object') {
    const updated = (doc.meta as { updated_at?: string }).updated_at
    if (updated) return updated
  }
  return doc.created_at
}

const resolveAgendaStatus = (row: AgendamentoRow): AgendaItem['status'] => {
  if (row.meta && typeof row.meta === 'object') {
    const status = (row.meta as { status?: AgendaItem['status'] }).status
    if (status === 'confirmado' || status === 'pendente' || status === 'cancelado') {
      return status
    }
  }
  return 'confirmado'
}

const resolveTimelineCategory = (nota: NotaRow): TimelineCategory => {
  const tags = nota.tags || []
  const mapped = tags.find((tag) =>
    ['docs', 'agenda', 'comercial', 'juridico', 'automacao', 'humano'].includes(tag)
  ) as TimelineCategory | undefined
  if (mapped) return mapped
  if (nota.entidade === 'lead') return 'comercial'
  if (nota.entidade === 'conversa') return 'humano'
  if (nota.entidade === 'cliente') return 'comercial'
  return 'juridico'
}

export const mapLeadRowToLead = (row: LeadRow): Lead => ({
  id: row.id,
  name: row.nome || 'Sem nome',
  email: row.email || '',
  phone: row.telefone || '',
  area:
    row.assunto ||
    (row.qualificacao && typeof row.qualificacao === 'object'
      ? ((row.qualificacao as { area?: string }).area || 'Sem area')
      : 'Sem area'),
  origin: row.origem || row.canal || 'Outro',
  status: (() => {
    if (row.qualificacao && typeof row.qualificacao === 'object') {
      const stored = (row.qualificacao as { status?: LeadStatus }).status
      if (stored) return stored
    }
    return leadStatusMap[row.status] || 'novo'
  })(),
  heat: resolveHeat(row),
  createdAt: row.created_at,
  lastContactAt: row.last_contact_at || undefined,
  owner: row.assigned_user_id ? shortUserLabel(row.assigned_user_id) : 'Nao atribuido',
})

export const mapCasoRowToCaso = (row: CasoRow): Caso => ({
  id: row.id,
  title: row.titulo,
  cliente: row.cliente?.nome || 'Sem cliente',
  area: row.area || 'Geral',
  status: resolveCaseStatus(row.status),
  heat: resolveCaseHeat(row.prioridade),
  stage: resolveCaseStage(row.status),
  value: row.valor_estimado || 0,
  createdAt: row.created_at,
  updatedAt: row.encerrado_em || row.created_at,
  leadId: row.lead_id || undefined,
  tags: [],
  slaRisk: resolveSlaRisk(row.prioridade),
})

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
  owner: row.owner_user_id ? shortUserLabel(row.owner_user_id) : 'Nao atribuido',
  lastUpdate: data.lastUpdate,
})

export const mapDocumentoRowToDocumento = (row: DocumentoRow): Documento => ({
  id: row.id,
  title: row.title,
  cliente: row.cliente?.nome || 'Sem cliente',
  casoId: row.caso_id || undefined,
  type: resolveDocType(row),
  status: resolveDocStatus(row),
  createdAt: row.created_at,
  updatedAt: resolveDocUpdatedAt(row),
  requestedBy: row.uploaded_by ? shortUserLabel(row.uploaded_by) : 'Sistema',
  tags: row.tags || [],
})

export const mapAgendamentoRowToAgendaItem = (row: AgendamentoRow): AgendaItem => {
  const startAt = new Date(row.start_at)
  const endAt = new Date(row.end_at)
  const durationMinutes = Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000))

  return {
    id: row.id,
    title: row.title,
    type:
      (row.meta && typeof row.meta === 'object'
        ? (row.meta as { tipo?: string }).tipo
        : null) || 'Compromisso',
    date: toLocalDate(row.start_at),
    time: toLocalTime(row.start_at),
    durationMinutes: durationMinutes || 30,
    cliente: row.cliente?.nome || 'Sem cliente',
    casoId: row.caso_id || undefined,
    owner: row.owner_user_id ? shortUserLabel(row.owner_user_id) : 'Nao atribuido',
    location: row.location || 'Indefinido',
    status: resolveAgendaStatus(row),
  }
}

export const mapNotaRowToTimelineEvent = (row: NotaRow): TimelineEvent => {
  const title = row.texto.split('. ')[0] || row.texto
  return {
    id: row.id,
    casoId: row.entidade_id,
    title,
    category: resolveTimelineCategory(row),
    channel: 'Sistema',
    date: row.created_at,
    description: row.texto,
    tags: row.tags || [],
    author: row.created_by ? shortUserLabel(row.created_by) : 'Sistema',
  }
}
