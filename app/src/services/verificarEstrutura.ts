import { supabase } from '../lib/supabaseClient';

export async function verificarColunasTabelas(): Promise<{
  sucesso: boolean;
  estrutura: any;
  erro?: string;
}> {
  try {
    console.log('🔍 Verificando colunas das tabelas...');
    
    const estrutura: any = {};

    // Verificar tabela questoes
    try {
      const { data: questoesAmostra, error: errorQuestoes } = await supabase
        .from('questoes')
        .select('*')
        .limit(1);

      if (!errorQuestoes && questoesAmostra && questoesAmostra.length > 0) {
        estrutura.questoes = {
          existe: true,
          colunas: Object.keys(questoesAmostra[0]),
          tem_id_prova: Object.keys(questoesAmostra[0]).includes('id_prova'),
          amostra: questoesAmostra[0]
        };
      } else {
        estrutura.questoes = {
          existe: false,
          erro: errorQuestoes?.message || 'Tabela vazia'
        };
      }
    } catch (err: any) {
      estrutura.questoes = {
        existe: false,
        erro: err.message
      };
    }

    // Verificar se existe tabela provas
    try {
      const { data: provasAmostra, error: errorProvas } = await supabase
        .from('provas')
        .select('*')
        .limit(1);

      if (!errorProvas && provasAmostra && provasAmostra.length > 0) {
        estrutura.provas = {
          existe: true,
          colunas: Object.keys(provasAmostra[0]),
          tem_id_prova: Object.keys(provasAmostra[0]).includes('id_prova'),
          amostra: provasAmostra[0]
        };
      } else {
        estrutura.provas = {
          existe: false,
          erro: errorProvas?.message || 'Tabela vazia'
        };
      }
    } catch (err: any) {
      estrutura.provas = {
        existe: false,
        erro: err.message
      };
    }

    // Verificar outras tabelas relacionadas
    const tabelasParaVerificar = ['alternativas', 'provas', 'questoes', 'resultados_simulados'];
    
    for (const tabela of tabelasParaVerificar) {
      try {
        const { data: amostra, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1);

        if (!error && amostra && amostra.length > 0) {
          estrutura[tabela] = {
            existe: true,
            colunas: Object.keys(amostra[0]),
            tem_id_prova: Object.keys(amostra[0]).includes('id_prova'),
            amostra: amostra[0]
          };
        } else {
          estrutura[tabela] = {
            existe: true,
            vazio: true,
            erro: error?.message || 'Tabela existe mas está vazia'
          };
        }
      } catch (err: any) {
        estrutura[tabela] = {
          existe: false,
          erro: err.message
        };
      }
    }

    // Verificar se questões têm alguma coluna que pode identificar o ano/prova
    if (estrutura.questoes?.existe) {
      const colunas = estrutura.questoes.colunas;
      estrutura.analise = {
        possui_id_prova: colunas.includes('id_prova'),
        possui_ano: colunas.includes('ano'),
        possui_prova: colunas.includes('prova'),
        possui_caderno: colunas.includes('caderno'),
        possui_tipo_prova: colunas.includes('tipo_prova'),
        colunas_relevantes: colunas.filter((col: string) => 
          col.includes('prova') || 
          col.includes('ano') || 
          col.includes('caderno') || 
          col.includes('tipo')
        )
      };
    }

    console.log('📊 Estrutura verificada:', JSON.stringify(estrutura, null, 2));

    return {
      sucesso: true,
      estrutura
    };

  } catch (error: any) {
    console.error('❌ Erro ao verificar colunas:', error);
    return {
      sucesso: false,
      estrutura: {},
      erro: error.message
    };
  }
}

export async function buscarQuestoesComDetalhes(): Promise<{
  sucesso: boolean;
  questoes: any[];
  erro?: string;
}> {
  try {
    console.log('🔍 Buscando questões com detalhes...');
    
    const { data: questoes, error } = await supabase
      .from('questoes')
      .select('*')
      .limit(10);

    if (error) {
      throw new Error(`Erro ao buscar questões: ${error.message}`);
    }

    console.log(`📚 Encontradas ${questoes?.length || 0} questões (amostra de 10)`);
    
    if (questoes && questoes.length > 0) {
      console.log('📋 Primeira questão:', JSON.stringify(questoes[0], null, 2));
      
      // Analisar padrões nas questões
      const analisePatroes = {
        total_questoes: questoes.length,
        campos_unicos: {
          anos: [...new Set(questoes.map(q => q.ano).filter(Boolean))],
          areas: [...new Set(questoes.map(q => q.area_conhecimento).filter(Boolean))],
          disciplinas: [...new Set(questoes.map(q => q.disciplina).filter(Boolean))],
          tipos_prova: [...new Set(questoes.map(q => q.tipo_prova).filter(Boolean))],
          cadernos: [...new Set(questoes.map(q => q.caderno).filter(Boolean))],
          id_provas: [...new Set(questoes.map(q => q.id_prova).filter(Boolean))]
        }
      };
      
      console.log('📊 Análise de padrões:', JSON.stringify(analisePatroes, null, 2));
    }

    return {
      sucesso: true,
      questoes: questoes || []
    };

  } catch (error: any) {
    console.error('❌ Erro ao buscar questões:', error);
    return {
      sucesso: false,
      questoes: [],
      erro: error.message
    };
  }
}