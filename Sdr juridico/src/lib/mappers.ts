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
  DataJudSyncStatus,
  Documento,
  Lead,
  LeadHeat,
  Tarefa,
  TimelineCategory,
  TimelineEvent,
  CasoStage,
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
  if (row.heat && ['quente', 'morno', 'frio'].includes(row.heat)) return row.heat as LeadHeat
  // Usa o campo correto: last_contact_at (ou legado ultimo_contato)
  const base = row.last_contact_at || row.ultimo_contato || row.created_at
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
  name: row.nome || 'Sem nome',
  email: row.email || '',
  phone: row.telefone || '',
  area: row.area || 'Sem area',
  origin: row.origem || 'Outro',
  status: row.status,
  heat: resolveHeat(row),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastContactAt: row.last_contact_at || row.ultimo_contato || undefined,
  owner: row.assigned_user_id || row.responsavel || 'Nao atribuido',
  company: row.empresa || undefined,
  notes: row.observacoes || undefined,
})

export const mapCasoRowToCaso = (row: CasoRow): Caso => {
  // Resolve heat com validação
  const resolvedHeat: LeadHeat = (row.heat && ['quente', 'morno', 'frio'].includes(row.heat)) 
    ? row.heat as LeadHeat 
    : 'morno'
  
  // Resolve stage - usa fase_atual ou stage
  const resolvedStage: CasoStage = (row.stage || row.fase_atual || 'triagem') as CasoStage
  
  return {
    id: row.id,
    title: row.titulo,
    cliente: row.cliente?.nome || 'Sem cliente',
    area: row.area || 'Geral',
    status: resolveCaseStatus(row.status),
    heat: resolvedHeat,
    stage: resolvedStage,
    value: row.valor_estimado ?? row.valor ?? 0,
    createdAt: row.created_at,
    updatedAt: row.encerrado_em || row.data_encerramento || row.updated_at || row.created_at,
    leadId: row.lead_id || undefined,
    tags: row.tags || [],
    slaRisk: (row.sla_risk as Caso['slaRisk']) || 'ok',
    prioridade: (row.prioridade as Caso['prioridade']) || undefined,
    responsavel: row.responsavel || undefined,
    // DataJud fields
    numero_processo: row.numero_processo || undefined,
    tribunal: row.tribunal || undefined,
    grau: row.grau || undefined,
    classe_processual: row.classe_processual || undefined,
    assunto_principal: row.assunto_principal || undefined,
    datajud_processo_id: row.datajud_processo_id || undefined,
    datajud_sync_status: (row.datajud_sync_status as DataJudSyncStatus) || undefined,
    datajud_last_sync_at: row.datajud_last_sync_at || undefined,
    datajud_sync_error: row.datajud_sync_error || undefined,
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
  description: row.descricao || undefined,
  cliente: row.cliente?.nome || row.cliente_nome || 'Sem cliente',
  clienteId: row.cliente_id || undefined,
  casoId: row.caso_id || undefined,
  casoTitulo: row.caso?.titulo || undefined,
  leadId: row.lead_id || undefined,
  leadNome: row.lead?.nome || undefined,
  type: resolveDocType(row),
  status: row.status || 'pendente',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  requestedBy: row.solicitado_por || 'Sistema',
  tags: row.tags || [],
  url: row.url || undefined,
  fileName: row.arquivo_nome || undefined,
  fileSize: row.arquivo_tamanho || undefined,
  mimeType: row.mime_type || undefined,
  deletedAt: row.deleted_at || undefined,
  deletedBy: row.deleted_by || undefined,
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
    leadId: row.lead_id || undefined,
    owner: row.responsavel || row.owner_user_id || 'Nao atribuido',
    location: row.local || 'Indefinido',
    status: row.status || 'pendente',
    externalEventId: row.external_event_id || undefined,
    externalProvider: row.external_provider || undefined,
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
  // Soft delete fields
  deletedAt: row.deleted_at || null,
  deletedBy: row.deleted_by || null,
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
