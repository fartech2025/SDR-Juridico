// Serviço para integração com Querido Diário (Diários Oficiais)
// API: https://api.queridodiario.ok.org.br/docs

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/querido-diario-proxy`;

// Mapeamento de códigos IBGE por estado (principais cidades)
export const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

// Tipos
export interface GazetteItem {
  territory_id: string;
  territory_name: string;
  state_code: string;
  date: string;
  scraped_at: string;
  url: string;
  txt_url: string | null;
  excerpts: string[];
  edition: string | null;
  is_extra_edition: boolean | null;
}

export interface GazetteSearchResponse {
  total_gazettes: number;
  gazettes: GazetteItem[];
}

export interface CompanyInfo {
  cnpj_completo: string;
  cnpj_completo_apenas_numeros: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  situacao_cadastral: string | null;
  data_situacao_cadastral: string | null;
  data_inicio_atividade: string | null;
  cnae: string | null;
  cnae_fiscal_secundario: string | null;
  natureza_juridica: string | null;
  capital_social: string | null;
  porte: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  ddd_telefone_1: string | null;
  correio_eletronico: string | null;
  opcao_pelo_simples: string | null;
  opcao_pelo_mei: string | null;
}

export interface Partner {
  razao_social: string | null;
  cnpj_cpf_socio: string | null;
  qualificacao_socio: string | null;
  data_entrada_sociedade: string | null;
  faixa_etaria: string | null;
}

export interface PartnersResponse {
  total_partners: number;
  partners: Partner[];
}

// Função auxiliar para fazer requisições
async function fetchQueridoDiario(params: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams(params);
  const url = `${FUNCTION_URL}?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }
  
  return response.json();
}

/**
 * Busca publicações em diários oficiais por termo de busca
 */
export async function buscarDiariosOficiais(
  querystring: string,
  options: {
    territoryIds?: string[];
    stateCodes?: string[];  // Novo: filtrar por siglas de estados (SP, RJ, MG, etc.)
    publishedSince?: string;
    publishedUntil?: string;
    size?: number;
    offset?: number;
  } = {}
): Promise<GazetteSearchResponse> {
  const params: Record<string, string> = {
    endpoint: 'gazettes',
    querystring,
    size: String(options.size || 10),
    offset: String(options.offset || 0),
    sort_by: 'descending_date',
    excerpt_size: '500',
    number_of_excerpts: '3'
  };
  
  if (options.territoryIds?.length) {
    params.territory_ids = options.territoryIds.join(',');
  }
  if (options.publishedSince) {
    params.published_since = options.publishedSince;
  }
  if (options.publishedUntil) {
    params.published_until = options.publishedUntil;
  }
  
  // A API não suporta filtro por estado diretamente, então filtramos no cliente
  const response = await fetchQueridoDiario(params);
  
  // Filtrar por estado se especificado
  if (options.stateCodes?.length && response.gazettes) {
    const stateCodesUpper = options.stateCodes.map(s => s.toUpperCase());
    response.gazettes = response.gazettes.filter((g: GazetteItem) => 
      stateCodesUpper.includes(g.state_code.toUpperCase())
    );
    response.total_gazettes = response.gazettes.length;
  }
  
  return response;
}

/**
 * Busca publicações relacionadas a um número de processo
 * Útil para encontrar intimações, editais, etc.
 */
export async function buscarPublicacoesProcesso(
  numeroProcesso: string,
  options: {
    stateCodes?: string[];  // Filtrar por estado
    size?: number;
  } = {}
): Promise<GazetteSearchResponse> {
  // Remove formatação e busca o número do processo
  const numeroLimpo = numeroProcesso.replace(/[^\d]/g, '');
  
  // Formata o número do processo de diferentes formas para aumentar chances
  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  const partes = numeroProcesso.match(/(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})/);
  
  let termoBusca = `"${numeroProcesso}"`;
  
  if (partes) {
    // Adiciona variações do número do processo
    const [_, seq, dig, ano, justica, tribunal, origem] = partes;
    termoBusca = `"${numeroProcesso}" OR "${numeroLimpo}" OR "${seq}-${dig}.${ano}" OR "${seq}${dig}${ano}"`;
  } else {
    termoBusca = `"${numeroProcesso}" OR "${numeroLimpo}"`;
  }
  
  return buscarDiariosOficiais(termoBusca, { 
    size: options.size || 30,
    stateCodes: options.stateCodes
  });
}

/**
 * Detecta o estado provável de um processo pelo número CNJ
 */
export function detectarEstadoProcesso(numeroProcesso: string): string | null {
  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  // TR = Tribunal (código do estado na Justiça Estadual)
  const match = numeroProcesso.match(/\d{7}-?\d{2}\.?\d{4}\.?8\.?(\d{2})\./);
  
  if (!match) return null;
  
  const codigoTribunal = match[1];
  
  // Mapeamento do código do tribunal para estado (Justiça Estadual = 8)
  const tribunalEstado: Record<string, string> = {
    '01': 'AC', '02': 'AL', '03': 'AP', '04': 'AM', '05': 'BA',
    '06': 'CE', '07': 'DF', '08': 'ES', '09': 'GO', '10': 'MA',
    '11': 'MT', '12': 'MS', '13': 'MG', '14': 'PA', '15': 'PB',
    '16': 'PR', '17': 'PE', '18': 'PI', '19': 'RJ', '20': 'RN',
    '21': 'RS', '22': 'RO', '23': 'RR', '24': 'SC', '26': 'SP',
    '25': 'SE', '27': 'TO'
  };
  
  return tribunalEstado[codigoTribunal] || null;
}

/**
 * Busca publicações por nome de pessoa/empresa
 */
export async function buscarPublicacoesPorNome(
  nome: string,
  options: {
    size?: number;
    publishedSince?: string;
  } = {}
): Promise<GazetteSearchResponse> {
  // Usa aspas para busca exata do nome
  const termoBusca = `"${nome}"`;
  
  return buscarDiariosOficiais(termoBusca, {
    size: options.size || 15,
    publishedSince: options.publishedSince
  });
}

/**
 * Busca informações completas de empresa por CNPJ
 */
export async function buscarEmpresaPorCnpj(cnpj: string): Promise<CompanyInfo | null> {
  try {
    const data = await fetchQueridoDiario({
      endpoint: 'company',
      cnpj: cnpj.replace(/[^\d]/g, '')
    });
    return data.cnpj_info || null;
  } catch (error) {
    console.error('[Querido Diário] Erro ao buscar empresa:', error);
    return null;
  }
}

/**
 * Busca sócios de empresa por CNPJ
 */
export async function buscarSociosPorCnpj(cnpj: string): Promise<PartnersResponse | null> {
  try {
    const data = await fetchQueridoDiario({
      endpoint: 'partners',
      cnpj: cnpj.replace(/[^\d]/g, '')
    });
    return data;
  } catch (error) {
    console.error('[Querido Diário] Erro ao buscar sócios:', error);
    return null;
  }
}

/**
 * Busca complementar para um processo do DataJud
 * Retorna publicações em diários oficiais + dados de empresas envolvidas
 */
export async function buscarComplementoDataJud(
  numeroProcesso: string,
  partes: { nome: string; documento?: string }[],
  estadoFiltro?: string | null  // Filtrar por estado específico
): Promise<{
  publicacoes: GazetteSearchResponse | null;
  empresas: { cnpj: string; info: CompanyInfo | null; socios: PartnersResponse | null }[];
  estadoDetectado: string | null;
}> {
  // Detectar estado do processo
  const estadoDetectado = detectarEstadoProcesso(numeroProcesso);
  
  const resultado = {
    publicacoes: null as GazetteSearchResponse | null,
    empresas: [] as { cnpj: string; info: CompanyInfo | null; socios: PartnersResponse | null }[],
    estadoDetectado
  };
  
  // 1. Buscar publicações do processo (filtrando por estado se disponível)
  try {
    const estadosParaBusca = estadoFiltro 
      ? [estadoFiltro] 
      : (estadoDetectado ? [estadoDetectado] : undefined);
    
    resultado.publicacoes = await buscarPublicacoesProcesso(numeroProcesso, {
      stateCodes: estadosParaBusca,
      size: 30
    });
  } catch (error) {
    console.error('[Querido Diário] Erro ao buscar publicações:', error);
  }
  
  // 2. Buscar dados de empresas (CNPJs das partes)
  const cnpjs = partes
    .filter(p => p.documento && p.documento.replace(/[^\d]/g, '').length === 14)
    .map(p => p.documento!);
  
  // Limitar a 3 CNPJs para não sobrecarregar
  const cnpjsUnicos = [...new Set(cnpjs)].slice(0, 3);
  
  for (const cnpj of cnpjsUnicos) {
    try {
      const [info, socios] = await Promise.all([
        buscarEmpresaPorCnpj(cnpj),
        buscarSociosPorCnpj(cnpj)
      ]);
      resultado.empresas.push({ cnpj, info, socios });
    } catch (error) {
      console.error(`[Querido Diário] Erro ao buscar empresa ${cnpj}:`, error);
    }
  }
  
  return resultado;
}

/**
 * Formata situação cadastral para exibição
 */
export function formatarSituacaoCadastral(situacao: string | null): { texto: string; cor: string } {
  const situacoes: Record<string, { texto: string; cor: string }> = {
    '01': { texto: 'NULA', cor: 'gray' },
    '02': { texto: 'ATIVA', cor: 'green' },
    '03': { texto: 'SUSPENSA', cor: 'yellow' },
    '04': { texto: 'INAPTA', cor: 'red' },
    '08': { texto: 'BAIXADA', cor: 'gray' },
  };
  
  return situacoes[situacao || ''] || { texto: situacao || 'Desconhecida', cor: 'gray' };
}

/**
 * Formata CNPJ para exibição
 */
export function formatarCnpj(cnpj: string): string {
  const numeros = cnpj.replace(/[^\d]/g, '');
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata data ISO para exibição
 */
export function formatarData(dataIso: string | null): string {
  if (!dataIso) return '-';
  try {
    return new Date(dataIso).toLocaleDateString('pt-BR');
  } catch {
    return dataIso;
  }
}

/**
 * Remove tags HTML e limpa excerpt
 */
export function limparExcerpt(excerpt: string): string {
  return excerpt
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normaliza espaços
    .trim();
}
