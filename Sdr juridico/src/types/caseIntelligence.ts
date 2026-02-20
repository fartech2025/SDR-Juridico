// Tipos compartilhados para a feature "Waze Jurídico"

export interface ScraperProcesso {
  numero_processo: string
  tribunal: string
  classe?: string
  assunto?: string
  data_ajuizamento?: string
  ultima_atualizacao?: string
  valor_causa?: number
  partes?: Array<{ nome: string; polo: 'ativo' | 'passivo' | 'outro' }>
  movimentos?: Array<{ data: string; descricao: string }>
  grau?: string
  fonte: string
}

export interface CaseInsightOptions {
  useInternal: boolean
  useDataJud: boolean
  useQueridoDiario: boolean
  useTransparencia: boolean
  useScraper: boolean
}

export type DataSourceStatus = {
  id: string
  label: string
  status: 'ok' | 'sem_chave' | 'offline' | 'erro' | 'desativado'
  count: number
  erro?: string
}

export interface SancaoCEIS {
  tipo: string
  orgao: string
  periodo: string
  fundamentacao?: string
}

export interface CaseInsight {
  // Contagens
  processos_datajud: number
  processos_scraper: number
  publicacoes_dou: number
  similares_internos: number

  // Perfil jurídico
  area_predominante: string
  classes_frequentes: string[]
  tribunais_frequentes: string[]
  valor_medio_causa: number | null
  duracao_media_meses: number | null

  // Risco e prognóstico
  nivel_risco: 'baixo' | 'medio' | 'alto'
  taxa_sucesso_estimada: number   // 0.0-1.0

  // Perfil público (Portal Transparência)
  is_servidor_federal: boolean
  has_sancao_ceis: boolean
  has_expulsao_ceaf: boolean
  sancoes: SancaoCEIS[]

  // IA
  narrativa: string
  alertas: string[]
  recomendacao: string

  // Metadados
  fontes: DataSourceStatus[]
  cached: boolean
  generated_at: string
}
