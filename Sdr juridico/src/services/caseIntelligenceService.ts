// "Waze Jurídico" — Orquestrador de inteligência preditiva de casos
// Agrega dados de múltiplas fontes públicas e usa Claude para análise
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabaseClient'
import { resolveOrgScope } from '@/services/orgScope'
import { buscarProcessosPorCpfMultiTribunal } from '@/services/datajudService'
import { buscarDiariosOficiais } from '@/services/queridoDiarioService'
import { buscarPorCpf as scraperBuscarPorCpf } from '@/services/localScraperService'
import { consultarTudo as transparenciaConsultarTudo, isConfigurado as isTransparenciaConfigurada } from '@/services/portalTransparenciaService'
import { verificarStatus as verificarScraper } from '@/services/localScraperService'
import type { CaseInsight, CaseInsightOptions, DataSourceStatus } from '@/types/caseIntelligence'

// Cache localStorage — TTL 24h
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function buildCacheKey(orgId: string, cpf: string, opts: CaseInsightOptions): string {
  const cpfLimpo = cpf.replace(/\D/g, '')
  const optsStr = `${+opts.useInternal}${+opts.useDataJud}${+opts.useQueridoDiario}${+opts.useTransparencia}${+opts.useScraper}`
  return `ci_${orgId}_${cpfLimpo}_${optsStr}`
}

function getFromCache(key: string): CaseInsight | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { insight, expires_at } = JSON.parse(raw)
    if (Date.now() > expires_at) {
      localStorage.removeItem(key)
      return null
    }
    return { ...insight, cached: true }
  } catch {
    return null
  }
}

function saveToCache(key: string, insight: CaseInsight): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      insight,
      expires_at: Date.now() + CACHE_TTL_MS,
    }))
  } catch {
    // Ignora se localStorage estiver cheio
  }
}

function invalidateCache(key: string): void {
  localStorage.removeItem(key)
}

/** Busca casos internos da org para benchmarking */
async function buscarCasosInternos(orgId: string) {
  const { data } = await supabase
    .from('casos')
    .select('area, valor_estimado, status, assunto_principal, classe_processual, created_at, encerrado_em')
    .eq('org_id', orgId)
    .limit(300)
  return data ?? []
}

/** Monta o prompt para Claude com todos os dados coletados */
function buildPrompt(cpf: string, dados: {
  processosDataJud: any[]
  processosScraper: any[]
  publicacoesDOU: any[]
  ceis: any[]
  ceaf: any[]
  servidores: any[]
  casosInternos: any[]
}): string {
  const cpfMasked = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')

  const processosResumo = [
    ...dados.processosDataJud.slice(0, 20),
    ...dados.processosScraper.slice(0, 20),
  ].map(p => ({
    numero: p.numeroProcesso ?? p.numero_processo,
    classe: typeof p.classe === 'object' ? p.classe?.nome : (p.classe ?? ''),
    assunto: p.assunto ?? '',
    tribunal: p.tribunal ?? '',
    valor: p.valorCausa ?? p.valor_causa ?? null,
    data_ajuizamento: p.dataAjuizamento ?? p.data_ajuizamento ?? '',
    fonte: p.fonte ?? 'datajud',
  }))

  const ceisResumo = dados.ceis.map(s => ({
    tipo: s.tipoSancao ?? '',
    orgao: s.orgaoSancionador ?? '',
    inicio: s.dataInicioSancao ?? '',
    fim: s.dataFimSancao ?? '',
  }))

  const internos = dados.casosInternos.map(c => ({
    area: c.area,
    status: c.status,
    valor: c.valor_estimado,
    assunto: c.assunto_principal,
    duracao_dias: c.encerrado_em
      ? Math.round((new Date(c.encerrado_em).getTime() - new Date(c.created_at).getTime()) / 86_400_000)
      : null,
  }))

  return `Você é um analista jurídico especializado em processos brasileiros. Analise os dados abaixo e retorne APENAS um objeto JSON válido (sem markdown, sem texto extra).

CPF analisado: ${cpfMasked}

PROCESSOS JUDICIAIS ENCONTRADOS (${processosResumo.length} processos):
${JSON.stringify(processosResumo.slice(0, 30), null, 2)}

SANÇÕES CEIS (lista negra governo): ${ceisResumo.length > 0 ? JSON.stringify(ceisResumo) : 'Nenhuma sanção encontrada'}
EXPULSÕES CEAF: ${dados.ceaf.length > 0 ? `${dados.ceaf.length} expulsão(ões) da administração federal` : 'Nenhuma expulsão'}
SERVIDOR FEDERAL: ${dados.servidores.length > 0 ? `Sim — ${dados.servidores[0]?.cargo ?? ''} em ${dados.servidores[0]?.orgao ?? ''}` : 'Não é servidor federal ativo'}
MENÇÕES EM DIÁRIOS OFICIAIS: ${dados.publicacoesDOU.length} publicações encontradas
CASOS SIMILARES NA BASE INTERNA: ${internos.length} casos (mesma área/assunto)

Retorne SOMENTE este JSON (sem nenhum texto adicional):
{
  "area_predominante": "<área do direito mais comum nos processos>",
  "classes_frequentes": ["<classe1>", "<classe2>"],
  "tribunais_frequentes": ["<tribunal1>", "<tribunal2>"],
  "valor_medio_causa": <número em reais ou null>,
  "duracao_media_meses": <estimativa em meses ou null>,
  "nivel_risco": "<baixo|medio|alto>",
  "taxa_sucesso_estimada": <número entre 0.0 e 1.0>,
  "narrativa": "<2-3 frases em português descrevendo o perfil jurídico completo deste CPF>",
  "alertas": ["<ponto de atenção 1>", "<ponto de atenção 2>"],
  "recomendacao": "<próximo passo recomendado para o advogado em 1 frase>"
}`
}

/** Analisa um CPF e retorna insight jurídico completo */
export async function getInsight(
  cpf: string,
  opts: CaseInsightOptions,
  forceRefresh = false
): Promise<CaseInsight> {
  const { orgId } = await resolveOrgScope()
  const cacheKey = buildCacheKey(orgId, cpf, opts)

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey)
    if (cached) return cached
  } else {
    invalidateCache(cacheKey)
  }

  // === Fase 1: Coletar dados em paralelo ===
  const scraperStatus = opts.useScraper ? await verificarScraper() : null

  const [
    datajudResult,
    scraperResult,
    douResult,
    transparenciaResult,
    internosResult,
  ] = await Promise.allSettled([
    opts.useDataJud
      ? buscarProcessosPorCpfMultiTribunal(cpf)
      : Promise.resolve({ processos: [], total: 0, tribunaisConsultados: [], erros: [] }),

    opts.useScraper && scraperStatus?.online
      ? scraperBuscarPorCpf(cpf)
      : Promise.resolve({ processos: [], total: 0, gerado_em: '' }),

    opts.useQueridoDiario
      ? buscarDiariosOficiais(cpf.replace(/\D/g, ''), { size: 20 })
      : Promise.resolve(null),

    opts.useTransparencia && isTransparenciaConfigurada()
      ? transparenciaConsultarTudo(cpf)
      : Promise.resolve({ ceis: [], ceaf: [], servidores: [] }),

    opts.useInternal
      ? buscarCasosInternos(orgId)
      : Promise.resolve([]),
  ])

  const processosDataJud = datajudResult.status === 'fulfilled'
    ? (datajudResult.value.processos ?? [])
    : []

  const processosScraper = scraperResult.status === 'fulfilled'
    ? (scraperResult.value.processos ?? [])
    : []

  const publicacoesDOU = douResult.status === 'fulfilled' && douResult.value
    ? (douResult.value.gazettes ?? [])
    : []

  const transparencia = transparenciaResult.status === 'fulfilled'
    ? transparenciaResult.value
    : { ceis: [], ceaf: [], servidores: [] }

  const casosInternos = internosResult.status === 'fulfilled'
    ? internosResult.value
    : []

  // === Fase 2: Chamar Claude API ===
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY não configurada em .env.local')

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: buildPrompt(cpf, {
        processosDataJud,
        processosScraper,
        publicacoesDOU,
        ceis: transparencia.ceis,
        ceaf: transparencia.ceaf,
        servidores: transparencia.servidores,
        casosInternos,
      }),
    }],
  })

  const text = (message.content[0] as any).text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude não retornou JSON válido')

  const aiData = JSON.parse(jsonMatch[0])

  // === Fase 3: Montar status de fontes ===
  const fontes: DataSourceStatus[] = [
    {
      id: 'datajud',
      label: 'DataJud (CNJ)',
      status: opts.useDataJud ? (processosDataJud.length > 0 ? 'ok' : 'ok') : 'desativado',
      count: processosDataJud.length,
    },
    {
      id: 'scraper',
      label: 'Scraper Local',
      status: opts.useScraper
        ? (scraperStatus?.online ? 'ok' : 'offline')
        : 'desativado',
      count: processosScraper.length,
    },
    {
      id: 'dou',
      label: 'Diário Oficial',
      status: opts.useQueridoDiario ? 'ok' : 'desativado',
      count: publicacoesDOU.length,
    },
    {
      id: 'transparencia',
      label: 'Portal Transparência',
      status: opts.useTransparencia
        ? (isTransparenciaConfigurada() ? 'ok' : 'sem_chave')
        : 'desativado',
      count: transparencia.ceis.length + transparencia.ceaf.length + transparencia.servidores.length,
    },
    {
      id: 'interno',
      label: 'Casos Internos',
      status: opts.useInternal ? 'ok' : 'desativado',
      count: casosInternos.length,
    },
  ]

  // === Fase 4: Montar insight final ===
  const insight: CaseInsight = {
    processos_datajud: processosDataJud.length,
    processos_scraper: processosScraper.length,
    publicacoes_dou: publicacoesDOU.length,
    similares_internos: casosInternos.length,

    area_predominante: aiData.area_predominante ?? '',
    classes_frequentes: aiData.classes_frequentes ?? [],
    tribunais_frequentes: aiData.tribunais_frequentes ?? [],
    valor_medio_causa: aiData.valor_medio_causa ?? null,
    duracao_media_meses: aiData.duracao_media_meses ?? null,

    nivel_risco: aiData.nivel_risco ?? 'medio',
    taxa_sucesso_estimada: aiData.taxa_sucesso_estimada ?? 0.5,

    is_servidor_federal: transparencia.servidores.length > 0,
    has_sancao_ceis: transparencia.ceis.length > 0,
    has_expulsao_ceaf: transparencia.ceaf.length > 0,
    sancoes: transparencia.ceis.map(s => ({
      tipo: s.tipoSancao ?? '',
      orgao: s.orgaoSancionador ?? '',
      periodo: `${s.dataInicioSancao ?? ''} → ${s.dataFimSancao ?? 'indeterminado'}`,
      fundamentacao: s.fundamentacaoLegal,
    })),

    narrativa: aiData.narrativa ?? '',
    alertas: aiData.alertas ?? [],
    recomendacao: aiData.recomendacao ?? '',

    fontes,
    cached: false,
    generated_at: new Date().toISOString(),
  }

  saveToCache(cacheKey, insight)
  return insight
}

/** Opções padrão para análise */
export const DEFAULT_OPTIONS: CaseInsightOptions = {
  useInternal: true,
  useDataJud: true,
  useQueridoDiario: true,
  useTransparencia: true,
  useScraper: true,
}
