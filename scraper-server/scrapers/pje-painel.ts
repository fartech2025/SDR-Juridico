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

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

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
}

/** Dados para completar o login quando 2FA é exigido */
export interface OtpPendingData {
  cookiesStr:   string   // cookies serializados após login-senha
  otpActionUrl: string   // action URL do formulário de OTP no Keycloak
  credentialId: string   // hidden input credentialId exigido pelo Keycloak
  origin:       string
  tribunal:     string
}

type LoginResult = SessaoPJe | ({ __otp: true } & OtpPendingData) | null

/**
 * Realiza login completo no PJe via Keycloak OAuth2 Authorization Code Flow.
 * Retorna SessaoPJe em sucesso, { __otp: true, ... } se 2FA for necessário, ou null.
 */
async function loginPJe(
  origin:   string,
  tribunal: string,
  cpf:      string,
  senha:    string,
): Promise<LoginResult> {
  const jar = new CookieJar()
  const cpfLimpo = cpf.replace(/\D/g, '')

  try {
    // ── Passo 1: GET /pje/login.seam → 302 para Keycloak ──────────────────
    const r1 = await fetch(`${origin}/pje/login.seam`, {
      redirect: 'manual',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
    })
    jar.ingest(r1.headers)
    const kcAuthUrl = r1.headers.get('location') ?? ''
    if (!kcAuthUrl.includes('sso.cloud.pje.jus.br')) {
      console.warn(`[pje-painel] ${tribunal}: login.seam não redirecionou para Keycloak`)
      return null
    }

    // ── Passo 2: GET Keycloak login page → obter action URL + cookies KC ──
    const r2 = await fetch(kcAuthUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
    })
    jar.ingest(r2.headers)
    const kcHtml = await r2.text()

    // Extrai action URL do formulário Keycloak
    const actionMatch = kcHtml.match(/action="([^"]*login-actions\/authenticate[^"]*)"/i)
    if (!actionMatch) {
      console.warn(`[pje-painel] ${tribunal}: form action não encontrado no Keycloak`)
      return null
    }
    const actionUrl = actionMatch[1].replace(/&amp;/g, '&')

    // ── Passo 3: POST credenciais → Keycloak valida e redireciona para PJe ─
    const r3 = await fetch(actionUrl, {
      method:   'POST',
      redirect: 'manual',
      headers: {
        'User-Agent':   UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie:         jar.toString(),
        Referer:        kcAuthUrl,
      },
      body: new URLSearchParams({ username: cpfLimpo, password: senha }),
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r3.headers)

    const callbackUrl = r3.headers.get('location') ?? ''
    if (!callbackUrl || !callbackUrl.includes('code=')) {
      if (r3.status === 200) {
        const html3 = await r3.text()

        // Detecta página de OTP/TOTP do Keycloak
        const isOtp = /name=["']totp["']|id=["']totp["']|name=["']otp["']|one-time-code/i.test(html3)
        if (isOtp) {
          const otpMatch        = html3.match(/action="([^"]*login-actions\/authenticate[^"]*)"/i)
          const credentialMatch = html3.match(/name=["']credentialId["'][^>]*value=["']([^"']*)["']/i)
                               ?? html3.match(/value=["']([^"']+)["'][^>]*name=["']credentialId["']/i)
          const otpActionUrl    = otpMatch ? otpMatch[1].replace(/&amp;/g, '&') : actionUrl
          const credentialId    = credentialMatch?.[1] ?? ''
          console.log(`[pje-painel] ${tribunal}: 2FA necessário (TOTP Keycloak, credentialId=${credentialId ? 'ok' : 'não encontrado'})`)
          return { __otp: true, cookiesStr: jar.toString(), otpActionUrl, credentialId, origin, tribunal }
        }

        console.warn(`[pje-painel] ${tribunal}: credenciais rejeitadas pelo Keycloak`)
        return null
      }
      console.warn(`[pje-painel] ${tribunal}: redirect sem code (status=${r3.status})`)
      return null
    }

    // ── Passo 4: GET callback PJe → PJe troca code por token, seta JSESSIONID ─
    const r4 = await fetch(callbackUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, Cookie: jar.toString() },
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r4.headers)

    if (!jar.get('JSESSIONID') && !jar.toString().includes('JSESSIONID')) {
      console.warn(`[pje-painel] ${tribunal}: JSESSIONID não recebido após callback`)
      return null
    }

    console.log(`[pje-painel] ${tribunal}: login ok (JSESSIONID obtido)`)
    return { cookies: jar, origin, tribunal }
  } catch (err: any) {
    console.warn(`[pje-painel] ${tribunal}: erro no login — ${err.message}`)
    return null
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
  try {
    const formBody: Record<string, string> = { totp: otpCode, otp: otpCode }
    if (otpData.credentialId) formBody.credentialId = otpData.credentialId

    const r = await fetch(otpData.otpActionUrl, {
      method:   'POST',
      redirect: 'manual',
      headers: {
        'User-Agent':   UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie:         otpData.cookiesStr,
      },
      body: new URLSearchParams(formBody),
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r.headers)

    const callbackUrl = r.headers.get('location') ?? ''
    console.log(`[pje-painel] OTP response: status=${r.status} location=${callbackUrl.slice(0, 80)}`)

    if (!callbackUrl.includes('code=')) {
      const html = r.status === 200 ? await r.text() : ''
      // Extrai mensagem de erro do Keycloak
      const erroMsg = html.match(/class=["'][^"']*alert-error[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p)>/i)?.[1]
        ?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      console.warn(`[pje-painel] OTP rejeitado: ${erroMsg ?? '(sem mensagem)'}`)
      return { valido: false, mensagem: erroMsg ?? 'Código 2FA inválido ou expirado. Verifique o horário do dispositivo e tente novamente.' }
    }

    // Passo 4: callback PJe
    const r4 = await fetch(callbackUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, Cookie: jar.toString() },
      signal: AbortSignal.timeout(15_000),
    })
    jar.ingest(r4.headers)

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
  const paths = [
    '/pje/rest/painel/advogado/processo',
    '/pje/api/painel/advogado/processo',
    '/pje/api/processos',
  ]
  for (const path of paths) {
    try {
      const url = `${sessao.origin}${path}?pagina=${pagina}&quantidade=${quantidade}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept:  'application/json',
          Cookie:  sessao.cookies.toString(),
        },
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) continue
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) continue
      const data = await res.json()
      if (Array.isArray(data))             return data
      if (Array.isArray(data?.processos))  return data.processos
      if (Array.isArray(data?.lista))      return data.lista
      if (Array.isArray(data?.content))    return data.content
    } catch { /* próximo path */ }
  }
  return null
}

/** Scraping HTML do Painel do Advogado (fallback quando REST não existe) */
async function listarViaHtml(sessao: SessaoPJe, offset = 0): Promise<{ rows: any[]; hasMore: boolean }> {
  const painelPaths = [
    '/pje/painel/advogado.seam',
    '/pje/painel/advogado/painel.seam',
    '/pje/painelAdvogado/painelAdvogado.seam',
  ]

  for (const path of painelPaths) {
    try {
      const url = `${sessao.origin}${path}?firstResult=${offset}&maxResults=30`
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Cookie: sessao.cookies.toString() },
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) continue
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('html')) continue

      const html = await res.text()

      // Extrai linhas da tabela de processos
      // PJe tipicamente tem: <td>NUMERO_PROCESSO</td> e outros campos
      const rows: any[] = []
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
      let m: RegExpExecArray | null

      while ((m = rowRegex.exec(html)) !== null) {
        const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
          .map(c => c[1].replace(/<[^>]*>/g, '').trim())
          .filter(c => c.length > 0)

        // Tenta encontrar número CNJ na linha (20 dígitos ou padrão formatado)
        const cnj = cells.find(c =>
          /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(c) ||
          /^\d{20}$/.test(c.replace(/\D/g, ''))
        )
        if (cnj) rows.push({ numeroProcesso: cnj, _cells: cells })
      }

      const hasMore = html.includes('Próximo') || html.includes('next') ||
                      html.includes('firstResult') && rows.length >= 30

      return { rows, hasMore }
    } catch { /* próximo path */ }
  }

  return { rows: [], hasMore: false }
}

// ── Normalização ──────────────────────────────────────────────────────────────

function normalizar(item: any, tribunal: string, fonte: string): ScraperProcesso | null {
  const numero = (item.numeroProcesso ?? item.numero ?? item.numeroCNJ ?? '').toString().trim()
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

  if (!resultado) {
    return { valido: false, tribunal: 'TJMG', mensagem: 'Credenciais inválidas — verifique CPF e senha cadastrados no PJe' }
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

  // Processa tribunais em lotes de 5 para não sobrecarregar a rede
  // (login envolve 4 requests HTTP por tribunal)
  const LOTE = 5
  for (let i = 0; i < tribunais.length; i += LOTE) {
    const lote = tribunais.slice(i, i + LOTE)

    await Promise.allSettled(
      lote.map(async (tribunal) => {
        const origin = getOrigin(tribunal)
        if (!origin) return

        const resultado = await loginPJe(origin, tribunal, cpf, senha)
        if (!resultado) {
          resumos.push({ tribunal, total: 0, erro: 'login falhou' })
          return
        }
        if ('__otp' in resultado) {
          resumos.push({ tribunal, total: 0, erro: '2FA necessário — configure via UI' })
          return
        }
        const sessao = resultado
        autenticouAlgum = true

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
          todosProcessos.push(...processos)
          resumos.push({ tribunal, total: processos.length, metodo: 'rest' })
          return
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
        const erro   = processos.length === 0 ? 'sem processos encontrados (REST 404 + HTML 0)' : undefined
        resumos.push({ tribunal, total: processos.length, metodo, erro })
      })
    )
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
    tribunais:    resumos.sort((a, b) => b.total - a.total),
  }
}
