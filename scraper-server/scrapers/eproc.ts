// eProc — sistema de processo eletrônico usado por TRF4, TRF5, TJMG e outros
//
// Autenticação: formulário PHP (frmUsuario + frmSenha) — diferente do PJe/Keycloak
// Cada instância é um servidor PHP independente (não há SSO central)
//
// Cobertura atual:
//   TJMG 1G: eproc1g.tjmg.jus.br
//   TJMG 2G: eproc2g.tjmg.jus.br
//   TRF4:    eproc.trf4.jus.br
//   TRF5:    eproc.trf5.jus.br

import type { ScraperProcesso } from '../lib/utils.js'
import { getGovFetch } from '../lib/govFetch.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

// ── Instâncias conhecidas ──────────────────────────────────────────────────────

export const EPROC_INSTANCIAS: Array<{ tribunal: string; base: string }> = [
  { tribunal: 'TJMG', base: 'https://eproc1g.tjmg.jus.br/eproc' },
  { tribunal: 'TJMG', base: 'https://eproc2g.tjmg.jus.br/eproc' },
  { tribunal: 'TRF4', base: 'https://eproc.trf4.jus.br/eproc'   },
  { tribunal: 'TRF5', base: 'https://eproc.trf5.jus.br/eproc'   },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Ingere Set-Cookie headers e retorna string Cookie para reutilização */
function ingestCookies(headers: Headers, existente = ''): string {
  const jar = new Map<string, string>()

  // Popula com cookies existentes
  for (const pair of existente.split(';')) {
    const trimmed = pair.trim()
    const eq = trimmed.indexOf('=')
    if (eq > 0) jar.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim())
  }

  // Ingere novos Set-Cookie
  const values: string[] =
    typeof (headers as any).getSetCookie === 'function'
      ? (headers as any).getSetCookie()
      : (headers.get('set-cookie') ?? '').split(/,(?=[^\s])/)

  for (const raw of values) {
    const pair = raw.split(';')[0].trim()
    const eq   = pair.indexOf('=')
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }

  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

// ── Login ──────────────────────────────────────────────────────────────────────

/**
 * Realiza login no eProc.
 * Retorna a string de cookies de sessão, ou null em falha.
 *
 * Fluxo:
 *   1. GET /externo_controlador.php?acao=login → obter PHPSESSID inicial
 *   2. POST /externo_controlador.php?acao=entrar com frmUsuario + frmSenha
 *   3. Verificar redirecionamento para painel (indica sucesso)
 */
async function loginEproc(base: string, cpf: string, senha: string): Promise<string | null> {
  const cpfLimpo = cpf.replace(/\D/g, '')
  try {
    const gf = await getGovFetch()

    // Passo 1: GET página de login → pega cookie de sessão inicial
    const r1 = await gf(`${base}/externo_controlador.php?acao=login`, {
      redirect: 'follow',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
    })
    let cookies = ingestCookies(r1.headers)

    // Passo 2: POST credenciais
    const r2 = await gf(`${base}/externo_controlador.php?acao=entrar`, {
      method:   'POST',
      redirect: 'manual',
      headers: {
        'User-Agent':   UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie:         cookies,
        Referer:        `${base}/externo_controlador.php?acao=login`,
      },
      body: new URLSearchParams({ frmUsuario: cpfLimpo, frmSenha: senha }),
      signal: AbortSignal.timeout(15_000),
    })
    cookies = ingestCookies(r2.headers, cookies)

    const location = r2.headers.get('location') ?? ''

    // Login bem-sucedido → redireciona para painel ou principal
    if (r2.status === 302 && location && !location.includes('acao=login')) {
      return cookies
    }

    // Alguns servidores retornam 200 mas redirecionam via meta-refresh
    if (r2.status === 200) {
      const html2 = await r2.text()
      if (html2.includes('painel') || html2.includes('principal')) return cookies
      // Erro de login — HTML contém mensagem de erro
      return null
    }

    return null
  } catch (err: any) {
    console.warn(`[eproc] ${base}: erro no login — ${err.message}`)
    return null
  }
}

// ── Listagem de processos ──────────────────────────────────────────────────────

/** Extrai números CNJ do HTML do painel */
function extrairProcessos(html: string, tribunal: string, base: string): ScraperProcesso[] {
  const processos: ScraperProcesso[] = []
  const seen = new Set<string>()

  // Regex para número CNJ: 0000000-00.0000.0.00.0000
  const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g
  let m: RegExpExecArray | null

  while ((m = cnjRegex.exec(html)) !== null) {
    const numero = m[0]
    const chave  = numero.replace(/\D/g, '')
    if (seen.has(chave)) continue
    seen.add(chave)

    // Tenta extrair classe/assunto do contexto ao redor do número (±300 chars)
    const start  = Math.max(0, m.index - 300)
    const ctx    = html.slice(start, m.index + 400).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

    // Classe e assunto aparecem em células próximas ao número
    const classeMatch  = ctx.match(/(?:classe|ação|Ação)[:\s]+([^\n\|]{3,60})/i)
    const assuntoMatch = ctx.match(/(?:assunto)[:\s]+([^\n\|]{3,60})/i)
    const dataMatch    = ctx.match(/(\d{2}\/\d{2}\/\d{4})/)

    processos.push({
      numero_processo:  numero,
      tribunal:         tribunal.toUpperCase(),
      classe:           classeMatch?.[1]?.trim(),
      assunto:          assuntoMatch?.[1]?.trim(),
      data_ajuizamento: dataMatch ? dataMatch[1].split('/').reverse().join('-') : undefined,
      grau:             base.includes('2g') ? '2' : '1',
      fonte:            `eproc-${tribunal.toLowerCase()}`,
    })
  }

  return processos
}

async function listarProcessosEproc(
  base:     string,
  tribunal: string,
  cookies:  string,
): Promise<ScraperProcesso[]> {
  const painelPaths = [
    '/externo_controlador.php?acao=painel_advogado',
    '/externo_controlador.php?acao=painel_advogado_consultar',
    '/externo_controlador.php?acao=principal',
  ]

  const gf = await getGovFetch()

  for (const path of painelPaths) {
    try {
      const res = await gf(`${base}${path}`, {
        headers: { 'User-Agent': UA, Cookie: cookies },
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) continue
      const html = await res.text()
      if (!html.includes('processo') && !html.includes('Processo')) continue

      const processos = extrairProcessos(html, tribunal, base)
      if (processos.length > 0) {
        // Tenta segunda página se houver paginação
        const temProxima = /próxim|nextPage|page=2/i.test(html)
        if (temProxima) {
          const res2 = await gf(`${base}${path}&pagina=2`, {
            headers: { 'User-Agent': UA, Cookie: cookies },
            signal: AbortSignal.timeout(20_000),
          }).catch(() => null)
          if (res2?.ok) {
            const html2 = await res2.text()
            processos.push(...extrairProcessos(html2, tribunal, base))
          }
        }
        return processos
      }
    } catch { /* próximo path */ }
  }
  return []
}

// ── API pública ────────────────────────────────────────────────────────────────

export interface EprocResult {
  processos: ScraperProcesso[]
  tribunais: { tribunal: string; base: string; total: number; erro?: string }[]
}

/**
 * Busca processos do advogado em todas as instâncias eProc configuradas.
 * Usa cpf + senha (EPROC_SENHA se configurado, senão MNI_SENHA como fallback).
 */
export async function buscarProcessosEproc(
  cpf:   string,
  senha: string,
): Promise<EprocResult> {
  const todosProcessos: ScraperProcesso[] = []
  const resumos: EprocResult['tribunais'] = []

  await Promise.allSettled(
    EPROC_INSTANCIAS.map(async ({ tribunal, base }) => {
      const cookies = await loginEproc(base, cpf, senha)
      if (!cookies) {
        resumos.push({ tribunal, base, total: 0, erro: 'login falhou' })
        return
      }

      const processos = await listarProcessosEproc(base, tribunal, cookies)
      todosProcessos.push(...processos)
      resumos.push({ tribunal, base, total: processos.length })
    })
  )

  // Deduplica
  const seen = new Set<string>()
  const unicos = todosProcessos.filter(p => {
    const k = p.numero_processo.replace(/\D/g, '')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return { processos: unicos, tribunais: resumos }
}

/**
 * Testa credenciais eProc usando TJMG 1G como referência.
 */
export async function testarCredenciaisEproc(
  cpf:   string,
  senha: string,
): Promise<{ valido: boolean; mensagem: string }> {
  const base = EPROC_INSTANCIAS.find(i => i.base.includes('eproc1g.tjmg'))?.base
  if (!base) return { valido: false, mensagem: 'Instância TJMG não configurada' }

  const cookies = await loginEproc(base, cpf, senha)
  if (cookies) return { valido: true,  mensagem: 'Login efetuado com sucesso no TJMG eProc' }
  return          { valido: false, mensagem: 'Credenciais inválidas para o eProc TJMG — verifique usuário e senha' }
}
