// PJe Painel do Advogado — lista todos os processos do advogado autenticado
//
// Fluxo OAuth2 Keycloak (PDPJ-Br SSO):
//   1. GET /pje/login.seam → 302 para Keycloak (extrai client_id do URL)
//   2. GET Keycloak auth URL → HTML com form de login (action URL com session_code)
//   3. POST cpf+senha na action URL → 302 para PJe callback (com ?code=...)
//   4. GET callback PJe → PJe troca o code por token internamente, seta JSESSIONID
//   5. Com JSESSIONID: tenta REST API /pje/rest/painel/advogado/processo
//                      ou scraping HTML /pje/painel/advogado.seam
//
// Cada tribunal tem client_id próprio no Keycloak: ex. "pje-tjmg-1g", "pje-tjba-1g"
// Extraído dinamicamente do redirect URL no passo 1.

import { MNI_ENDPOINTS } from './mni.js'
import { ScraperProcesso } from '../lib/utils.js'
import { getGovFetch }    from '../lib/govFetch.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const DEBUG_PJE = (process.env.PJE_DEBUG ?? '').trim() === '1'
const DEBUG_TRIB = (process.env.PJE_DEBUG_TRIBUNAL ?? '').trim().toLowerCase()

function shouldDebug(tribunal: string): boolean {
  if (!DEBUG_PJE) return false
  if (!DEBUG_TRIB) return true
  return tribunal.toLowerCase() === DEBUG_TRIB
}

function debugLog(tribunal: string, message: string): void {
  if (shouldDebug(tribunal)) {
    console.log(`[pje-debug] ${tribunal}: ${message}`)
  }
}

/** Aceita redirecionamentos para Keycloak/SSO do PJe, mas APENAS em domínios .jus.br */
function isKeycloakUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url)
    // Domínio obrigatoriamente .jus.br (evita SSRF para domínios externos)
    if (!hostname.endsWith('.jus.br')) return false
    // Deve ser uma rota de autenticação Keycloak ou SSO PJe
    return (
      hostname.includes('sso') ||
      hostname.startsWith('keycloak') ||
      pathname.includes('/auth/realms/') ||
      pathname.includes('/realms/')
    )
  } catch {
    return false
  }
}

/** Valida que uma URL pertence ao domínio esperado (origin) ou ao Keycloak .jus.br */
function isUrlTrusted(url: string, expectedOrigin: string): boolean {
  try {
    const { origin, hostname } = new URL(url)
    return origin === expectedOrigin || hostname.endsWith('.jus.br')
  } catch {
    return false
  }
}

// ── Cookie jar minimalista ────────────────────────────────────────────────────

class CookieJar {
  private jar = new Map<string, string>()

  /** Ingere um array de Set-Cookie headers */
  ingest(headers: Headers): void {
    // Node.js 18+ expõe getSetCookie() — fallback para get() em environments mais antigos
    const values: string[] =
      typeof (headers as any).getSetCookie === 'function'
        ? (headers as any).getSetCookie()
        : (headers.get('set-cookie') ?? '').split(/,(?=[^\s])/)

    for (const raw of values) {
      const pair = raw.split(';')[0].trim()
      const eq   = pair.indexOf('=')
      if (eq > 0) {
        this.jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
      }
    }
  }

  /** Retorna header Cookie formatado */
  toString(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  /** Carrega cookies a partir de um header "Cookie" já serializado */
  loadFromCookieHeader(cookieHeader?: string): void {
    if (!cookieHeader) return
    for (const part of cookieHeader.split(';')) {
      const pair = part.trim()
      if (!pair) continue
      const eq = pair.indexOf('=')
      if (eq <= 0) continue
      this.jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
  }

  get(name: string): string | undefined {
    return this.jar.get(name)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extrai a origin do endpoint MNI mapeado (evita construir URL "no escuro") */
function getOrigin(tribunal: string): string {
  const endpoint = MNI_ENDPOINTS[tribunal.toLowerCase()]
  if (!endpoint) return ''
  try { return new URL(endpoint).origin } catch { return '' }
}

// ── Autenticação OAuth2 Keycloak ──────────────────────────────────────────────

interface SessaoPJe {
  cookies:  CookieJar
  origin:   string
  tribunal: string
  painelPath?: string
  painelHtml?: string
}

/** Dados para completar o login quando 2FA é exigido */
export interface OtpPendingData {
  cookiesStr:   string   // cookies serializados após login-senha
  otpActionUrl: string   // action URL do formulário de OTP no Keycloak
  credentialId: string   // hidden input credentialId exigido pelo Keycloak
  origin:       string
  tribunal:     string
}

type LoginFailKind = 'auth' | 'network' | 'flow'

interface LoginFailure {
  __erro: true
  kind: LoginFailKind
  message: string
}

type LoginResult = SessaoPJe | ({ __otp: true } & OtpPendingData) | LoginFailure

function failLogin(kind: LoginFailKind, message: string): LoginFailure {
  return { __erro: true, kind, message }
}

function isLoginFailure(value: LoginResult): value is LoginFailure {
  return '__erro' in value
}

/** Helper: retry com exponential backoff (para tentar novamente tribunais com timeout/rede) */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 2,
  initialDelayMs: number = 500,
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      if (attempt === maxAttempts) return null
      // Exponential backoff com jitter: 500ms, 1000ms, 2000ms...
      const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

function resolveUrl(baseUrl: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString()
  } catch {
    return ''
  }
}

function toContextPath(pathOrUrl?: string): string {
  if (!pathOrUrl) return '/pje'
  try {
    const pathname = pathOrUrl.startsWith('http')
      ? new URL(pathOrUrl).pathname
      : pathOrUrl.split('?')[0]
    const first = pathname.split('/').filter(Boolean)[0]
    return first ? `/${first}` : '/pje'
  } catch {
    return '/pje'
  }
}

function withContext(path: string, contextPath: string): string {
  if (!path.startsWith('/pje')) return path
  return path.replace(/^\/pje\b/, contextPath)
}

function extractRowsFromHtml(html: string): any[] {
  const rows: any[] = []
  const seen = new Set<string>()
  const add = (rawNumero: string, extra: Record<string, unknown> = {}) => {
    const numero = rawNumero.trim()
    const key = numero.replace(/\D/g, '')
    if (key.length < 15) return
    if (seen.has(key)) return
    seen.add(key)
    rows.push({ numeroProcesso: numero, ...extra })
  }

  // Estrategia 1: tabela HTML classica
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let m: RegExpExecArray | null
  while ((m = rowRegex.exec(html)) !== null) {
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(c => c[1].replace(/<[^>]*>/g, '').trim())
      .filter(c => c.length > 0)

    const cnj = cells.find(c =>
      /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(c) ||
      /^\d{20}$/.test(c.replace(/\D/g, ''))
    )
    if (cnj) add(cnj, { _cells: cells })
  }

  // Estrategia 2: payloads JSON embutidos em script/data-*.
  for (const mm of html.matchAll(/"(?:numeroProcesso|numeroCNJ|nrProcesso|numero)"\s*:\s*"([^"]+)"/gi)) {
    const numero = mm[1].replace(/\\u002D/g, '-').replace(/\\/g, '').trim()
    add(numero)
  }

  // Estrategia 3: fallback por regex global no HTML completo.
  for (const mm of html.matchAll(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g)) add(mm[0])
  for (const mm of html.matchAll(/\b\d{20}\b/g)) add(mm[0])

  return rows
}

function detectHasMore(html: string, rowsCount: number): boolean {
  return html.includes('Próximo') ||
    html.includes('proximo') ||
    html.includes('next') ||
    (html.includes('firstResult') && rowsCount >= 30)
}

function extractApiPathsFromHtml(html?: string): string[] {
  if (!html) return []
  const paths = new Set<string>()
  const add = (raw: string) => {
    const clean = raw.split('?')[0].trim()
    if (!clean.startsWith('/')) return
    if (!/\/(api|rest)\//i.test(clean)) return
    paths.add(clean)
  }

  for (const m of html.matchAll(/["'](\/[^"' ]*(?:\/api\/|\/rest\/)[^"']*)["']/gi)) {
    add(m[1])
  }
  for (const m of html.matchAll(/https?:\/\/[^"' ]*(\/[^"' ]*(?:\/api\/|\/rest\/)[^"' ]*)/gi)) {
    add(m[1])
  }

  return [...paths]
}

async function extractApiPathsFromScripts(
  html: string | undefined,
  origin: string,
  cookie: string,
  gf: Awaited<ReturnType<typeof getGovFetch>>,
): Promise<string[]> {
  if (!html) return []

  const scriptUrls: string[] = []
  for (const m of html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const resolved = resolveUrl(origin, m[1])
    if (!resolved) continue
    try {
      const u = new URL(resolved)
      if (u.origin !== origin) continue
      if (!u.pathname.endsWith('.js')) continue
      scriptUrls.push(u.toString())
    } catch { /* ignore */ }
  }

  const uniqueScripts = [...new Set(scriptUrls)].slice(0, 8)
  const found = new Set<string>()

  for (const scriptUrl of uniqueScripts) {
    try {
      const res = await gf(scriptUrl, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/javascript, text/javascript, */*',
          Cookie: cookie,
        },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) continue
      const js = await res.text()

      for (const p of extractApiPathsFromHtml(js.replace(/\\\//g, '/'))) {
        found.add(p)
      }
    } catch { /* próximo script */ }
  }

  return [...found]
}

function hasProcessShape(item: any): boolean {
  if (!item || typeof item !== 'object') return false

  const numero = (
    item.numeroProcesso ??
    item.numeroCNJ ??
    item.nrProcesso ??
    item.numero ??
    item.processo?.numeroProcesso ??
    item.processo?.numero ??
    ''
  ).toString()
  if (numero.replace(/\D/g, '').length >= 15) return true

  const keys = Object.keys(item).map(k => k.toLowerCase())
  return keys.some(k => k.includes('processo') || k === 'numero' || k === 'numerocnj' || k === 'nrprocesso')
}

function extractRestArray(data: any): any[] | null {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return null

  const likelyKeys = [
    'processos', 'processo', 'listaProcessos', 'lista', 'content',
    'items', 'rows', 'data', 'result', 'results',
  ]

  // 1) Tenta chaves mais prováveis na raiz (prioridade).
  for (const key of likelyKeys) {
    const v = (data as any)[key]
    if (Array.isArray(v)) {
      if (v.length === 0 || v.some(hasProcessShape) || /process/i.test(key)) return v
    }
  }

  // 2) Busca em profundidade por arrays com cara de processo.
  const queue: any[] = [data]
  const seen = new Set<any>()
  let steps = 0

  while (queue.length > 0 && steps < 400) {
    const current = queue.shift()
    steps += 1
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          if (/process|content|items|rows|lista|data|result/i.test(key)) return value
        } else if (value.some(hasProcessShape)) {
          return value
        }
        for (const item of value) {
          if (item && typeof item === 'object') queue.push(item)
        }
        continue
      }
      if (value && typeof value === 'object') queue.push(value)
    }
  }

  return null
}

function extractKeycloakUrlFromHtml(html: string, baseUrl: string): string {
  const candidates: string[] = []

  for (const m of html.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    candidates.push(m[0])
  }
  for (const m of html.matchAll(/(?:href|action)=["']([^"']+)["']/gi)) {
    candidates.push(m[1].replace(/&amp;/g, '&'))
  }

  const jsRedirect = html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i)
  if (jsRedirect?.[1]) candidates.push(jsRedirect[1].replace(/&amp;/g, '&'))

  const metaRefresh = html.match(/http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)[^"']*["']/i)
  if (metaRefresh?.[1]) candidates.push(metaRefresh[1].replace(/&amp;/g, '&'))

  for (const raw of candidates) {
    const resolved = resolveUrl(baseUrl, raw)
    if (isKeycloakUrl(resolved)) return resolved
  }

  return ''
}

async function resolveKeycloakAuthUrl(
  origin: string,
  tribunal: string,
  jar: CookieJar,
  gf: Awaited<ReturnType<typeof getGovFetch>>,
): Promise<{ kcAuthUrl: string } | LoginFailure> {
  const loginEntrypoints = [
    `${origin}/pje/login.seam`,
    `${origin}/1g/login.seam`,
    `${origin}/login.seam`,
  ]

  let sawHttpResponse = false
  let lastLocation = ''
  let lastNetworkMessage = ''

  for (const entrypoint of loginEntrypoints) {
    let currentUrl = entrypoint

    for (let hop = 0; hop < 5; hop++) {
      let res: Response
      try {
        res = await gf(currentUrl, {
          redirect: 'manual',
          headers: {
            'User-Agent': UA,
            Cookie: jar.toString(),
          },
          signal: AbortSignal.timeout(12_000),
        })
      } catch (err: any) {
        const cause = err.cause?.message ?? err.cause?.code ?? ''
        lastNetworkMessage = `${err.message}${cause ? ` (${cause})` : ''}`
        break
      }

      sawHttpResponse = true
      jar.ingest(res.headers)

      const locationRaw = res.headers.get('location') ?? ''
      const location = locationRaw ? resolveUrl(currentUrl, locationRaw) : ''
      if (location) {
        lastLocation = location
        if (isKeycloakUrl(location)) {
          return { kcAuthUrl: location }
        }
      }

      if (res.status >= 300 && res.status < 400 && location) {
        if (!isUrlTrusted(location, origin)) {
          return failLogin('flow', `redirect fora do dominio esperado (${location.slice(0, 120)})`)
        }
        currentUrl = location
        continue
      }

      if (res.status === 200) {
        const html = await res.text()
        const fromHtml = extractKeycloakUrlFromHtml(html, currentUrl)
        if (fromHtml) {
          return { kcAuthUrl: fromHtml }
        }
      }

      break
    }
  }

  if (!sawHttpResponse) {
    return failLogin('network', `erro no login (${tribunal}) - ${lastNetworkMessage || 'falha de conexao'}`)
  }

  return failLogin(
    'flow',
    `login.seam nao redirecionou para Keycloak (location=${lastLocation.slice(0, 120) || '(vazio)'})`
  )
}

/**
 * Realiza login completo no PJe via Keycloak OAuth2 Authorization Code Flow.
 * Retorna SessaoPJe em sucesso, { __otp: true, ... } se 2FA for necessário,
 * ou erro estruturado (auth/network/flow).
 */
async function loginPJe(
  origin:   string,
  tribunal: string,
  cpf:      string,
  senha:    string,
): Promise<LoginResult> {
  const jar = new CookieJar()
  const cpfLimpo = cpf.replace(/\D/g, '')
  const gf = await getGovFetch()

  try {
    // ── Passo 1: GET /pje/login.seam → 302 para Keycloak ──────────────────
    const kcResolved = await resolveKeycloakAuthUrl(origin, tribunal, jar, gf)
    if (isLoginFailure(kcResolved)) {
      console.warn(`[pje-painel] ${tribunal}: ${kcResolved.message}`)
      return kcResolved
    }
    const { kcAuthUrl } = kcResolved

    // ── Passo 2: GET Keycloak login page → obter action URL + cookies KC ──
    const r2 = await gf(kcAuthUrl, {
      headers: { 'User-Agent': UA, Cookie: jar.toString() },
      signal: AbortSignal.timeout(12_000),
    })
    jar.ingest(r2.headers)
    const kcHtml = await r2.text()

    // Extrai action URL do formulário Keycloak com múltiplas estratégias
    let actionUrlRaw: string | null = null
    
    // Estratégia 1: form com action explícito em login-actions/authenticate
    let actionMatch = kcHtml.match(/action=["']([^"']*login-actions\/authenticate[^"']*)["']/i)
    if (actionMatch) actionUrlRaw = actionMatch[1]
    
    // Estratégia 2: qualquer form com ação (pode ter índice/path diferente)
    if (!actionUrlRaw) {
      actionMatch = kcHtml.match(/<form[^>]*action=["']([^"']+)["'][^>]*>/i)
      if (actionMatch) actionUrlRaw = actionMatch[1]
    }
    
    // Estratégia 3: procurar por qualquer link/redirect que inclua "auth" ou "login"
    if (!actionUrlRaw) {
      const jsAction = kcHtml.match(/window\.location[.\s]*=\s*["']([^"']+\/login[^"']*)["']/i)
      if (jsAction) actionUrlRaw = jsAction[1]
    }
    
    if (!actionUrlRaw) {
      return failLogin('flow', `form Keycloak action nao encontrado (status=${r2.status}) - layout desconhecido`)
    }
    
    const actionUrl = resolveUrl(kcAuthUrl, actionUrlRaw.replace(/&amp;/g, '&'))

    // Valida que o action URL pertence ao domínio Keycloak que iniciou o fluxo
    // (evita submeter credenciais para URL arbitrária injetada no HTML)
    if (!isUrlTrusted(actionUrl, new URL(kcAuthUrl).origin)) {
      return failLogin('flow', 'action URL suspeito - dominio fora do Keycloak esperado')
    }

    // Extrai campos hidden do formulário para incluir no POST (alguns realms exigem)
    const hiddenFields: Record<string, string> = {}
    const hiddenRegex = /<input[^>]*>/gi
    let hm: RegExpExecArray | null
    while ((hm = hiddenRegex.exec(kcHtml)) !== null) {
      const typeM   = hm[0].match(/type=["']([^"']+)["']/i)
      const nameM   = hm[0].match(/name=["']([^"']+)["']/i)
      const valueM  = hm[0].match(/value=["']([^"']*)["']/i)
      
      // Captura hidden fields OU campos sem atributo type (alguns forms não declaram type)
      if (nameM && (typeM?.[1]?.toLowerCase() === 'hidden' || !typeM)) {
        hiddenFields[nameM[1]] = valueM?.[1] ?? ''
      }
    }
    
    debugLog(tribunal, `campos hidden encontrados: ${Object.keys(hiddenFields).join(', ')}`)

    // ── Passo 3: POST credenciais → Keycloak valida e redireciona para PJe ─
    const postBody = new URLSearchParams({
      ...hiddenFields,
      username: cpfLimpo,
      password: senha,
    })
    const r3 = await gf(actionUrl, {
      method:   'POST',
      redirect: 'manual',
      headers: {
        'User-Agent':   UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie:         jar.toString(),
        Referer:        kcAuthUrl,
      },
      body: postBody,
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r3.headers)

    let callbackUrl = resolveUrl(actionUrl, r3.headers.get('location') ?? '')
    if (callbackUrl && !callbackUrl.includes('code=') && r3.status >= 300 && r3.status < 400) {
      let current = callbackUrl
      for (let hop = 0; hop < 4; hop++) {
        if (current.includes('code=')) break
        if (!isUrlTrusted(current, origin)) {
          return failLogin('flow', `callback URL suspeito (${current.slice(0, 120)})`)
        }
        const rr = await gf(current, {
          redirect: 'manual',
          headers: { 'User-Agent': UA, Cookie: jar.toString() },
          signal: AbortSignal.timeout(15_000),
        })
        jar.ingest(rr.headers)
        const next = resolveUrl(current, rr.headers.get('location') ?? '')
        if (!next) break
        current = next
      }
      callbackUrl = current
    }

    if (!callbackUrl || !callbackUrl.includes('code=')) {
      if (r3.status === 200) {
        const html3 = await r3.text()

        // Detecta página de OTP/TOTP do Keycloak
        const isOtp = /name=["']totp["']|id=["']totp["']|name=["']otp["']|one-time-code/i.test(html3)
        if (isOtp) {
          const otpMatch        = html3.match(/action="([^"]*login-actions\/authenticate[^"]*)"/i)
          const credentialMatch = html3.match(/name=["']credentialId["'][^>]*value=["']([^"']*)["']/i)
                               ?? html3.match(/value=["']([^"']+)["'][^>]*name=["']credentialId["']/i)
          const otpActionUrl    = otpMatch ? resolveUrl(kcAuthUrl, otpMatch[1].replace(/&amp;/g, '&')) : actionUrl
          const credentialId    = credentialMatch?.[1] ?? ''
          console.log(`[pje-painel] ${tribunal}: 2FA necessario (TOTP Keycloak, credentialId=${credentialId ? 'ok' : 'nao encontrado'})`)
          return { __otp: true, cookiesStr: jar.toString(), otpActionUrl, credentialId, origin, tribunal }
        }

        // Extrai mensagem de erro do Keycloak para diagnóstico
        const kcErro = html3.match(/class=["'][^"']*alert-error[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p)>/i)?.[1]
          ?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        
        // Palavras-chave que indicam erro de credencial
        const credentialErrorKeywords = ['senha', 'invalida', 'invalid', 'username', 'inválida', 'credencial', 'autenticacao', 'cpf', 'incorrect', 'acesso negado', 'nao encontrado']
        const hasCredentialError = credentialErrorKeywords.some(kw => html3.toLowerCase().includes(kw))
        
        if (hasCredentialError || kcErro) {
          const fullMsg = kcErro ? ` - ${kcErro}` : ''
          return failLogin('auth', `credenciais rejeitadas pelo Keycloak${fullMsg}`)
        }
        return failLogin('flow', 'resposta de login sem callback e sem erro de credencial explicito')
      }
      return failLogin('flow', `redirect sem code (status=${r3.status}, location=${(r3.headers.get('location') ?? '').slice(0, 80)})`)
    }

    // ── Passo 4: GET callback PJe → PJe troca code por token, seta JSESSIONID ─
    // Valida que o callback retorna para o origin PJe esperado
    // (evita seguir redirects para domínios externos injetados pelo Keycloak)
    if (!isUrlTrusted(callbackUrl, origin)) {
      return failLogin('flow', `callback URL suspeito - dominio diferente do PJe esperado (${callbackUrl.slice(0, 80)})`)
    }

    let currentCallback = callbackUrl
    let r4: Response | null = null
    for (let hop = 0; hop < 8; hop++) {
      const rr = await gf(currentCallback, {
        redirect: 'manual',
        headers: { 'User-Agent': UA, Cookie: jar.toString() },
        signal: AbortSignal.timeout(15_000),
      })
      jar.ingest(rr.headers)

      const next = resolveUrl(currentCallback, rr.headers.get('location') ?? '')
      if (rr.status >= 300 && rr.status < 400 && next) {
        if (isKeycloakUrl(next)) {
          return failLogin('flow', 'callback retornou ao Keycloak (sessao nao estabelecida)')
        }
        if (!isUrlTrusted(next, origin)) {
          return failLogin('flow', `redirect do callback fora do dominio esperado (${next.slice(0, 120)})`)
        }
        currentCallback = next
        continue
      }

      r4 = rr
      break
    }

    if (!r4) {
      return failLogin('flow', 'callback excedeu limite de redirecionamentos')
    }

    if (!jar.get('JSESSIONID') && !jar.toString().includes('JSESSIONID')) {
      return failLogin('flow', 'JSESSIONID nao recebido apos callback')
    }

    const finalUrl = r4.url || currentCallback
    let painelPath: string | undefined
    try {
      const final = new URL(finalUrl)
      if (final.origin === origin && final.pathname !== '/') {
        painelPath = `${final.pathname}${final.search ?? ''}`
      }
    } catch { /* ignore */ }

    let painelHtml: string | undefined
    const ct4 = r4.headers.get('content-type') ?? ''
    if (ct4.includes('html')) {
      try {
        painelHtml = await r4.text()
      } catch { /* ignore */ }
    }

    // Alguns tribunais finalizam o callback sem retornar diretamente o painel.
    // Faz um bootstrap em rotas comuns para capturar HTML inicial (scripts/rotas).
    if (!painelHtml) {
      const guessedContexts = [...new Set([
        toContextPath(callbackUrl),
        toContextPath(finalUrl),
        '/pje',
      ])]

      const bootstrapCandidates = [...new Set([
        ...guessedContexts.flatMap(ctx => ([
          `${origin}${ctx}/painel/advogado.seam`,
          `${origin}${ctx}/painel/advogado/listView.seam`,
          `${origin}${ctx}/painel/usuario-externo/listView.seam`,
          `${origin}${ctx}/`,
        ])),
        `${origin}/pje/`,
        `${origin}/`,
      ])]
      for (const candidate of bootstrapCandidates) {
        try {
          let current = candidate
          let rr: Response | null = null
          for (let hop = 0; hop < 5; hop++) {
            const rrb = await gf(current, {
              redirect: 'manual',
              headers: { 'User-Agent': UA, Cookie: jar.toString() },
              signal: AbortSignal.timeout(12_000),
            })
            jar.ingest(rrb.headers)

            const next = resolveUrl(current, rrb.headers.get('location') ?? '')
            if (rrb.status >= 300 && rrb.status < 400 && next) {
              if (isKeycloakUrl(next)) {
                rr = null
                break
              }
              if (!isUrlTrusted(next, origin)) {
                rr = null
                break
              }
              current = next
              continue
            }
            rr = rrb
            debugLog(tribunal, `bootstrap ${candidate} -> ${rrb.status} (${rrb.url || current})`)
            break
          }

          if (!rr) continue
          const finalUrlBootstrap = rr.url || current
          try {
            if (new URL(finalUrlBootstrap).origin !== origin) continue
          } catch { continue }

          const ct = rr.headers.get('content-type') ?? ''
          if (!ct.includes('html')) continue
          const html = await rr.text()
          if (!html) continue

          painelHtml = html
          if (!painelPath) {
            try {
              const u = new URL(finalUrlBootstrap)
              if (u.origin === origin && u.pathname !== '/') {
                painelPath = `${u.pathname}${u.search ?? ''}`
              }
            } catch { /* ignore */ }
          }
          debugLog(tribunal, `bootstrap capturou HTML (${painelPath ?? 'n/a'})`)
          break
        } catch { /* próximo bootstrap */ }
      }
    }

    console.log(`[pje-painel] ${tribunal}: login ok (JSESSIONID obtido)`)
    debugLog(
      tribunal,
      `sessao pronta: final=${finalUrl.slice(0, 140)} painel=${painelPath ?? 'n/a'} html=${painelHtml ? 'sim' : 'nao'}`
    )
    return { cookies: jar, origin, tribunal, painelPath, painelHtml }
  } catch (err: any) {
    const cause = err.cause?.message ?? err.cause?.code ?? ''
    return failLogin('network', `erro no login - ${err.message}${cause ? ` (${cause})` : ''}`)
  }
}

/**
 * Completa o login no Keycloak enviando o código TOTP/2FA.
 * Chamado quando loginPJe retorna { __otp: true }.
 */
export async function completarLoginComOtp(
  otpData: OtpPendingData,
  otpCode: string,
): Promise<{ valido: boolean; mensagem: string }> {
  const jar = new CookieJar()
  const gf = await getGovFetch()
  try {
    jar.loadFromCookieHeader(otpData.cookiesStr)
    const formBody: Record<string, string> = { totp: otpCode, otp: otpCode }
    if (otpData.credentialId) formBody.credentialId = otpData.credentialId

    const r = await gf(otpData.otpActionUrl, {
      method:   'POST',
      redirect: 'manual',
      headers: {
        'User-Agent':   UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie:         jar.toString(),
      },
      body: new URLSearchParams(formBody),
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r.headers)

    const callbackUrl = resolveUrl(otpData.otpActionUrl, r.headers.get('location') ?? '')
    console.log(`[pje-painel] OTP response: status=${r.status} location=${callbackUrl.slice(0, 80)}`)

    if (!callbackUrl.includes('code=')) {
      const html = r.status === 200 ? await r.text() : ''
      // Extrai mensagem de erro do Keycloak
      const erroMsg = html.match(/class=["'][^"']*alert-error[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p)>/i)?.[1]
        ?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      console.warn(`[pje-painel] OTP rejeitado: ${erroMsg ?? '(sem mensagem)'}`)
      return { valido: false, mensagem: erroMsg ?? 'Código 2FA inválido ou expirado. Verifique o horário do dispositivo e tente novamente.' }
    }

    if (!isUrlTrusted(callbackUrl, otpData.origin)) {
      return { valido: false, mensagem: 'Callback pós-2FA inválido (domínio inesperado).' }
    }

    // Passo 4: callback PJe com redirects manuais para manter contexto de sessão.
    let current = callbackUrl
    let r4: Response | null = null
    for (let hop = 0; hop < 8; hop++) {
      const rr = await gf(current, {
        redirect: 'manual',
        headers: { 'User-Agent': UA, Cookie: jar.toString() },
        signal: AbortSignal.timeout(15_000),
      })
      jar.ingest(rr.headers)

      const next = resolveUrl(current, rr.headers.get('location') ?? '')
      if (rr.status >= 300 && rr.status < 400 && next) {
        if (isKeycloakUrl(next)) {
          return { valido: false, mensagem: 'Callback pós-2FA retornou ao Keycloak. Refaça o login.' }
        }
        if (!isUrlTrusted(next, otpData.origin)) {
          return { valido: false, mensagem: 'Redirect pós-2FA fora do domínio esperado.' }
        }
        current = next
        continue
      }

      r4 = rr
      break
    }

    if (!r4) {
      return { valido: false, mensagem: 'Fluxo pós-2FA excedeu o limite de redirecionamentos.' }
    }

    if (!jar.toString().includes('JSESSIONID')) {
      return { valido: false, mensagem: 'Login não concluído após 2FA — tente novamente.' }
    }

    console.log(`[pje-painel] ${otpData.tribunal}: login 2FA ok`)
    return { valido: true, mensagem: `Credenciais e 2FA válidos — login efetuado no ${otpData.tribunal.toUpperCase()}` }
  } catch (err: any) {
    return { valido: false, mensagem: `Erro ao verificar 2FA: ${err.message}` }
  }
}

// ── Listagem de processos ─────────────────────────────────────────────────────

/** Tenta a API REST do painel. Retorna null se não disponível. */
async function listarViaRest(
  sessao:    SessaoPJe,
  pagina:    number,
  quantidade: number,
): Promise<any[] | null> {
  const gf = await getGovFetch()

  const contextPath = toContextPath(sessao.painelPath)
  const offset = Math.max(0, (pagina - 1) * quantidade)
  const basePaths = [
    '/pje/rest/painel/advogado/processo',
    '/pje/rest/painel/advogado/processos',
    '/pje/rest/painel/usuario-externo/processo',
    '/pje/rest/painel/usuarioexterno/processo',
    '/pje/api/painel/advogado/processo',
    '/pje/api/painel/advogado/processos',
    '/pje/api/processos',
    '/pje/api/v1/painel/advogado/processos',
    '/pje/painel-api/api/painel/advogado/processo',
    '/pje/painel-api/api/processos',
  ].map(p => withContext(p, contextPath))

  const discoveredPaths = extractApiPathsFromHtml(sessao.painelHtml)
    .map(p => withContext(p, contextPath))

  const discoveredScriptPaths = (await extractApiPathsFromScripts(
    sessao.painelHtml,
    sessao.origin,
    sessao.cookies.toString(),
    gf,
  )).map(p => withContext(p, contextPath))

  const candidatePaths = [...new Set([...basePaths, ...discoveredPaths, ...discoveredScriptPaths])]
  const queryVariants = [
    '',
    `?pagina=${pagina}&quantidade=${quantidade}`,
    `?page=${pagina}&size=${quantidade}`,
    `?page=${Math.max(0, pagina - 1)}&size=${quantidade}`,
    `?numeroPagina=${pagina}&tamanhoPagina=${quantidade}`,
    `?firstResult=${offset}&maxResults=${quantidade}`,
    `?offset=${offset}&limit=${quantidade}`,
  ]
  const postBodies = [
    { pagina, quantidade },
    { page: pagina, size: quantidade },
    { page: Math.max(0, pagina - 1), size: quantidade },
    { numeroPagina: pagina, tamanhoPagina: quantidade },
    { firstResult: offset, maxResults: quantidade },
    { offset, limit: quantidade },
    { paginacao: { pagina, quantidade } },
    { paginacao: { page: Math.max(0, pagina - 1), size: quantidade } },
    { filtros: {}, paginacao: { pagina, quantidade } },
  ]
  let debugCount = 0

  for (const path of candidatePaths) {
    for (const query of queryVariants) {
      try {
        const url = `${sessao.origin}${path}${query}`
        const res = await gf(url, {
          headers: {
            'User-Agent': UA,
            Accept: 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest',
            Cookie: sessao.cookies.toString(),
          },
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `REST GET ${path}${query} -> ${res.status}`)
          }
          continue
        }

        const ct = res.headers.get('content-type') ?? ''
        const text = await res.text()
        if (!ct.includes('json') && !/^\s*[\[{]/.test(text)) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `REST GET ${path}${query} -> ok sem JSON (${ct || 'sem-content-type'})`)
          }
          continue
        }

        let data: any
        try { data = JSON.parse(text) } catch { continue }
        const list = extractRestArray(data)
        if (list !== null) {
          debugLog(sessao.tribunal, `REST GET ${path}${query} -> lista ${list.length}`)
          return list
        }
      } catch { /* próxima combinação */ }
    }

    for (const body of postBodies) {
      try {
        const url = `${sessao.origin}${path}`
        const res = await gf(url, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            Cookie: sessao.cookies.toString(),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `REST POST ${path} -> ${res.status}`)
          }
          continue
        }

        const ct = res.headers.get('content-type') ?? ''
        const text = await res.text()
        if (!ct.includes('json') && !/^\s*[\[{]/.test(text)) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `REST POST ${path} -> ok sem JSON (${ct || 'sem-content-type'})`)
          }
          continue
        }

        let data: any
        try { data = JSON.parse(text) } catch { continue }
        const list = extractRestArray(data)
        if (list !== null) {
          debugLog(sessao.tribunal, `REST POST ${path} -> lista ${list.length}`)
          return list
        }
      } catch { /* próximo body */ }
    }
  }

  debugLog(sessao.tribunal, 'REST: nenhum endpoint retornou lista')
  return null
}

/** Scraping HTML do Painel do Advogado (fallback quando REST não existe) */
async function listarViaHtml(sessao: SessaoPJe, offset = 0): Promise<{ rows: any[]; hasMore: boolean }> {
  const gf = await getGovFetch()
  const contextPath = toContextPath(sessao.painelPath)
  const pagina = Math.floor(offset / 30) + 1
  let debugCount = 0

  if (offset === 0 && sessao.painelHtml) {
    const rows = extractRowsFromHtml(sessao.painelHtml)
    if (rows.length > 0) {
      debugLog(sessao.tribunal, `HTML inicial do callback trouxe ${rows.length} linhas`)
      return { rows, hasMore: detectHasMore(sessao.painelHtml, rows.length) }
    }
  }

  const discoveredPainelPaths = new Set<string>()
  if (sessao.painelHtml) {
    for (const m of sessao.painelHtml.matchAll(/["'](\/[^"']*painel[^"']*\.seam[^"']*)["']/gi)) {
      discoveredPainelPaths.add(m[1].split('?')[0])
    }
  }

  const painelPaths = [
    (sessao.painelPath ?? '').split('?')[0],
    '/pje/painel/advogado.seam',
    '/pje/painel/advogado/painel.seam',
    '/pje/painel/advogado/listView.seam',
    '/pje/painel/advogado/list.seam',
    '/pje/painel/usuario-externo/listView.seam',
    '/pje/painel/usuario-externo/list.seam',
    '/pje/painel/usuarioexterno/listView.seam',
    '/pje/painel/usuarioexterno/list.seam',
    '/pje/painel/listView.seam',
    '/pje/painelAdvogado/painelAdvogado.seam',
    ...[...discoveredPainelPaths],
  ]
    .filter(Boolean)
    .map(p => withContext(p, contextPath))

  const uniquePaths = [...new Set(painelPaths)]
  const queryVariants = [
    `?firstResult=${offset}&maxResults=30`,
    `?pagina=${pagina}&quantidade=30`,
    `?page=${Math.max(0, pagina - 1)}&size=30`,
    `?offset=${offset}&limit=30`,
    '',
  ]

  for (const path of uniquePaths) {
    for (const query of queryVariants) {
      try {
        const url = `${sessao.origin}${path}${query}`
        const res = await gf(url, {
          headers: { 'User-Agent': UA, Cookie: sessao.cookies.toString() },
          signal: AbortSignal.timeout(20_000),
        })
        if (!res.ok) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `HTML ${path}${query} -> ${res.status}`)
          }
          continue
        }
        const ct = res.headers.get('content-type') ?? ''
        if (!ct.includes('html')) {
          if (shouldDebug(sessao.tribunal) && debugCount < 35) {
            debugCount += 1
            debugLog(sessao.tribunal, `HTML ${path}${query} -> ok sem HTML (${ct || 'sem-content-type'})`)
          }
          continue
        }

        const html = await res.text()
        const rows = extractRowsFromHtml(html)
        if (rows.length > 0) {
          debugLog(sessao.tribunal, `HTML ${path}${query} -> ${rows.length} linhas`)
          return { rows, hasMore: detectHasMore(html, rows.length) }
        }
      } catch { /* próxima combinação */ }
    }
  }

  debugLog(sessao.tribunal, 'HTML: nenhuma linha encontrada')
  return { rows: [], hasMore: false }
}

// ── Normalização ──────────────────────────────────────────────────────────────

function normalizar(item: any, tribunal: string, fonte: string): ScraperProcesso | null {
  const numero = (
    item.numeroProcesso ??
    item.numero ??
    item.numeroCNJ ??
    item.nrProcesso ??
    item.processo?.numeroProcesso ??
    item.processo?.numero ??
    ''
  ).toString().trim()
  if (!numero || numero.replace(/\D/g, '').length < 15) return null

  return {
    numero_processo:    numero,
    tribunal:           tribunal.toUpperCase(),
    classe:             item.classe?.nome ?? item.classeProcessual ?? item.classe ?? '',
    assunto:            item.assunto?.nome ?? item.assuntos?.[0]?.nome ?? item.assunto ?? '',
    data_ajuizamento:   item.dataAjuizamento ?? item.dataDistribuicao ?? '',
    ultima_atualizacao: item.dataUltimaMovimentacao ?? item.dataHoraUltimaAtualizacao ?? '',
    valor_causa:        item.valorCausa ?? null,
    grau:               item.grau ?? '',
    partes: (item.partes ?? []).map((p: any) => ({
      nome: p.nome ?? '',
      polo: (p.polo === 'AT' || p.polo === 'ATIVO') ? 'ativo'
          : (p.polo === 'PA' || p.polo === 'PASSIVO') ? 'passivo' : 'outro',
    })),
    movimentos: (item.movimentos ?? []).slice(0, 3).map((m: any) => ({
      data:      m.dataHora ?? '',
      descricao: m.nome ?? m.descricao ?? '',
    })),
    fonte,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

export interface PainelResult {
  processos:    ScraperProcesso[]
  total:        number
  gerado_em:    string
  autenticacao: 'oauth2-keycloak' | 'falhou'
  diagnostico: {
    tentativas: number
    logins_ok: number
    falhas_auth: number
    falhas_rede: number
    falhas_fluxo: number
  }
  tribunais: {
    tribunal:  string
    total:     number
    metodo?:   'rest' | 'html'
    erro?:     string
  }[]
}

export interface TestarCredenciaisResult {
  valido:      boolean
  tribunal:    string
  mensagem:    string
  otpPending?: OtpPendingData   // presente quando Keycloak exige 2FA
}

/**
 * Testa se CPF+senha são válidos no PJe usando TJMG como tribunal de referência.
 * Executa apenas os passos 1–3 do OAuth2 (não chega a listar processos).
 * Útil para validar credenciais antes de salvar.
 * Se 2FA for necessário, retorna otpPending com dados para completar o login.
 */
export async function testarCredenciaisPJe(
  cpf: string,
  senha: string,
): Promise<TestarCredenciaisResult> {
  const origin = getOrigin('tjmg')
  if (!origin) {
    return { valido: false, tribunal: 'TJMG', mensagem: 'Endpoint TJMG não configurado' }
  }
  const resultado = await loginPJe(origin, 'tjmg', cpf, senha)

  if (isLoginFailure(resultado)) {
    if (resultado.kind === 'auth') {
      return { valido: false, tribunal: 'TJMG', mensagem: 'Credenciais invalidas - verifique CPF e senha cadastrados no PJe' }
    }
    if (resultado.kind === 'network') {
      return { valido: false, tribunal: 'TJMG', mensagem: `Falha de rede ao validar no TJMG: ${resultado.message}` }
    }
    return { valido: false, tribunal: 'TJMG', mensagem: `Fluxo de login do TJMG nao concluido: ${resultado.message}` }
  }

  if ('__otp' in resultado) {
    return {
      valido:     false,
      tribunal:   'TJMG',
      mensagem:   'Autenticação em dois fatores (2FA) necessária',
      otpPending: { cookiesStr: resultado.cookiesStr, otpActionUrl: resultado.otpActionUrl, credentialId: resultado.credentialId, origin: resultado.origin, tribunal: resultado.tribunal },
    }
  }

  return { valido: true, tribunal: 'TJMG', mensagem: 'Credenciais válidas — login efetuado com sucesso no TJMG' }
}

/**
 * Busca TODOS os processos do advogado em todos os tribunais PJe/MNI.
 *
 * Para cada tribunal:
 *  1. Autentica via OAuth2 Keycloak (CPF+senha)
 *  2. Tenta REST API /pje/rest/painel/advogado/processo
 *  3. Fallback: scraping HTML /pje/painel/advogado.seam
 *  4. Pagina até esgotar resultados
 *
 * @param cpf   CPF do advogado (com ou sem pontuação)
 * @param senha Senha do PJe (mesma usada no MNI)
 */
export async function buscarTodosProcessosAdvogado(
  cpf:   string,
  senha: string,
): Promise<PainelResult> {
  const tribunais = Object.keys(MNI_ENDPOINTS)
  const todosProcessos: ScraperProcesso[] = []
  const resumos: PainelResult['tribunais'] = []

  let autenticouAlgum = false
  const diagnostico = {
    tentativas: 0,
    logins_ok: 0,
    falhas_auth: 0,
    falhas_rede: 0,
    falhas_fluxo: 0,
  }

  // Processa tribunais em lotes de 5 para não sobrecarregar a rede
  // (login envolve 4 requests HTTP por tribunal)
  const LOTE = 5
  const tribunaisComFalhaDeRede: Array<{ tribunal: string; resumoIndex: number }> = []
  
  for (let i = 0; i < tribunais.length; i += LOTE) {
    const lote = tribunais.slice(i, i + LOTE)

    await Promise.allSettled(
      lote.map(async (tribunal) => {
        const origin = getOrigin(tribunal)
        if (!origin) return

        diagnostico.tentativas += 1
        const resultado = await loginPJe(origin, tribunal, cpf, senha)
        if (isLoginFailure(resultado)) {
          if (resultado.kind === 'auth') diagnostico.falhas_auth += 1
          else if (resultado.kind === 'network') {
            diagnostico.falhas_rede += 1
            tribunaisComFalhaDeRede.push({ tribunal, resumoIndex: resumos.length })
          }
          else diagnostico.falhas_fluxo += 1
          resumos.push({ tribunal, total: 0, erro: resultado.message })
          return
        }
        if ('__otp' in resultado) {
          diagnostico.falhas_fluxo += 1
          resumos.push({ tribunal, total: 0, erro: '2FA necessario - configure via UI' })
          return
        }
        const sessao = resultado
        autenticouAlgum = true
        diagnostico.logins_ok += 1

        const processos: ScraperProcesso[] = []

        // Tenta REST primeiro
        const rest1 = await listarViaRest(sessao, 1, 50)
        if (rest1 !== null) {
          for (const item of rest1) {
            const p = normalizar(item, tribunal, `pje-rest-${tribunal}`)
            if (p) processos.push(p)
          }
          // Pagina se necessário
          if (rest1.length >= 50) {
            const rest2 = await listarViaRest(sessao, 2, 50)
            if (rest2) {
              for (const item of rest2) {
                const p = normalizar(item, tribunal, `pje-rest-${tribunal}`)
                if (p) processos.push(p)
              }
            }
          }
          if (processos.length > 0) {
            todosProcessos.push(...processos)
            resumos.push({ tribunal, total: processos.length, metodo: 'rest' })
            return
          }
          debugLog(tribunal, 'REST retornou resposta sem processos normalizaveis; tentando fallback HTML')
        }

        // Fallback: HTML scraping
        let offset = 0
        let hasMore = true
        let paginasHtml = 0

        while (hasMore && paginasHtml < 20) {
          const { rows, hasMore: more } = await listarViaHtml(sessao, offset)
          for (const row of rows) {
            const p = normalizar(row, tribunal, `pje-html-${tribunal}`)
            if (p) processos.push(p)
          }
          hasMore = more
          offset += 30
          paginasHtml++
        }

        todosProcessos.push(...processos)
        const metodo = processos.length > 0 ? 'html' : undefined
        const erro   = processos.length === 0
          ? `sem processos encontrados (REST/HTML; painel=${sessao.painelPath ?? 'n/a'})`
          : undefined
        resumos.push({ tribunal, total: processos.length, metodo, erro })
      })
    )
  }

  // ── Fase 2: Retry para tribunais com erro de rede ──────────────────────────
  // Aguarda 1s antes de tentar novamente os tribunais que tiveram timeout/conexão
  if (tribunaisComFalhaDeRede.length > 0) {
    console.log(`[scraper] Aguardando 1s antes de retry em ${tribunaisComFalhaDeRede.length} tribunal(is) com erro de rede...`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    for (const { tribunal, resumoIndex } of tribunaisComFalhaDeRede) {
      const origin = getOrigin(tribunal)
      if (!origin) continue
      
      const resultado = await loginPJe(origin, tribunal, cpf, senha)
      if (isLoginFailure(resultado)) {
        console.log(`[scraper] Retry ${tribunal}: ainda falhou com ${resultado.kind}`)
        continue
      }
      if ('__otp' in resultado) {
        console.log(`[scraper] Retry ${tribunal}: exige 2FA`)
        continue
      }
      
      const sessao = resultado
      diagnostico.logins_ok += 1
      autenticouAlgum = true
      const processos: ScraperProcesso[] = []
      
      // Tenta REST + HTML como antes
      const rest1 = await listarViaRest(sessao, 1, 50)
      if (rest1 !== null && rest1.length > 0) {
        for (const item of rest1) {
          const p = normalizar(item, tribunal, `pje-rest-retry-${tribunal}`)
          if (p) processos.push(p)
        }
      } else {
        // Fallback HTML
        const { rows } = await listarViaHtml(sessao, 0)
        for (const row of rows) {
          const p = normalizar(row, tribunal, `pje-html-retry-${tribunal}`)
          if (p) processos.push(p)
        }
      }
      
      if (processos.length > 0) {
        todosProcessos.push(...processos)
        resumos[resumoIndex] = { tribunal, total: processos.length, metodo: 'rest-retry' }
        console.log(`[scraper] Retry ${tribunal}: sucesso com ${processos.length} processos`)
      }
    }
  }

  // Deduplica por número CNJ
  const seen = new Set<string>()
  const unicos = todosProcessos.filter(p => {
    const key = p.numero_processo.replace(/\D/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    processos:    unicos,
    total:        unicos.length,
    gerado_em:    new Date().toISOString(),
    autenticacao: autenticouAlgum ? 'oauth2-keycloak' : 'falhou',
    diagnostico,
    tribunais:    resumos.sort((a, b) => b.total - a.total),
  }
}
