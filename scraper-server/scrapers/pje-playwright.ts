// PJe Playwright — fallback com browser headless para tribunais com SPA Angular
//
// Ativado por: PJE_PLAYWRIGHT=1 em scraper-server/.env
//
// Estratégia:
//   1. Intercepta chamadas REST que o Angular faz internamente (page.on('response'))
//   2. Fallback: extrai números CNJ do texto renderizado via regex
//
// Requer (dentro de scraper-server/):
//   npm install playwright
//   npx playwright install chromium

import type { ScraperProcesso } from '../lib/utils.js'
import { MNI_ENDPOINTS }        from './mni.js'

export const PJE_PLAYWRIGHT_ATIVO = (process.env.PJE_PLAYWRIGHT ?? '').trim() === '1'

// Padrão CNJ: 0000000-00.0000.0.00.0000
const CNJ_REGEX = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g

// Chaves REST que podem conter listas de processos
const ARRAY_KEYS = [
  'processos', 'processo', 'listaProcessos', 'lista',
  'content', 'items', 'rows', 'data', 'result', 'results', 'objetos',
]

export interface PlaywrightResult {
  processos: ScraperProcesso[]
  metodo: 'playwright-intercept' | 'playwright-dom' | 'playwright-erro'
  erro?: string
}

/** Deriva a origin base do tribunal a partir do endpoint MNI */
function getOrigin(tribunal: string): string {
  const url = MNI_ENDPOINTS[tribunal]
  if (!url) return `https://pje.${tribunal}.jus.br`
  try {
    return new URL(url).origin
  } catch {
    return `https://pje.${tribunal}.jus.br`
  }
}

/** Tenta extrair um array de itens de uma resposta REST qualquer (até 2 níveis) */
function extractRestArray(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data
  if (typeof data === 'object' && data !== null) {
    for (const key of ARRAY_KEYS) {
      const val = (data as Record<string, unknown>)[key]
      if (Array.isArray(val) && val.length > 0) return val
    }
    // Recursivo 1 nível a mais
    for (const key of Object.keys(data as object)) {
      const val = (data as Record<string, unknown>)[key]
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const inner = extractRestArray(val)
        if (inner) return inner
      }
    }
  }
  return null
}

/** Normaliza um item REST genérico para ScraperProcesso */
function normalizar(item: unknown, tribunal: string): ScraperProcesso | null {
  if (typeof item !== 'object' || item === null) return null
  const r = item as Record<string, unknown>

  const num =
    (r['numeroProcesso'] as string) ??
    (r['numero_processo'] as string) ??
    (r['numero'] as string) ??
    (r['numproc'] as string) ??
    (r['nrProcesso'] as string) ??
    (r['nroProcesso'] as string) ??
    ''

  // Valida formato CNJ obrigatório
  if (!num || !/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(num)) return null

  const classe =
    (r['classeProcessual'] as string) ??
    (r['classe'] as string) ??
    (r['descricaoClasse'] as string) ??
    undefined

  const assuntoRaw = r['assunto'] ?? r['assuntos']
  const assunto =
    typeof assuntoRaw === 'string'
      ? assuntoRaw
      : Array.isArray(assuntoRaw) && typeof assuntoRaw[0] === 'string'
        ? assuntoRaw[0]
        : undefined

  const data =
    (r['dataAjuizamento'] as string) ??
    (r['data_ajuizamento'] as string) ??
    (r['dtAjuizamento'] as string) ??
    undefined

  const grau =
    (r['grau'] as string) ??
    (r['instancia'] as string) ??
    undefined

  return {
    numero_processo: num,
    tribunal,
    classe,
    assunto,
    data_ajuizamento: data,
    grau,
    fonte: 'pje-playwright',
  }
}

/**
 * Busca processos do advogado em um tribunal via Playwright headless.
 * Intercepta chamadas REST do Angular; fallback para regex CNJ no DOM renderizado.
 */
export async function buscarProcessosPlaywright(
  tribunal: string,
  cpf: string,
  senha: string,
): Promise<PlaywrightResult> {
  // Lazy import — não falha se playwright não estiver instalado
  let pw: typeof import('playwright') | null = null
  try {
    pw = await import('playwright')
  } catch {
    return {
      processos: [],
      metodo: 'playwright-erro',
      erro: 'Playwright não instalado. Execute: cd scraper-server && npm install && npx playwright install chromium',
    }
  }

  const origin = getOrigin(tribunal)
  const loginPaths = ['/pje/login.seam', '/1g/login.seam', '/login.seam', '/pje-legacy/login.seam']

  const browser = await pw.chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
    ],
  })

  const intercepted: ScraperProcesso[] = []

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true, // ICP-Brasil: certs não estão no CA bundle do Node.js
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'pt-BR',
    })

    const page = await context.newPage()

    // Intercepta respostas JSON de endpoints REST que parecem retornar processos
    page.on('response', async (response) => {
      try {
        const url = response.url()
        const ct  = response.headers()['content-type'] ?? ''
        if (!ct.includes('application/json')) return
        if (!/\/(rest|api|process|processo|painel|advogado)/i.test(url)) return
        if (!response.ok()) return

        const data = await response.json().catch(() => null)
        if (!data) return

        const lista = extractRestArray(data)
        if (!lista) return

        for (const item of lista) {
          const p = normalizar(item, tribunal)
          if (p) intercepted.push(p)
        }
      } catch {
        // ignora erros de interceptação
      }
    })

    // Tenta encontrar página de login válida
    let loginFound = false
    for (const path of loginPaths) {
      try {
        const res = await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded', timeout: 15_000 })
        if (res && res.ok()) {
          loginFound = true
          break
        }
      } catch {
        // tenta próximo path
      }
    }

    if (!loginFound) {
      return {
        processos: [],
        metodo: 'playwright-erro',
        erro: `${tribunal}: página de login não acessível`,
      }
    }

    // Aguarda campo de login (CPF ou username — pode estar no Keycloak)
    const loginSelector = [
      'input[name="username"]',
      'input[name="user"]',
      'input[id*="username"]',
      'input[id*="cpf"]',
      'input[name="cpf"]',
    ].join(', ')

    await page.waitForSelector(loginSelector, { timeout: 10_000 }).catch(() => {})

    // Preenche credenciais
    const cpfSoNumeros = cpf.replace(/\D/g, '')
    await page.fill(loginSelector, cpfSoNumeros).catch(() => {})

    const senhaSelector = 'input[type="password"]'
    await page.fill(senhaSelector, senha).catch(() => {})

    // Submete
    const submitSelector = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Entrar")',
      'button:has-text("Login")',
      'button:has-text("Acessar")',
    ].join(', ')

    await page.click(submitSelector).catch(async () => {
      await page.keyboard.press('Enter')
    })

    // Detecta 2FA (TOTP Keycloak)
    try {
      await page.waitForSelector('input[name="totp"], input[id*="totp"]', { timeout: 3_000 })
      return {
        processos: [],
        metodo: 'playwright-erro',
        erro: `${tribunal}: requer 2FA — configure o TOTP em Configurações → PJe`,
      }
    } catch {
      // sem 2FA, segue
    }

    // Detecta erro de credencial na página
    const errorFragments = [
      'credencial inválida', 'usuário ou senha', 'invalid credentials',
      'senha incorreta', 'acesso negado', 'Invalid user credentials',
    ]
    for (const txt of errorFragments) {
      const n = await page.locator(`text=${txt}`).count().catch(() => 0)
      if (n > 0) {
        return { processos: [], metodo: 'playwright-erro', erro: `${tribunal}: credenciais inválidas` }
      }
    }

    // Aguarda Angular/React carregar — networkidle + buffer de 3s para XHRs tardios
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 3_000))

    // Retorno via REST interceptado
    if (intercepted.length > 0) {
      return { processos: intercepted, metodo: 'playwright-intercept' }
    }

    // Fallback: extrai números CNJ do texto renderizado
    const bodyText: string = await page.evaluate(() => document.body.innerText).catch(() => '')
    const matches = [...(bodyText.matchAll(new RegExp(CNJ_REGEX.source, 'g')) ?? [])].map(m => m[0])
    const unique  = [...new Set(matches)]

    if (unique.length > 0) {
      const processos = unique.map(num => ({
        numero_processo: num,
        tribunal,
        fonte: 'pje-playwright-dom',
      } as ScraperProcesso))
      return { processos, metodo: 'playwright-dom' }
    }

    return { processos: [], metodo: 'playwright-intercept' }
  } finally {
    await browser.close().catch(() => {})
  }
}

/** Número máximo de tribunais tentados em paralelo pelo Playwright */
const MAX_PLAYWRIGHT_TRIBUNAIS = 5

/**
 * Re-tenta em paralelo os tribunais onde o scraper HTTP retornou 0 processos.
 * Limita a MAX_PLAYWRIGHT_TRIBUNAIS para não sobrecarregar o host.
 */
export async function retentarComPlaywright(
  tribunaisVazios: string[],
  cpf: string,
  senha: string,
): Promise<ScraperProcesso[]> {
  const alvos = tribunaisVazios.slice(0, MAX_PLAYWRIGHT_TRIBUNAIS)

  const resultados = await Promise.allSettled(
    alvos.map(t => buscarProcessosPlaywright(t, cpf, senha))
  )

  const processos: ScraperProcesso[] = []
  for (const r of resultados) {
    if (r.status === 'fulfilled') {
      processos.push(...r.value.processos)
    }
  }
  return processos
}
