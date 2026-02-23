// "Waze Jurídico" — Orquestrador de inteligência preditiva de casos
// Agrega dados de múltiplas fontes públicas e usa Claude para análise
import { supabase } from '@/lib/supabaseClient'
import { resolveOrgScope } from '@/services/orgScope'
import { buscarProcessosPorCpfMultiTribunal } from '@/services/datajudService'
import { buscarDiariosOficiais, buscarDiariosOficiaisCpf, extrairNumerosProcesso } from '@/services/queridoDiarioService'
import { buscarPorCpf as scraperBuscarPorCpf, buscarProcessoMNI, verificarStatus as verificarScraper } from '@/services/localScraperService'
import { consultarTudo as transparenciaConsultarTudo, isConfigurado as isTransparenciaConfigurada } from '@/services/portalTransparenciaService'
import type { CaseInsight, CaseInsightOptions, DataSourceStatus } from '@/types/caseIntelligence'

/** Extrai nome da pessoa a partir dos dados já coletados */
function extrairNome(
  transparencia: { servidores: any[]; ceis: any[]; ceaf: any[] },
  processosScraper: any[],
  processosDataJud: any[],
): string | null {
  // Portal Transparência — fonte mais confiável
  if (transparencia.servidores.length > 0) return transparencia.servidores[0].nome ?? null
  if (transparencia.ceis.length > 0) return transparencia.ceis[0].nomeRazaoSocial ?? null
  if (transparencia.ceaf.length > 0) return transparencia.ceaf[0].nome ?? null

  // DataJud via scraper (partes[].nome)
  for (const p of processosScraper) {
    const n = p.partes?.[0]?.nome?.trim()
    if (n && n.length > 3) return n
  }

  // DataJud via Edge Function (dadosBasicos.polo[].nome)
  for (const p of processosDataJud) {
    const n = p.dadosBasicos?.polo?.[0]?.nome?.trim()
    if (n && n.length > 3) return n
  }

  return null
}

/** Busca processos por nome via scraper-server /nome (DataJud partes.nome) */
async function buscarPorNome(nome: string): Promise<any[]> {
  try {
    const res = await fetch('/scraper-api/nome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.processos ?? []
  } catch {
    return []
  }
}

/**
 * Para cada número de processo extraído do DOU, tenta MNI (PJe) primeiro quando disponível,
 * depois DataJud como fallback. MNI retorna partes com nomes; DataJud só metadados.
 */
async function buscarProcessosPorNumerosDOU(
  numerosProcesso: string[],
  opts: { useMni: boolean } = { useMni: false },
): Promise<any[]> {
  if (numerosProcesso.length === 0) return []

  const resultados: any[] = []
  // Limita a 8 processos para não sobrecarregar
  const numerosUnicos = [...new Set(numerosProcesso)].slice(0, 8)

  await Promise.allSettled(
    numerosUnicos.map(async (numero) => {
      try {
        // Tenta MNI primeiro (retorna partes com nomes — campo não disponível no DataJud público)
        if (opts.useMni) {
          const mniProcesso = await buscarProcessoMNI(numero)
          if (mniProcesso) {
            resultados.push(mniProcesso)
            return
          }
        }

        // Fallback: DataJud (busca pública, sem partes)
        const res = await fetch('/scraper-api/processo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero }),
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.processo) resultados.push(data.processo)
      } catch {
        // processo não encontrado — continua
      }
    })
  )

  return resultados
}

/** Busca publicações no DOU federal (Imprensa Nacional) por CPF ou nome */
async function buscarDOUFederal(
  query: string,
  opts: { size?: number } = {}
): Promise<{ titulo: string; tipo: string; data: string; secao: string; hierarquia: string; resumo: string; url: string }[]> {
  try {
    const res = await fetch('/scraper-api/dou', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `"${query}"`, size: opts.size ?? 20 }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.resultados ?? []
  } catch {
    return []
  }
}

/** Busca nome do CPF via scraper-server /enrich (DataJud + cpfcnpj.com.br) */
async function enrichCpf(cpf: string): Promise<string | null> {
  try {
    const res = await fetch('/scraper-api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.nome ?? null
  } catch {
    return null
  }
}

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
function buildPrompt(cpf: string, nome: string | null, dados: {
  processosDataJud: any[]
  processosScraper: any[]
  publicacoesDOU: any[]
  ceis: any[]
  ceaf: any[]
  servidores: any[]
  casosInternos: any[]
}): string {
  const cpfMasked = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
  const identificacao = nome ? `Nome: ${nome} | CPF: ${cpfMasked}` : `CPF: ${cpfMasked}`

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

Parte analisada: ${identificacao}

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

  // CPF formatado para busca no DOU federal (ex: 129.001.406-09)
  const cpfFormatadoDOU = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  const [
    datajudResult,
    scraperResult,
    douQueridoResult,
    douFederalResult,
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
      ? buscarDiariosOficiaisCpf(cpf, { size: 20 })
      : Promise.resolve(null),

    // DOU federal (Imprensa Nacional) — scrapa HTML, não precisa de Querido Diário
    opts.useQueridoDiario && opts.useScraper && scraperStatus?.online
      ? buscarDOUFederal(cpfFormatadoDOU, { size: 20 })
      : Promise.resolve([]),

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

  let processosScraper = scraperResult.status === 'fulfilled'
    ? (scraperResult.value.processos ?? [])
    : []

  const publicacoesDOU = douQueridoResult.status === 'fulfilled' && douQueridoResult.value
    ? (douQueridoResult.value.gazettes ?? [])
    : []

  // DOU federal (Imprensa Nacional) — resultados com campo resumo em vez de excerpts
  const publicacoesDouFederal = douFederalResult.status === 'fulfilled'
    ? (douFederalResult.value ?? [])
    : []

  const transparencia = transparenciaResult.status === 'fulfilled'
    ? transparenciaResult.value
    : { ceis: [], ceaf: [], servidores: [] }

  const casosInternos = internosResult.status === 'fulfilled'
    ? internosResult.value
    : []

  // === Fase 2: Enriquecimento — CPF → nome → busca por nome ===
  // Extrai nome de qualquer fonte já coletada na Fase 1
  let nomeEncontrado = extrairNome(transparencia, processosScraper, processosDataJud)

  // Se nenhuma fonte da Fase 1 retornou nome, tenta o enriquecimento ativo
  if (!nomeEncontrado && opts.useScraper && scraperStatus?.online) {
    nomeEncontrado = await enrichCpf(cpf)
  }

  // Se encontrou nome, busca por nome em paralelo: DataJud + DOU federal
  if (nomeEncontrado) {
    const fase2Tasks: Promise<any>[] = []

    if (opts.useDataJud) {
      fase2Tasks.push(buscarPorNome(nomeEncontrado).then(processosPorNome => {
        // Mescla evitando duplicatas por número de processo
        const numerosExistentes = new Set(
          processosScraper.map((p: any) => p.numero_processo?.replace(/\D/g, ''))
        )
        const novos = processosPorNome.filter(
          (p: any) => !numerosExistentes.has(p.numero_processo?.replace(/\D/g, ''))
        )
        processosScraper = [...processosScraper, ...novos]
      }).catch(() => {}))
    }

    // Busca nome também no DOU federal
    if (opts.useQueridoDiario && opts.useScraper && scraperStatus?.online) {
      fase2Tasks.push(buscarDOUFederal(nomeEncontrado, { size: 15 }).then(resultados => {
        publicacoesDouFederal.push(...resultados)
      }).catch(() => {}))
    }

    await Promise.allSettled(fase2Tasks)
  }

  // === Fase 3: Extração de processos do DOU (Querido Diário + DOU federal) ===
  // Aplica regex CNJ nos textos do DOU para encontrar números de processo
  // e consulta o DataJud por número (busca que funciona mesmo sem partes indexadas)
  if (opts.useQueridoDiario && opts.useDataJud) {
    const textosParaExtrair: string[] = [
      // Querido Diário — excerpts
      ...publicacoesDOU.flatMap((g: any) => g.excerpts ?? []),
      // DOU federal — campo resumo
      ...publicacoesDouFederal.map((r: any) => r.resumo ?? ''),
    ]

    if (textosParaExtrair.length > 0) {
      const numerosExtraidos = extrairNumerosProcesso(textosParaExtrair)

      if (numerosExtraidos.length > 0) {
        const processosDOU = await buscarProcessosPorNumerosDOU(numerosExtraidos, {
          useMni: !!(opts.useScraper && scraperStatus?.mni_configurado),
        })

        // Mescla com processosDataJud evitando duplicatas
        const numerosExistentes = new Set(
          processosDataJud.map((p: any) =>
            (p.numeroProcesso ?? p.dadosBasicos?.numero ?? '').replace(/\D/g, '')
          )
        )
        const novosDataJud = processosDOU.filter(
          (p: any) => !numerosExistentes.has((p.numeroProcesso ?? '').replace(/\D/g, ''))
        )
        processosDataJud.push(...novosDataJud)
      }
    }
  }

  // Total de publicações DOU = Querido Diário (municipal/estadual) + DOU federal (IN)
  const totalPublicacoesDOU = publicacoesDOU.length + publicacoesDouFederal.length

  // === Fase 4: Chamar Claude via proxy local (chave nunca vai ao browser) ===
  const claudeRes = await fetch('/scraper-api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: buildPrompt(cpf, nomeEncontrado, {
        processosDataJud,
        processosScraper,
        publicacoesDOU: [...publicacoesDOU, ...publicacoesDouFederal.map(r => ({ excerpts: [r.resumo] }))],
        ceis: transparencia.ceis,
        ceaf: transparencia.ceaf,
        servidores: transparencia.servidores,
        casosInternos,
      }),
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}))
    throw new Error(err?.erro ?? 'Erro no proxy Claude')
  }
  const claudeData = await claudeRes.json()
  const text = (claudeData?.content?.[0]?.text as string) ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude não retornou JSON válido')

  const aiData = JSON.parse(jsonMatch[0])

  // === Fase 5: Montar status de fontes ===
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
      count: totalPublicacoesDOU,
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

  // === Fase 6: Montar insight final ===
  const insight: CaseInsight = {
    processos_datajud: processosDataJud.length,
    processos_scraper: processosScraper.length,
    publicacoes_dou: totalPublicacoesDOU,
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
