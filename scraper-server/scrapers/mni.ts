// MNI — Modelo Nacional de Interoperabilidade (PJe/CNJ)
// Protocolo SOAP 2.2.2 para consulta de processos por número com credencial de advogado.
// Referência: https://www.cnj.jus.br/tecnologia-da-informacao-e-comunicacao/mni/
//
// COBERTURA: somente tribunais com PJe implantado.
// TRF1, TRF4, TRF5, TJSP, TJSC usam eProc/eSAJ — protocolo diferente, não coberto aqui.

import type { ScraperProcesso } from '../lib/utils.js'
import { get as cacheGet, set as cacheSet } from '../lib/cache.js'
import { getGovFetch } from '../lib/govFetch.js'

const MNI_NS    = 'http://www.cnj.jus.br/intercomunicacao-2.2.2'
const SOAP_NS   = 'http://schemas.xmlsoap.org/soap/envelope/'
const SOAP_ACTION = `"${MNI_NS}/consultarProcesso"`

// ── Endpoints MNI por tribunal ────────────────────────────────────────────────
// Padrão: https://pje.{sigla}.jus.br/pje/intercomunicacao
// Verificar WSDL: <URL>?wsdl
export const MNI_ENDPOINTS: Record<string, string> = {
  // Tribunais Estaduais com PJe
  tjmg:  'https://pje.tjmg.jus.br/pje/intercomunicacao',
  tjba:  'https://pje.tjba.jus.br/pje/intercomunicacao',
  tjce:  'https://pje.tjce.jus.br/pje/intercomunicacao',
  tjdft: 'https://pje.tjdft.jus.br/pje/intercomunicacao',
  tjgo:  'https://pje.tjgo.jus.br/pje/intercomunicacao',
  tjma:  'https://pje.tjma.jus.br/pje/intercomunicacao',
  tjms:  'https://pje.tjms.jus.br/pje/intercomunicacao',
  tjmt:  'https://pje.tjmt.jus.br/pje/intercomunicacao',
  tjpa:  'https://pje.tjpa.jus.br/pje/intercomunicacao',
  tjpe:  'https://pje.tjpe.jus.br/pje/intercomunicacao',
  tjpr:  'https://pje.tjpr.jus.br/pje/intercomunicacao',
  tjrj:  'https://pje.tjrj.jus.br/pje/intercomunicacao',
  tjrs:  'https://pje.tjrs.jus.br/pje/intercomunicacao',
  tjse:  'https://pje.tjse.jus.br/pje/intercomunicacao',
  tjal:  'https://pje.tjal.jus.br/pje/intercomunicacao',
  tjpi:  'https://pje.tjpi.jus.br/pje/intercomunicacao',
  tjro:  'https://pje.tjro.jus.br/pje/intercomunicacao',
  tjto:  'https://pje.tjto.jus.br/pje/intercomunicacao',
  // Justiça Federal com PJe
  trf3:  'https://pje1g.trf3.jus.br/pje/intercomunicacao',
  trf6:  'https://pje.trf6.jus.br/pje/intercomunicacao',
  // Justiça do Trabalho com PJe
  trt1:  'https://pje.trt1.jus.br/pje/intercomunicacao',
  trt2:  'https://pje.trt2.jus.br/pje/intercomunicacao',
  trt3:  'https://pje.trt3.jus.br/pje/intercomunicacao',
  trt6:  'https://pje.trt6.jus.br/pje/intercomunicacao',
  trt9:  'https://pje.trt9.jus.br/pje/intercomunicacao',
  trt15: 'https://pje.trt15.jus.br/pje/intercomunicacao',
  // Superiores
  stj:   'https://pje.stj.jus.br/pje/intercomunicacao',
  tst:   'https://pje.tst.jus.br/pje/intercomunicacao',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Formata número CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
function formatarCNJ(numero: string): string {
  const d = numero.replace(/\D/g, '')
  if (d.length !== 20) return numero
  return `${d.slice(0,7)}-${d.slice(7,9)}.${d.slice(9,13)}.${d.slice(13,14)}.${d.slice(14,16)}.${d.slice(16,20)}`
}

/** Extrai texto interno de uma tag XML (namespace-agnostic) */
function tagText(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<(?:[^:>]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[^:>]+:)?${name}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

/** Extrai um atributo de um fragmento XML */
function tagAttr(fragment: string, attrName: string): string {
  const m = fragment.match(new RegExp(`\\b${attrName}="([^"]*)"`, 'i'))
  return m?.[1] ?? ''
}

/** Extrai todos os blocos de uma tag como strings */
function allBlocks(xml: string, name: string): string[] {
  const results: string[] = []
  const rx = new RegExp(`<(?:[^:>]+:)?${name}(?:\\s[^>]*)?>(?:[\\s\\S]*?)<\\/(?:[^:>]+:)?${name}>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = rx.exec(xml)) !== null) results.push(m[0])
  return results
}

// ── SOAP envelope ─────────────────────────────────────────────────────────────

function buildEnvelope(numeroCNJ: string, cpf: string, senha: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '')
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_NS}" xmlns:mni="${MNI_NS}">
  <soap:Header>
    <mni:cabecalho>
      <mni:remetente>
        <mni:Nome>ADVOGADO</mni:Nome>
        <mni:Login>${cpfLimpo}</mni:Login>
        <mni:Senha>${escapeXml(senha)}</mni:Senha>
      </mni:remetente>
      <mni:tipoServico>consultarProcesso</mni:tipoServico>
      <mni:versaoServico>2.2.2</mni:versaoServico>
    </mni:cabecalho>
  </soap:Header>
  <soap:Body>
    <mni:consultarProcessoRequest>
      <mni:numeroProcesso>${numeroCNJ}</mni:numeroProcesso>
      <mni:movimentos>true</mni:movimentos>
      <mni:incluirDocumentos>false</mni:incluirDocumentos>
    </mni:consultarProcessoRequest>
  </soap:Body>
</soap:Envelope>`
}

// ── Parser de resposta ────────────────────────────────────────────────────────

function parseResponse(xml: string, tribunal: string, numeroOriginal: string): ScraperProcesso | null {
  // Verifica Fault SOAP (auth inválida, processo não encontrado, etc.)
  if (/<(?:[^:>]+:)?[Ff]ault[\s>]/.test(xml)) {
    const msg =
      tagText(xml, 'faultstring') ||
      tagText(xml, 'message')     ||
      tagText(xml, 'mensagem')    ||
      'Erro SOAP'
    throw new Error(`MNI ${tribunal.toUpperCase()}: ${msg}`)
  }

  // Localiza a tag dadosBasicos com seus atributos
  const dbMatch = xml.match(/<(?:[^:>]+:)?dadosBasicos\s([^>]*)>/i)
  if (!dbMatch) return null // processo não localizado

  const dbFrag = dbMatch[0]
  const numero         = tagAttr(dbFrag, 'numero') || numeroOriginal
  const dataAjuizamento = tagAttr(dbFrag, 'dataAjuizamento')
  const classeProcessual = tagAttr(dbFrag, 'classeProcessual')

  // Valor da causa
  const valorStr = tagAttr(dbFrag, 'valorCausa') || tagText(xml, 'valorCausa')
  const valorCausa = valorStr ? parseFloat(valorStr.replace(',', '.')) : undefined

  // Partes (polos AT=ativo, PA=passivo, outros)
  const partes: NonNullable<ScraperProcesso['partes']> = []
  for (const poloBlock of allBlocks(xml, 'polo')) {
    const tipo = tagAttr(poloBlock, 'tipo')
    const polo: 'ativo' | 'passivo' | 'outro' =
      tipo === 'AT' ? 'ativo' : tipo === 'PA' ? 'passivo' : 'outro'
    for (const parteBlock of allBlocks(poloBlock, 'parte')) {
      const nome = tagText(parteBlock, 'nome')
      if (nome) partes.push({ nome, polo })
    }
  }

  // Assuntos
  const assuntos: string[] = []
  for (const a of allBlocks(xml, 'assunto')) {
    const desc = tagAttr(a, 'descricao') || tagText(a, 'descricao')
    if (desc && !assuntos.includes(desc)) assuntos.push(desc)
  }

  // Movimentos (últimos 5)
  const movimentos: NonNullable<ScraperProcesso['movimentos']> = []
  for (const m of allBlocks(xml, 'movimento')) {
    const dataHora = tagAttr(m, 'dataHora')
    const descricao =
      tagAttr(m, 'descricao') ||
      tagText(m, 'complemento') ||
      tagText(m, 'nome') ||
      ''
    if (descricao || dataHora) movimentos.push({ data: dataHora, descricao })
  }

  return {
    numero_processo:    numero,
    tribunal:           tribunal.toUpperCase(),
    classe:             classeProcessual,
    assunto:            assuntos[0] ?? '',
    data_ajuizamento:   dataAjuizamento,
    ultima_atualizacao: movimentos.at(-1)?.data ?? '',
    valor_causa:        valorCausa,
    grau:               '',
    partes,
    movimentos:         movimentos.slice(-5),
    fonte:              `mni-${tribunal}`,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Consulta um processo no PJe via MNI com credencial de advogado.
 *
 * - Retorna `null` se o processo não for encontrado no tribunal.
 * - Lança `Error` em caso de falha de autenticação ou tribunal indisponível.
 * - Resultados são cacheados por 1h.
 */
export async function consultarProcessoMNI(
  numero: string,
  tribunal: string,
  cpf: string,
  senha: string,
): Promise<ScraperProcesso | null> {
  const t   = tribunal.toLowerCase()
  const url = MNI_ENDPOINTS[t]
  if (!url) {
    throw new Error(`Tribunal "${tribunal.toUpperCase()}" não tem endpoint MNI mapeado. Tribunais suportados: ${Object.keys(MNI_ENDPOINTS).join(', ')}`)
  }

  const numeroCNJ  = formatarCNJ(numero)
  const cacheKey   = `mni_${t}_${numero.replace(/\D/g, '')}`
  const cached     = cacheGet<ScraperProcesso>(cacheKey)
  if (cached) return cached

  const gf  = await getGovFetch()
  const res = await gf(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction':   SOAP_ACTION,
      'Accept':       'text/xml, application/xml',
    },
    body:   buildEnvelope(numeroCNJ, cpf, senha),
    signal: AbortSignal.timeout(25_000),
  })

  const xml = await res.text()

  // SOAP retorna HTTP 500 para Fault — tratar antes de lançar por status
  if (!res.ok && res.status !== 500) {
    throw new Error(`HTTP ${res.status} de ${tribunal.toUpperCase()}: ${xml.slice(0, 150)}`)
  }

  const processo = parseResponse(xml, t, numeroCNJ)
  if (processo) {
    cacheSet(cacheKey, processo, 60 * 60 * 1000) // 1h
  }
  return processo
}

/** Retorna true se o tribunal tem endpoint MNI configurado */
export function tribunalTemMNI(tribunal: string): boolean {
  return tribunal.toLowerCase() in MNI_ENDPOINTS
}
