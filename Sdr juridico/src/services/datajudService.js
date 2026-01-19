/**
 * Serviço de integração com a API Pública DataJud - CNJ
 * Base Nacional de Dados do Poder Judiciário
 */
import { integrationsService } from '@/services/integrationsService';
// Em desenvolvimento, usa o proxy do Vite para evitar CORS
// Em produção, deve usar um backend proxy ou configurar CORS
const DATAJUD_API_URL = import.meta.env.DEV
    ? '/api-datajud'
    : 'https://api-publica.datajud.cnj.jus.br';
const ENV_DATAJUD_API_KEY = import.meta.env.VITE_DATAJUD_API_KEY || '';
let cachedApiKey;
async function resolveDataJudApiKey() {
    if (cachedApiKey !== undefined)
        return cachedApiKey || '';
    if (ENV_DATAJUD_API_KEY) {
        cachedApiKey = ENV_DATAJUD_API_KEY;
        return ENV_DATAJUD_API_KEY;
    }
    const rows = await integrationsService.getIntegrations();
    const row = rows.find((item) => item.provider === 'datajud');
    const secrets = row?.secrets || {};
    const settings = row?.settings || {};
    const apiKey = (typeof secrets === 'object' && secrets.apiKey) ||
        (typeof secrets === 'object' && secrets.apikey) ||
        (typeof settings === 'object' && settings.apiKey) ||
        (typeof settings === 'object' && settings.apikey) ||
        '';
    cachedApiKey = apiKey || '';
    return apiKey || '';
}
/**
 * Verifica se a API DataJud está configurada
 */
export async function isDataJudConfigured() {
    const apiKey = await resolveDataJudApiKey();
    return Boolean(apiKey && apiKey.length > 0);
}
/**
 * Testa a conexão com a API DataJud
 */
export async function testarConexao() {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        return {
            sucesso: false,
            mensagem: 'API Key não configurada. Configure em .env',
        };
    }
    try {
        const response = await fetch(`${DATAJUD_API_URL}/api_publica_trf1/_search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `APIKey ${apiKey}`,
            },
            body: JSON.stringify({
                size: 1,
                query: {
                    match_all: {},
                },
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            return {
                sucesso: false,
                mensagem: `Erro ${response.status}: ${error.error?.reason || 'Falha na conexão'}`,
                detalhes: error,
            };
        }
        const data = await response.json();
        return {
            sucesso: true,
            mensagem: `Conectado! ${data.hits?.total?.value || 0} processos disponíveis`,
            detalhes: data,
        };
    }
    catch (error) {
        return {
            sucesso: false,
            mensagem: `Erro de rede: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        };
    }
}
/**
 * Busca processo por número
 */
export async function buscarProcessoPorNumero(numeroProcesso, tribunal = 'trf1') {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        throw new Error('API DataJud não configurada');
    }
    // Remove formatação do número do processo
    const numeroLimpo = numeroProcesso.replace(/\D/g, '');
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${apiKey}`,
        },
        body: JSON.stringify({
            query: {
                term: {
                    numeroProcesso: numeroLimpo,
                },
            },
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.reason || 'Erro ao buscar processo');
    }
    return await response.json();
}
/**
 * Busca processos por nome da parte
 */
export async function buscarProcessosPorParte(nomeParte, tribunal = 'trf1', tamanho = 10) {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        throw new Error('API DataJud não configurada');
    }
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${apiKey}`,
        },
        body: JSON.stringify({
            size: tamanho,
            query: {
                nested: {
                    path: 'dadosBasicos.polo',
                    query: {
                        match: {
                            'dadosBasicos.polo.nome': nomeParte,
                        },
                    },
                },
            },
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.reason || 'Erro ao buscar processos');
    }
    return await response.json();
}
/**
 * Busca processos por órgão julgador
 */
export async function buscarProcessosPorOrgao(orgao, tribunal = 'trf1', tamanho = 10) {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        throw new Error('API DataJud não configurada');
    }
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${apiKey}`,
        },
        body: JSON.stringify({
            size: tamanho,
            query: {
                match: {
                    'dadosBasicos.orgaoJulgador': orgao,
                },
            },
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.reason || 'Erro ao buscar processos');
    }
    return await response.json();
}
/**
 * Busca processos por classe processual
 */
export async function buscarProcessosPorClasse(classe, tribunal = 'trf1', tamanho = 10) {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        throw new Error('API DataJud não configurada');
    }
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${apiKey}`,
        },
        body: JSON.stringify({
            size: tamanho,
            query: {
                match: {
                    'dadosBasicos.classeProcessual': classe,
                },
            },
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.reason || 'Erro ao buscar processos');
    }
    return await response.json();
}
/**
 * Busca avançada com múltiplos filtros
 */
export async function buscaAvancada(filtros, tribunal = 'trf1', tamanho = 10) {
    const apiKey = await resolveDataJudApiKey();
    if (!apiKey) {
        throw new Error('API DataJud não configurada');
    }
    const must = [];
    if (filtros.numeroProcesso) {
        must.push({
            term: {
                numeroProcesso: filtros.numeroProcesso.replace(/\D/g, ''),
            },
        });
    }
    if (filtros.nomeParte) {
        must.push({
            nested: {
                path: 'dadosBasicos.polo',
                query: {
                    match: {
                        'dadosBasicos.polo.nome': filtros.nomeParte,
                    },
                },
            },
        });
    }
    if (filtros.classe) {
        must.push({
            match: {
                'dadosBasicos.classeProcessual': filtros.classe,
            },
        });
    }
    if (filtros.orgao) {
        must.push({
            match: {
                'dadosBasicos.orgaoJulgador': filtros.orgao,
            },
        });
    }
    if (filtros.dataInicio || filtros.dataFim) {
        const range = {};
        if (filtros.dataInicio)
            range.gte = filtros.dataInicio;
        if (filtros.dataFim)
            range.lte = filtros.dataFim;
        must.push({
            range: {
                dataAjuizamento: range,
            },
        });
    }
    const response = await fetch(`${DATAJUD_API_URL}/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `APIKey ${apiKey}`,
        },
        body: JSON.stringify({
            size: tamanho,
            query: {
                bool: {
                    must: must.length > 0 ? must : [{ match_all: {} }],
                },
            },
            sort: [{ dataAjuizamento: { order: 'desc' } }],
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.reason || 'Erro ao buscar processos');
    }
    return await response.json();
}
/**
 * Formata número do processo para exibição
 */
export function formatarNumeroProcesso(numero) {
    const limpo = numero.replace(/\D/g, '');
    if (limpo.length !== 20)
        return numero;
    // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
    return `${limpo.slice(0, 7)}-${limpo.slice(7, 9)}.${limpo.slice(9, 13)}.${limpo.slice(13, 14)}.${limpo.slice(14, 16)}.${limpo.slice(16, 20)}`;
}
/**
 * Detecta o tribunal pelo número do processo (segmento TR)
 */
export function detectarTribunal(numeroProcesso) {
    const limpo = numeroProcesso.replace(/\D/g, '');
    if (limpo.length !== 20)
        return null;
    const segmentoTR = limpo.slice(13, 16); // JTR
    const justica = segmentoTR[0];
    const tribunal = segmentoTR.slice(1);
    // Justiça Federal (4)
    if (justica === '4') {
        return `trf${tribunal}`;
    }
    // Justiça do Trabalho (5)
    if (justica === '5') {
        return `trt${tribunal}`;
    }
    // Justiça Eleitoral (6)
    if (justica === '6') {
        const estadoCodigo = limpo.slice(14, 16);
        const mapa = {
            '01': 'ac', '02': 'al', '03': 'ap', '04': 'am', '05': 'ba',
            '06': 'ce', '07': 'df', '08': 'es', '09': 'go', '10': 'ma',
            '11': 'mt', '12': 'ms', '13': 'mg', '14': 'pa', '15': 'pb',
            '16': 'pr', '17': 'pe', '18': 'pi', '19': 'rj', '20': 'rn',
            '21': 'rs', '22': 'ro', '23': 'rr', '24': 'sc', '25': 'se',
            '26': 'sp', '27': 'to', '53': 'dft'
        };
        return mapa[estadoCodigo] ? `tre-${mapa[estadoCodigo]}` : null;
    }
    // Justiça Militar Estadual (7)
    if (justica === '7') {
        const estadoCodigo = limpo.slice(14, 16);
        if (estadoCodigo === '13')
            return 'tjmmg';
        if (estadoCodigo === '21')
            return 'tjmrs';
        if (estadoCodigo === '26')
            return 'tjmsp';
        return null;
    }
    // Justiça Estadual (8)
    if (justica === '8') {
        const estadoCodigo = limpo.slice(14, 16);
        const mapa = {
            '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
            '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
            '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
            '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
            '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjse',
            '26': 'tjsp', '27': 'tjto', '53': 'tjdft'
        };
        return mapa[estadoCodigo] || null;
    }
    // Tribunais Superiores (3)
    if (justica === '3') {
        if (tribunal === '00')
            return 'stj';
        if (tribunal === '01')
            return 'tst';
        if (tribunal === '02')
            return 'tse';
        if (tribunal === '03')
            return 'stm';
    }
    return null;
}
/**
 * Busca processo automaticamente detectando o tribunal pelo número
 */
export async function buscarProcessoAutomatico(numeroProcesso) {
    const tribunalDetectado = detectarTribunal(numeroProcesso);
    if (!tribunalDetectado) {
        return {
            sucesso: false,
            erro: 'Não foi possível detectar o tribunal pelo número do processo',
        };
    }
    try {
        const resultado = await buscarProcessoPorNumero(numeroProcesso, tribunalDetectado);
        if (resultado.hits.total.value > 0) {
            return {
                sucesso: true,
                tribunal: tribunalDetectado,
                processo: resultado.hits.hits[0]._source,
            };
        }
        return {
            sucesso: false,
            tribunal: tribunalDetectado,
            erro: 'Processo não encontrado na base DataJud',
        };
    }
    catch (error) {
        return {
            sucesso: false,
            tribunal: tribunalDetectado,
            erro: error instanceof Error ? error.message : 'Erro ao buscar processo',
        };
    }
}
/**
 * Extrai informações básicas do processo
 */
export function extrairInfoProcesso(processo) {
    // Converter data do formato YYYYMMDDHHmmss para Date
    const parseDataAjuizamento = (data) => {
        if (!data)
            return 'Não informada';
        // Formato: YYYYMMDDHHmmss (ex: 20251111042431)
        if (data.length === 14) {
            const ano = data.substring(0, 4);
            const mes = data.substring(4, 6);
            const dia = data.substring(6, 8);
            return `${dia}/${mes}/${ano}`;
        }
        // Tenta parsear como ISO date
        try {
            return new Date(data).toLocaleDateString('pt-BR');
        }
        catch {
            return data;
        }
    };
    return {
        numero: processo.numeroProcesso || '',
        tribunal: processo.tribunal || 'Não informado',
        classe: processo.classe || 'Não informada',
        assunto: processo.assuntos?.[0] || processo.assunto || 'Não informado',
        orgao: processo.orgaoJulgador || 'Não informado',
        dataAjuizamento: parseDataAjuizamento(processo.dataAjuizamento),
        partes: processo.dadosBasicos?.polo || [],
        totalMovimentacoes: processo.movimentos?.length || 0,
    };
}
