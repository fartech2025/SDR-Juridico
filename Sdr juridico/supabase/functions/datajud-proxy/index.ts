// Edge Function minimalista - proxy para DataJud API
// Deploy: npx supabase functions deploy datajud-proxy --no-verify-jwt --project-ref xocqcoebreoiaqxoutar

const DATAJUD_API_KEY = Deno.env.get('DATAJUD_API_KEY') || '';
const DATAJUD_BASE_URL = 'https://api-publica.datajud.cnj.jus.br';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tribunal = url.searchParams.get('tribunal');
    const numeroProcesso = url.searchParams.get('numeroProcesso');
    const cpfCnpj = url.searchParams.get('cpfCnpj');
    const nomeParte = url.searchParams.get('nomeParte');
    const tipoBusca = url.searchParams.get('tipo') || 'numero'; // numero, cpf, nome

    // Validação básica
    if (!tribunal) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro tribunal é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Precisa de pelo menos um critério de busca
    if (!numeroProcesso && !cpfCnpj && !nomeParte) {
      return new Response(
        JSON.stringify({ error: 'Informe numeroProcesso, cpfCnpj ou nomeParte para buscar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!DATAJUD_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'DATAJUD_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Monta URL da API DataJud
    const endpoint = `${DATAJUD_BASE_URL}/api_publica_${tribunal}/_search`;
    
    // Monta query baseada no tipo de busca
    let query: any;
    
    if (cpfCnpj) {
      // Busca por CPF/CNPJ nas partes do processo
      const cpfLimpo = cpfCnpj.replace(/\D/g, '');
      console.log(`[DataJud Proxy] Buscando por CPF/CNPJ: ${cpfLimpo}`);
      
      query = {
        bool: {
          should: [
            { match: { "dadosBasicos.polo.parte.pessoa.numeroDocumentoPrincipal": cpfLimpo } },
            { match: { "dadosBasicos.poloAtivo.parte.pessoa.numeroDocumentoPrincipal": cpfLimpo } },
            { match: { "dadosBasicos.poloPassivo.parte.pessoa.numeroDocumentoPrincipal": cpfLimpo } },
            { wildcard: { "dadosBasicos.polo.parte.pessoa.numeroDocumentoPrincipal": `*${cpfLimpo}*` } },
            { wildcard: { "dadosBasicos.poloAtivo.parte.pessoa.numeroDocumentoPrincipal": `*${cpfLimpo}*` } },
            { wildcard: { "dadosBasicos.poloPassivo.parte.pessoa.numeroDocumentoPrincipal": `*${cpfLimpo}*` } },
          ],
          minimum_should_match: 1
        }
      };
    } else if (nomeParte) {
      // Busca por nome da parte
      console.log(`[DataJud Proxy] Buscando por nome: ${nomeParte}`);
      
      query = {
        bool: {
          should: [
            { match_phrase: { "dadosBasicos.polo.parte.pessoa.nome": nomeParte } },
            { match_phrase: { "dadosBasicos.poloAtivo.parte.pessoa.nome": nomeParte } },
            { match_phrase: { "dadosBasicos.poloPassivo.parte.pessoa.nome": nomeParte } },
            { match: { "dadosBasicos.polo.parte.pessoa.nome": nomeParte } },
            { match: { "dadosBasicos.poloAtivo.parte.pessoa.nome": nomeParte } },
            { match: { "dadosBasicos.poloPassivo.parte.pessoa.nome": nomeParte } },
          ],
          minimum_should_match: 1
        }
      };
    } else {
      // Busca por número do processo
      const numeroLimpo = numeroProcesso!.replace(/\D/g, '');
      console.log(`[DataJud Proxy] Buscando por número: ${numeroLimpo}`);
      
      query = {
        wildcard: {
          numeroProcesso: `*${numeroLimpo}*`
        }
      };
    }

    // Corpo da requisição Elasticsearch
    const body = {
      query,
      size: cpfCnpj || nomeParte ? 50 : 10, // Mais resultados para busca por parte
      sort: [{ "dataAjuizamento": { order: "desc" } }] // Mais recentes primeiro
    };

    console.log(`[DataJud Proxy] Consultando: ${tribunal}`);

    // Faz a requisição para DataJud
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[DataJud Proxy] Erro ${response.status}:`, data);
      return new Response(
        JSON.stringify({ error: 'Erro na API DataJud', status: response.status, details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrai os hits
    const hits = data.hits?.hits || [];
    const processos = hits.map((hit: any) => hit._source);
    const total = data.hits?.total?.value || hits.length;

    console.log(`[DataJud Proxy] Encontrados ${processos.length} de ${total} processos`);

    return new Response(
      JSON.stringify({ success: true, processos, total }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DataJud Proxy] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
