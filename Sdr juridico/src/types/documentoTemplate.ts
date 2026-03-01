// =====================================================================
// TYPES: Templates de Documentos + Branding
// =====================================================================

export type TemplateCategoria =
  | 'contrato'
  | 'peticao'
  | 'procuracao'
  | 'declaracao'
  | 'notificacao'
  | 'outro'

export const TEMPLATE_CATEGORIA_LABELS: Record<TemplateCategoria, string> = {
  contrato:     'Contrato',
  peticao:      'Petição',
  procuracao:   'Procuração',
  declaracao:   'Declaração',
  notificacao:  'Notificação',
  outro:        'Outro',
}

export type VariavelTipo = 'texto' | 'data' | 'cpf' | 'cnpj' | 'moeda' | 'select'

export const VARIAVEL_TIPO_LABELS: Record<VariavelTipo, string> = {
  texto:  'Texto',
  data:   'Data',
  cpf:    'CPF',
  cnpj:   'CNPJ',
  moeda:  'Moeda',
  select: 'Lista',
}

export interface TemplateVariavel {
  key: string           // ex: 'nome_cliente'  — usado em {nome_cliente} no conteúdo
  label: string         // ex: 'Nome do Cliente' — exibido no formulário de geração
  required: boolean
  tipo?: VariavelTipo   // default 'texto' quando ausente
  defaultValue?: string // tokens: '$hoje', '$responsavel', '$org', '$advogado'
  options?: string[]    // opções quando tipo='select'
  placeholder?: string
  hint?: string
}

export interface DocumentoTemplate {
  id: string
  orgId: string
  titulo: string
  categoria: TemplateCategoria
  conteudo: string            // HTML gerado pelo TipTap (armazenado como TEXT)
  variaveis: TemplateVariavel[]
  criadoPor?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DocumentoTemplateCreateInput {
  titulo: string
  categoria: TemplateCategoria
  conteudo: string
  variaveis: TemplateVariavel[]
}

export interface DocumentoTemplateUpdateInput {
  titulo?: string
  categoria?: TemplateCategoria
  conteudo?: string
  variaveis?: TemplateVariavel[]
}

// ── Branding ──────────────────────────────────────────────────────────────────
export interface OrgBranding {
  id?: string
  orgId?: string
  logoUrl?: string
  corPrimaria: string
  corSecundaria: string
  nomeDisplay?: string
  oabRegistro?: string
  endereco?: string
  telefone?: string
  rodapeTexto?: string
  marcaDagua?: string   // ex: 'RASCUNHO', 'CONFIDENCIAL'; vazio = desativado
}

export const DEFAULT_BRANDING: OrgBranding = {
  corPrimaria:   '#721011',
  corSecundaria: '#BF6F32',
}
