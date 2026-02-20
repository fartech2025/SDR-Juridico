// Portal da Transparência — API pública gratuita (requer chave Gov.br)
// Registro: https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email

const BASE = 'https://api.portaldatransparencia.gov.br/api-de-dados'

function getChave(): string | null {
  return import.meta.env.VITE_PORTAL_TRANSPARENCIA_KEY ?? null
}

export function isConfigurado(): boolean {
  return !!getChave()
}

function headers(): Record<string, string> {
  return {
    'chave-api-dados': getChave() ?? '',
    Accept: 'application/json',
  }
}

export interface CeisSancao {
  nomeRazaoSocial: string
  cpfCnpj: string
  tipoSancao: string
  dataInicioSancao: string
  dataFimSancao: string
  orgaoSancionador: string
  ufOrgaoSancionador: string
  fundamentacaoLegal: string
  dataPublicacao: string
}

export interface CeafExpulsao {
  nome: string
  cargo: string
  funcao: string
  orgao: string
  uf: string
  numeroPortaria: string
  numeroProcessoAdministrativo: string
  fundamentacaoLegal: string
  tipo: string
}

export interface ServidorFederal {
  nome: string
  cpf: string
  cargo: string
  descricaoCargo?: string
  orgao: string
  situacaoVinculo?: string
  remuneracao?: number
}

/** Consulta CEIS — Lista de Empresas e Pessoas Inidôneas e Suspensas */
export async function buscarCEIS(cpfCnpj: string): Promise<CeisSancao[]> {
  if (!isConfigurado()) return []
  try {
    const cpfLimpo = cpfCnpj.replace(/\D/g, '')
    const res = await fetch(
      `${BASE}/ceis?cpfCnpj=${cpfLimpo}&pagina=1&tamanhoPagina=50`,
      { headers: headers(), signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data?.data ?? []
  } catch {
    return []
  }
}

/** Consulta CEAF — Cadastro de Expulsões da Administração Federal */
export async function buscarCEAF(cpf: string): Promise<CeafExpulsao[]> {
  if (!isConfigurado()) return []
  try {
    const cpfLimpo = cpf.replace(/\D/g, '')
    const res = await fetch(
      `${BASE}/ceaf?cpf=${cpfLimpo}&pagina=1`,
      { headers: headers(), signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data?.data ?? []
  } catch {
    return []
  }
}

/** Consulta Servidores Federais Ativos por CPF */
export async function buscarServidores(cpf: string): Promise<ServidorFederal[]> {
  if (!isConfigurado()) return []
  try {
    const cpfLimpo = cpf.replace(/\D/g, '')
    const res = await fetch(
      `${BASE}/servidores?cpfServidorAtivo=${cpfLimpo}&pagina=1`,
      { headers: headers(), signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data?.data ?? []
  } catch {
    return []
  }
}

/** Faz todas as consultas do Portal em paralelo */
export async function consultarTudo(cpf: string): Promise<{
  ceis: CeisSancao[]
  ceaf: CeafExpulsao[]
  servidores: ServidorFederal[]
}> {
  const [ceisResult, ceafResult, servidoresResult] = await Promise.allSettled([
    buscarCEIS(cpf),
    buscarCEAF(cpf),
    buscarServidores(cpf),
  ])

  return {
    ceis: ceisResult.status === 'fulfilled' ? ceisResult.value : [],
    ceaf: ceafResult.status === 'fulfilled' ? ceafResult.value : [],
    servidores: servidoresResult.status === 'fulfilled' ? servidoresResult.value : [],
  }
}
