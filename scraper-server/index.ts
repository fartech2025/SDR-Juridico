// Scraper Server — Node.js HTTP server local (sem dependências extras)
// Porta: 3001 | Inicia automaticamente via scraperServerPlugin no Vite
import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve }                     from 'node:path'
import { fileURLToPath }               from 'node:url'
import { searchByCpf } from './scrapers/index.js'
import { quickCpfCheck, searchByNome, buscarPorNumero, buscarPorOAB } from './scrapers/datajud.js'
import { consultarProcessoMNI, tribunalTemMNI, MNI_ENDPOINTS } from './scrapers/mni.js'
import { buscarTodosProcessosAdvogado, testarCredenciaisPJe, completarLoginComOtp } from './scrapers/pje-painel.js'
import type { OtpPendingData } from './scrapers/pje-painel.js'
import { buscarProcessosEproc, testarCredenciaisEproc, EPROC_INSTANCIAS } from './scrapers/eproc.js'
import { stats, clear as cacheClear, get as cacheGet, set as cacheSet } from './lib/cache.js'

const PORT = 3001
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]

// ── Credenciais MNI — mutáveis (atualizáveis via POST /configurar/mni) ─────────
const mniCreds = {
  cpf:   process.env.MNI_CPF   ?? '',
  senha: process.env.MNI_SENHA ?? '',
}
const isMniAtivo = () => mniCreds.cpf.length > 0 && mniCreds.senha.length > 0

// ── Credenciais eProc — fallback para MNI se não configuradas ──────────────────
const eprocCreds = {
  cpf:   process.env.EPROC_CPF   ?? '',
  senha: process.env.EPROC_SENHA ?? '',
}
const getEprocCpf   = () => eprocCreds.cpf   || mniCreds.cpf
const getEprocSenha = () => eprocCreds.senha || mniCreds.senha
const isEprocAtivo  = () => getEprocCpf().length > 0 && getEprocSenha().length > 0

// ── Sessões OTP pendentes (2FA Keycloak) — TTL 5 minutos ──────────────────────
interface PendingOtpSession {
  cpf:        string
  senha:      string
  otpData:    OtpPendingData
  expiresAt:  number
}
const pendingOtpSessions = new Map<string, PendingOtpSession>()

function gerarSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function limparSessoesExpiradas(): void {
  const agora = Date.now()
  for (const [id, s] of pendingOtpSessions) {
    if (s.expiresAt < agora) pendingOtpSessions.delete(id)
  }
}

// ── Persistência de credenciais no .env ────────────────────────────────────────
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ENV_PATH  = resolve(__dirname, '.env')

function salvarNoEnv(updates: Record<string, string>): void {
  let content = ''
  try { content = readFileSync(ENV_PATH, 'utf-8') } catch { /* .env ainda não existe */ }
  for (const [key, value] of Object.entries(updates)) {
    const rx = new RegExp(`^${key}=.*$`, 'm')
    if (rx.test(content)) content = content.replace(rx, `${key}=${value}`)
    else                   content += `\n${key}=${value}`
  }
  writeFileSync(ENV_PATH, content.trim() + '\n', 'utf-8')
}

// ── Helpers HTTP ───────────────────────────────────────────────────────────────
function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin  = req.headers.origin ?? 'http://localhost:5173'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin',  allowed)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

// ── Roteador principal ─────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  setCors(req, res)

  // Preflight CORS
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // ── GET /status ──────────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/status') {
    return sendJson(res, {
      online:              true,
      porta:               PORT,
      versao:              '1.3.0',
      mni_configurado:     isMniAtivo(),
      mni_tribunais:       Object.keys(MNI_ENDPOINTS).length,
      eproc_configurado:   isEprocAtivo(),
      eproc_instancias:    EPROC_INSTANCIAS.length,
      cache:               stats(),
      node:                process.version,
      timestamp:           new Date().toISOString(),
    })
  }

  // ── GET /cache/clear ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/cache/clear') {
    const removidas = cacheClear()
    return sendJson(res, { mensagem: `Cache limpo — ${removidas} entradas removidas` })
  }

  // ── POST /cpf — busca por CPF em todos os scrapers ───────────────────────────
  if (req.method === 'POST' && url.pathname === '/cpf') {
    try {
      const body = JSON.parse(await readBody(req))
      const cpf  = body?.cpf as string | undefined
      if (!cpf || cpf.replace(/\D/g, '').length < 11)
        return sendJson(res, { erro: 'CPF inválido — informe 11 dígitos' }, 400)

      const masked = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
      console.log(`[scraper] /cpf: ${masked}`)
      const resultado = await searchByCpf(cpf)
      console.log(`[scraper] /cpf: ${resultado.total} processos`)
      return sendJson(res, resultado)
    } catch (err: any) {
      console.error('[scraper] /cpf erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /processo — busca por número CNJ no DataJud ─────────────────────────
  if (req.method === 'POST' && url.pathname === '/processo') {
    try {
      const { numero } = JSON.parse(await readBody(req)) as { numero: string }
      if (!numero || numero.replace(/\D/g, '').length < 16)
        return sendJson(res, { erro: 'Número de processo inválido (mínimo 16 dígitos)' }, 400)

      console.log(`[scraper] /processo: ${numero}`)
      const processo = await buscarPorNumero(numero)
      return sendJson(res, { processo: processo ?? null })
    } catch (err: any) {
      console.error('[scraper] /processo erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /mni/processo — busca por número CNJ via MNI (PJe) ─────────────────
  // Requer MNI_CPF e MNI_SENHA em scraper-server/.env
  // Retorna dados completos incluindo partes com CPF (campo não disponível no DataJud público)
  if (req.method === 'POST' && url.pathname === '/mni/processo') {
    if (!isMniAtivo()) {
      return sendJson(res, {
        erro: 'MNI não configurado. Configure as credenciais em Configurações → Avançado → PJe.',
      }, 503)
    }
    try {
      const { numero, tribunal: tribunalBody } = JSON.parse(await readBody(req)) as {
        numero: string
        tribunal?: string
      }

      if (!numero || numero.replace(/\D/g, '').length < 16)
        return sendJson(res, { erro: 'Número de processo inválido (mínimo 16 dígitos)' }, 400)

      // Se tribunal não informado, tenta detectar pelo número CNJ
      const digits = numero.replace(/\D/g, '')
      let tribunal = (tribunalBody ?? '').toLowerCase()

      if (!tribunal && digits.length >= 16) {
        const seg = digits[13]
        const tr  = digits.substring(14, 16)
        const mapTJ: Record<string, string> = {
          '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
          '06': 'tjce', '07': 'tjdft','08': 'tjes', '09': 'tjgo', '10': 'tjma',
          '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
          '16': 'tjpe', '17': 'tjpi', '18': 'tjpr', '19': 'tjrj', '20': 'tjrn',
          '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjsp',
          '26': 'tjse', '27': 'tjto',
        }
        const mapTRF: Record<string, string> = {
          '01': 'trf1', '02': 'trf2', '03': 'trf3', '04': 'trf4', '05': 'trf5', '06': 'trf6',
        }
        const mapTRT: Record<string, string> = {
          '01': 'trt1', '02': 'trt2', '03': 'trt3', '04': 'trt4', '05': 'trt5',
          '06': 'trt6', '07': 'trt7', '08': 'trt8', '09': 'trt9', '10': 'trt10',
          '11': 'trt11','12': 'trt12','13': 'trt13','14': 'trt14','15': 'trt15',
          '16': 'trt16','17': 'trt17','18': 'trt18','19': 'trt19','20': 'trt20',
          '21': 'trt21','22': 'trt22','23': 'trt23','24': 'trt24',
        }
        if (seg === '8') tribunal = mapTJ[tr]  ?? ''
        else if (seg === '4') tribunal = mapTRF[tr] ?? ''
        else if (seg === '5') tribunal = mapTRT[tr] ?? ''
        else if (seg === '3') tribunal = 'stj'
        else if (seg === '1') tribunal = 'stf'
      }

      if (!tribunal)
        return sendJson(res, { erro: 'Tribunal não identificado. Informe o parâmetro "tribunal".' }, 400)

      if (!tribunalTemMNI(tribunal)) {
        return sendJson(res, {
          erro: `Tribunal "${tribunal.toUpperCase()}" não tem MNI/PJe mapeado. Use /processo para busca via DataJud.`,
          tribunal,
        }, 422)
      }

      console.log(`[scraper] /mni/processo: ${numero} → ${tribunal.toUpperCase()}`)
      const processo = await consultarProcessoMNI(numero, tribunal, mniCreds.cpf, mniCreds.senha)
      console.log(`[scraper] /mni/processo: ${processo ? `encontrado (${processo.partes?.length ?? 0} partes)` : 'não encontrado'}`)
      return sendJson(res, { processo: processo ?? null, tribunal })
    } catch (err: any) {
      console.error('[scraper] /mni/processo erro:', err.message)
      // Erros de auth não são 500 — são 401
      const status = err.message?.includes('Acesso negado') || err.message?.includes('credenciais') ? 401 : 500
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, status)
    }
  }

  // ── POST /enrich — CPF → nome da parte ──────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/enrich') {
    try {
      const { cpf } = JSON.parse(await readBody(req)) as { cpf: string }
      if (!cpf || cpf.replace(/\D/g, '').length < 11)
        return sendJson(res, { erro: 'CPF inválido' }, 400)

      const cpfLimpo = cpf.replace(/\D/g, '')
      console.log(`[scraper] /enrich: ${cpfLimpo.slice(0,3)}.***.***-${cpfLimpo.slice(-2)}`)

      // Fonte 1: DataJud quickCpfCheck (retorna null — LGPD, mantido para futuro)
      const { nome: nomeDataJud } = await quickCpfCheck(cpfLimpo)
      if (nomeDataJud) {
        return sendJson(res, { nome: nomeDataJud, fonte: 'datajud' })
      }

      // Fonte 2: cpfcnpj.com.br (requer CPFCNPJ_API_KEY no .env)
      const token = process.env.CPFCNPJ_API_KEY
      if (token) {
        try {
          const r = await fetch(`https://api.cpfcnpj.com.br/${token}/1/${cpfLimpo}`, {
            signal: AbortSignal.timeout(8_000),
          })
          if (r.ok) {
            const d = await r.json()
            if (d?.status === 1 && d?.nome) {
              console.log('[scraper] /enrich nome via cpfcnpj.com.br')
              return sendJson(res, { nome: d.nome as string, fonte: 'cpfcnpj' })
            }
          }
        } catch { /* fallthrough */ }
      }

      return sendJson(res, { nome: null, fonte: null })
    } catch (err: any) {
      console.error('[scraper] /enrich erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /nome — busca por nome da parte no DataJud ─────────────────────────
  if (req.method === 'POST' && url.pathname === '/nome') {
    try {
      const { nome } = JSON.parse(await readBody(req)) as { nome: string }
      if (!nome || nome.trim().length < 4)
        return sendJson(res, { erro: 'Nome inválido — mínimo 4 caracteres' }, 400)

      console.log(`[scraper] /nome: "${nome.slice(0, 30)}"`)
      const resultado = await searchByNome(nome.trim())
      console.log(`[scraper] /nome: ${resultado.processos.length} processos`)
      return sendJson(res, resultado)
    } catch (err: any) {
      console.error('[scraper] /nome erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /claude — proxy seguro para Claude API ───────────────────────────────
  if (req.method === 'POST' && url.pathname === '/claude') {
    try {
      const { prompt } = JSON.parse(await readBody(req)) as { prompt: string }
      if (!prompt) return sendJson(res, { erro: 'Campo prompt é obrigatório' }, 400)

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey)
        return sendJson(res, { erro: 'ANTHROPIC_API_KEY não configurada em scraper-server/.env' }, 500)

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':          apiKey,
          'anthropic-version':  '2023-06-01',
          'content-type':       'application/json',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages:   [{ role: 'user', content: prompt }],
        }),
      })

      return sendJson(res, await claudeRes.json(), claudeRes.status)
    } catch (err: any) {
      console.error('[scraper] /claude erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /dou — busca no DOU federal (Imprensa Nacional) ─────────────────────
  if (req.method === 'POST' && url.pathname === '/dou') {
    try {
      const { q, publishFrom, publishTo, secao = 'todos', size = 20 } = JSON.parse(await readBody(req)) as {
        q: string
        publishFrom?: string  // DD-MM-YYYY
        publishTo?: string
        secao?: string
        size?: number
      }

      if (!q || q.trim().length < 3)
        return sendJson(res, { erro: 'Parâmetro q inválido — mínimo 3 caracteres' }, 400)

      // Cache 1h por query exata
      const cacheKey = `dou_${q}_${publishFrom ?? 'all'}_${publishTo ?? 'all'}_${secao}`
      const cached   = cacheGet<object>(cacheKey)
      if (cached) return sendJson(res, cached)

      console.log(`[scraper] /dou: "${q.slice(0, 60)}"`)

      const params = new URLSearchParams({ q, sortType: '0', s: secao,
        exactDate: publishFrom ? 'personalizado' : 'all' })
      if (publishFrom) params.set('publishFrom', publishFrom)
      if (publishTo)   params.set('publishTo',   publishTo)

      const douRes = await fetch(`https://www.in.gov.br/consulta/-/buscar/dou?${params}`, {
        headers: {
          'User-Agent':      'Mozilla/5.0 (compatible; Ro-DOU/0.7; +https://github.com/gestaogovbr/Ro-dou)',
          'Accept':          'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Cache-Control':   'no-cache',
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (!douRes.ok) return sendJson(res, { erro: `IN retornou HTTP ${douRes.status}` }, 502)

      const html = await douRes.text()

      const totalPages = parseInt(html.match(/totalPages\s*:\s*(\d+)/)?.[1] ?? '0', 10)

      let hits: any[] = []
      for (const m of html.matchAll(/<script[^>]*type=['"]application\/json['"][^>]*>([\s\S]*?)<\/script>/gi)) {
        if (m[1].includes('jsonArray')) {
          try { hits = JSON.parse(m[1]).jsonArray ?? [] } catch { hits = [] }
          break
        }
      }

      const resultados = hits.slice(0, size).map((h: any) => ({
        titulo:    h.title ?? '',
        tipo:      h.artType ?? '',
        data:      h.pubDate ?? '',
        secao:     h.pubName ?? '',
        hierarquia: h.hierarchyStr ?? '',
        resumo:    (h.content ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        url:       h.urlTitle ? `https://www.in.gov.br/web/dou/-/${h.urlTitle}` : '',
      }))

      const resposta = { total: hits.length, totalPages, resultados }
      cacheSet(cacheKey, resposta, 60 * 60 * 1000) // 1h

      console.log(`[scraper] /dou: ${hits.length} hits (${totalPages} pgs)`)
      return sendJson(res, resposta)
    } catch (err: any) {
      console.error('[scraper] /dou erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /configurar/mni — salva credenciais PJe (testa antes de salvar) ────────
  // Se Keycloak exigir 2FA, retorna { aguardando_otp: true, session_id } para o frontend
  if (req.method === 'POST' && url.pathname === '/configurar/mni') {
    try {
      const { cpf, senha } = JSON.parse(await readBody(req)) as { cpf?: string; senha?: string }
      if (!cpf || !senha || cpf.replace(/\D/g, '').length < 11)
        return sendJson(res, { erro: 'CPF (11 dígitos) e senha são obrigatórios' }, 400)

      console.log(`[scraper] /configurar/mni: testando credenciais ${cpf.replace(/\D/g, '').slice(0,3)}.***.***-**`)
      const teste = await testarCredenciaisPJe(cpf, senha)

      // 2FA necessário → armazena sessão pendente e avisa o frontend
      if (teste.otpPending) {
        limparSessoesExpiradas()
        const sessionId = gerarSessionId()
        pendingOtpSessions.set(sessionId, {
          cpf, senha, otpData: teste.otpPending, expiresAt: Date.now() + 5 * 60 * 1000,
        })
        console.log(`[scraper] /configurar/mni: 2FA necessário — session ${sessionId}`)
        return sendJson(res, { aguardando_otp: true, session_id: sessionId, mensagem: teste.mensagem })
      }

      if (!teste.valido) {
        return sendJson(res, { erro: teste.mensagem, tribunal_testado: teste.tribunal }, 401)
      }

      salvarNoEnv({ MNI_CPF: cpf, MNI_SENHA: senha })
      mniCreds.cpf   = cpf
      mniCreds.senha = senha

      console.log(`[scraper] /configurar/mni: credenciais salvas — MNI agora ATIVO`)
      return sendJson(res, {
        sucesso: true, mensagem: teste.mensagem,
        tribunal_testado: teste.tribunal, mni_configurado: true,
        mni_tribunais: Object.keys(MNI_ENDPOINTS).length,
      })
    } catch (err: any) {
      console.error('[scraper] /configurar/mni erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /configurar/mni/otp — envia código 2FA para completar o login ────────
  if (req.method === 'POST' && url.pathname === '/configurar/mni/otp') {
    try {
      const { session_id, codigo } = JSON.parse(await readBody(req)) as { session_id?: string; codigo?: string }
      if (!session_id || !codigo || codigo.replace(/\D/g, '').length < 6)
        return sendJson(res, { erro: 'session_id e código 2FA (6 dígitos) são obrigatórios' }, 400)

      const sessao = pendingOtpSessions.get(session_id)
      if (!sessao) return sendJson(res, { erro: 'Sessão expirada ou inválida — inicie o processo novamente' }, 400)
      if (sessao.expiresAt < Date.now()) {
        pendingOtpSessions.delete(session_id)
        return sendJson(res, { erro: 'Sessão expirada (5 min) — inicie o processo novamente' }, 400)
      }

      console.log(`[scraper] /configurar/mni/otp: verificando código 2FA...`)
      const resultado = await completarLoginComOtp(sessao.otpData, codigo.trim())

      if (!resultado.valido) {
        return sendJson(res, { erro: resultado.mensagem }, 401)
      }

      // Salva credenciais após 2FA bem-sucedido
      pendingOtpSessions.delete(session_id)
      salvarNoEnv({ MNI_CPF: sessao.cpf, MNI_SENHA: sessao.senha })
      mniCreds.cpf   = sessao.cpf
      mniCreds.senha = sessao.senha

      console.log(`[scraper] /configurar/mni/otp: 2FA ok — credenciais salvas`)
      return sendJson(res, {
        sucesso: true, mensagem: resultado.mensagem,
        mni_configurado: true, mni_tribunais: Object.keys(MNI_ENDPOINTS).length,
      })
    } catch (err: any) {
      console.error('[scraper] /configurar/mni/otp erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /configurar/eproc — salva credenciais eProc ─────────────────────────
  if (req.method === 'POST' && url.pathname === '/configurar/eproc') {
    try {
      const { cpf, senha } = JSON.parse(await readBody(req)) as { cpf?: string; senha?: string }
      if (!cpf || !senha || cpf.replace(/\D/g, '').length < 11)
        return sendJson(res, { erro: 'CPF (11 dígitos) e senha são obrigatórios' }, 400)

      console.log(`[scraper] /configurar/eproc: testando credenciais...`)
      const teste = await testarCredenciaisEproc(cpf, senha)

      if (!teste.valido) {
        return sendJson(res, { erro: teste.mensagem }, 401)
      }

      salvarNoEnv({ EPROC_CPF: cpf, EPROC_SENHA: senha })
      eprocCreds.cpf   = cpf
      eprocCreds.senha = senha

      console.log(`[scraper] /configurar/eproc: credenciais salvas`)
      return sendJson(res, { sucesso: true, mensagem: teste.mensagem, eproc_configurado: true })
    } catch (err: any) {
      console.error('[scraper] /configurar/eproc erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // ── POST /advogado/processos — todos os processos do advogado em tribunais PJe ──
  // Usa credenciais MNI_CPF + MNI_SENHA para autenticar via PDPJ-Br SSO ou Basic Auth.
  // Parâmetros opcionais no body: { oab?, uf? } para busca adicional no DataJud.
  if (req.method === 'POST' && url.pathname === '/advogado/processos') {
    if (!isMniAtivo()) {
      return sendJson(res, {
        erro: 'Credenciais MNI não configuradas. Configure em Configurações → Avançado → PJe.',
      }, 503)
    }
    try {
      const body = JSON.parse(await readBody(req)) as { oab?: string; uf?: string }
      console.log('[scraper] /advogado/processos: iniciando busca em todos os tribunais PJe...')

      // Busca PJe + eProc + DataJud em paralelo
      const painelPromise = buscarTodosProcessosAdvogado(mniCreds.cpf, mniCreds.senha)
      const eprocPromise  = isEprocAtivo()
        ? buscarProcessosEproc(getEprocCpf(), getEprocSenha())
        : Promise.resolve({ processos: [], tribunais: [] })
      const oabPromise    = body.oab && body.uf
        ? buscarPorOAB(body.oab, body.uf)
        : Promise.resolve([])

      const [painel, eproc, processosOAB] = await Promise.all([painelPromise, eprocPromise, oabPromise])

      // Mescla deduplificando por número CNJ
      const numerosExistentes = new Set(painel.processos.map(p => p.numero_processo.replace(/\D/g, '')))

      const novosEproc = eproc.processos.filter(p => !numerosExistentes.has(p.numero_processo.replace(/\D/g, '')))
      novosEproc.forEach(p => numerosExistentes.add(p.numero_processo.replace(/\D/g, '')))

      const novosOAB = processosOAB.filter(p => !numerosExistentes.has(p.numero_processo.replace(/\D/g, '')))

      const todosProcessos = [...painel.processos, ...novosEproc, ...novosOAB]

      console.log(
        `[scraper] /advogado/processos: ${todosProcessos.length} processos ` +
        `(pje: ${painel.total}, eproc: ${novosEproc.length}, datajud-oab: ${novosOAB.length}) ` +
        `auth=${painel.autenticacao}`
      )

      return sendJson(res, {
        processos:    todosProcessos,
        total:        todosProcessos.length,
        gerado_em:    painel.gerado_em,
        autenticacao: painel.autenticacao,
        tribunais:    [...painel.tribunais, ...eproc.tribunais.map(t => ({ ...t, metodo: 'eproc' as const }))],
        datajud_oab:  novosOAB.length,
        eproc_total:  novosEproc.length,
      })
    } catch (err: any) {
      console.error('[scraper] /advogado/processos erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  const mniStatus = isMniAtivo()
    ? `MNI ativo (${Object.keys(MNI_ENDPOINTS).length} tribunais)`
    : 'MNI inativo (configure via UI: Config → Avancado)'

  const eprocStatus = isEprocAtivo()
    ? `eProc ativo (${EPROC_INSTANCIAS.length} instâncias)`
    : 'eProc: use MNI creds ou configure EPROC_SENHA'

  console.log(`
╔══════════════════════════════════════════════════╗
║  Scraper Server — SDR Jurídico  v1.3             ║
║  Porta: ${PORT}  |  Node.js ${process.version.padEnd(10)}           ║
║                                                  ║
║  Endpoints:                                      ║
║    POST /cpf                → buscar por CPF     ║
║    POST /processo           → CNJ (DataJud)      ║
║    POST /mni/processo       → CNJ (PJe/MNI)     ║
║    POST /advogado/processos → PJe + eProc        ║
║    POST /configurar/mni     → salvar creds PJe   ║
║    POST /configurar/mni/otp → código 2FA         ║
║    POST /configurar/eproc   → salvar creds eProc ║
║    POST /enrich             → CPF → nome         ║
║    POST /nome               → processos por nome ║
║    POST /claude             → proxy Claude API   ║
║    POST /dou                → DOU federal (IN)   ║
║    GET  /status             → health check       ║
║    GET  /cache/clear        → limpar cache       ║
║                                                  ║
║  ${mniStatus.padEnd(48)}║
║  ${eprocStatus.padEnd(48)}║
╚══════════════════════════════════════════════════╝
`)
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso. Encerre o processo anterior.`)
    process.exit(1)
  }
  console.error('[scraper-server] Erro fatal:', err)
})
