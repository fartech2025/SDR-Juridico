/**
 * Serviço de Consulta CNPJ - Receita Federal
 * Utiliza dados abertos da Receita Federal do Brasil
 */

import { supabase } from '@/lib/supabaseClient'

export interface DadosCNPJ {
  cnpj: string
  razao_social?: string
  nome_fantasia?: string
  porte?: string
  situacao_cadastral?: string
  data_situacao_cadastral?: string
  capital_social?: number
  natureza_juridica?: string
  atividade_principal?: string
  dados_completos?: any
}

/**
 * Consulta CNPJ no cache ou na API pública da Receita Federal
 */
export async function consultarCNPJ(cnpj: string): Promise<DadosCNPJ | null> {
  // Limpar formatação do CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, '')
  
  if (cnpjLimpo.length !== 14) {
    console.warn('CNPJ inválido:', cnpj)
    return null
  }

  // Verificar cache primeiro
  const cached = await buscarNoCache(cnpjLimpo)
  if (cached) {
    return cached
  }

  // Consultar API pública
  try {
    const dados = await consultarAPIReceita(cnpjLimpo)
    if (dados) {
      await salvarNoCache(dados)
      return dados
    }
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error)
  }

  return null
}

/**
 * Busca CNPJ no cache do Supabase
 */
async function buscarNoCache(cnpj: string): Promise<DadosCNPJ | null> {
  const { data, error } = await supabase
    .from('cache_cnpj')
    .select('*')
    .eq('cnpj', cnpj)
    .single()

  if (error || !data) return null

  // Verificar se cache está desatualizado (>30 dias)
  const consultadoEm = new Date(data.consultado_em)
  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

  if (consultadoEm < trintaDiasAtras) {
    return null // Cache expirado
  }

  return data
}

/**
 * Salva dados do CNPJ no cache
 */
async function salvarNoCache(dados: DadosCNPJ): Promise<void> {
  await supabase
    .from('cache_cnpj')
    .upsert({
      ...dados,
      consultado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }, {
      onConflict: 'cnpj'
    })
}

/**
 * Consulta API pública da Receita Federal
 * Fonte: https://brasilapi.com.br/docs#tag/CNPJ
 */
async function consultarAPIReceita(cnpj: string): Promise<DadosCNPJ | null> {
  try {
    // Usando BrasilAPI como proxy dos dados públicos da Receita
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social || data.nome_empresarial,
      nome_fantasia: data.nome_fantasia,
      porte: formatarPorte(data.porte),
      situacao_cadastral: data.descricao_situacao_cadastral,
      data_situacao_cadastral: data.data_situacao_cadastral,
      capital_social: parseFloat(data.capital_social) || 0,
      natureza_juridica: data.natureza_juridica,
      atividade_principal: data.cnae_fiscal_descricao,
      dados_completos: data
    }
  } catch (error) {
    console.error('Erro na API Receita:', error)
    return null
  }
}

/**
 * Formata porte da empresa
 */
function formatarPorte(porte: string): string {
  const portes: Record<string, string> = {
    '00': 'Não informado',
    '01': 'Microempresa',
    '03': 'Empresa de Pequeno Porte',
    '05': 'Demais'
  }
  return portes[porte] || porte
}

/**
 * Extrai CNPJs de um texto
 */
export function extrairCNPJs(texto: string): string[] {
  if (!texto) return []
  
  // Regex para CNPJ (com ou sem formatação)
  const regex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g
  const matches = texto.match(regex) || []
  
  return matches.map(cnpj => cnpj.replace(/\D/g, ''))
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const limpo = cnpj.replace(/\D/g, '')
  
  if (limpo.length !== 14) return cnpj
  
  return limpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Enriquece texto substituindo CNPJs por links com razão social
 */
export async function enriquecerTextoCNPJ(texto: string): Promise<string> {
  const cnpjs = extrairCNPJs(texto)
  
  if (cnpjs.length === 0) return texto
  
  let textoEnriquecido = texto
  
  for (const cnpj of cnpjs) {
    const dados = await consultarCNPJ(cnpj)
    if (dados?.razao_social) {
      const cnpjFormatado = formatarCNPJ(cnpj)
      textoEnriquecido = textoEnriquecido.replace(
        new RegExp(cnpjFormatado, 'g'),
        `${dados.razao_social} (CNPJ: ${cnpjFormatado})`
      )
    }
  }
  
  return textoEnriquecido
}
