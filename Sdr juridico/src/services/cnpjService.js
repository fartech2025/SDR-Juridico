/**
 * Serviço de Consulta CNPJ - Receita Federal
 * Utiliza dados abertos da Receita Federal do Brasil
 */
const STORAGE_KEY = 'sdr_juridico_cache_cnpj';
const loadCache = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object')
                return parsed;
        }
    }
    catch {
        // Ignorar erros de storage
    }
    return {};
};
const saveCache = (cache) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
    catch {
        // Ignorar erros de storage
    }
};
/**
 * Consulta CNPJ no cache ou na API pública da Receita Federal
 */
export async function consultarCNPJ(cnpj) {
    // Limpar formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
        console.warn('CNPJ inválido:', cnpj);
        return null;
    }
    // Verificar cache primeiro
    const cached = await buscarNoCache(cnpjLimpo);
    if (cached) {
        return cached;
    }
    // Consultar API pública
    try {
        const dados = await consultarAPIReceita(cnpjLimpo);
        if (dados) {
            await salvarNoCache(dados);
            return dados;
        }
    }
    catch (error) {
        console.error('Erro ao consultar CNPJ:', error);
    }
    return null;
}
/**
 * Busca CNPJ no cache do Supabase
 */
async function buscarNoCache(cnpj) {
    const cache = loadCache();
    const data = cache[cnpj];
    if (!data)
        return null;
    // Verificar se cache está desatualizado (>30 dias)
    const consultadoEm = new Date(data.consultado_em);
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    if (consultadoEm < trintaDiasAtras) {
        return null; // Cache expirado
    }
    return data;
}
/**
 * Salva dados do CNPJ no cache
 */
async function salvarNoCache(dados) {
    const cache = loadCache();
    cache[dados.cnpj] = {
        ...dados,
        consultado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
    };
    saveCache(cache);
}
/**
 * Consulta API pública da Receita Federal
 * Fonte: https://brasilapi.com.br/docs#tag/CNPJ
 */
async function consultarAPIReceita(cnpj) {
    try {
        // Usando BrasilAPI como proxy dos dados públicos da Receita
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
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
        };
    }
    catch (error) {
        console.error('Erro na API Receita:', error);
        return null;
    }
}
/**
 * Formata porte da empresa
 */
function formatarPorte(porte) {
    const portes = {
        '00': 'Não informado',
        '01': 'Microempresa',
        '03': 'Empresa de Pequeno Porte',
        '05': 'Demais'
    };
    return portes[porte] || porte;
}
/**
 * Extrai CNPJs de um texto
 */
export function extrairCNPJs(texto) {
    if (!texto)
        return [];
    // Regex para CNPJ (com ou sem formatação)
    const regex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
    const matches = texto.match(regex) || [];
    return matches.map(cnpj => cnpj.replace(/\D/g, ''));
}
/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj) {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14)
        return cnpj;
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
/**
 * Enriquece texto substituindo CNPJs por links com razão social
 */
export async function enriquecerTextoCNPJ(texto) {
    const cnpjs = extrairCNPJs(texto);
    if (cnpjs.length === 0)
        return texto;
    let textoEnriquecido = texto;
    for (const cnpj of cnpjs) {
        const dados = await consultarCNPJ(cnpj);
        if (dados?.razao_social) {
            const cnpjFormatado = formatarCNPJ(cnpj);
            textoEnriquecido = textoEnriquecido.replace(new RegExp(cnpjFormatado, 'g'), `${dados.razao_social} (CNPJ: ${cnpjFormatado})`);
        }
    }
    return textoEnriquecido;
}
