import { supabase } from '../lib/supabaseClient';

export async function verificarIdProva(): Promise<{
  sucesso: boolean;
  resultado: any;
  erro?: string;
}> {
  try {
    console.log('🔍 Verificando especificamente a coluna id_prova...');
    
    const resultado: any = {};

    // Testar questões com id_prova
    try {
      const { data: questoesComIdProva, error: errorQuestoes } = await supabase
        .from('questoes')
        .select('id_prova')
        .limit(5);

      if (!errorQuestoes) {
        resultado.questoes = {
          tem_id_prova: true,
          valores_exemplo: questoesComIdProva?.map(q => q.id_prova).filter(Boolean),
          total_com_id_prova: questoesComIdProva?.filter(q => q.id_prova !== null).length || 0
        };
        console.log('✅ Tabela questões TEM a coluna id_prova');
      } else {
        resultado.questoes = {
          tem_id_prova: false,
          erro: errorQuestoes.message
        };
        console.log('❌ Tabela questões NÃO TEM a coluna id_prova:', errorQuestoes.message);
      }
    } catch (err: any) {
      resultado.questoes = {
        tem_id_prova: false,
        erro: err.message
      };
    }

    // Testar se existe tabela provas
    try {
      const { data: provas, error: errorProvas } = await supabase
        .from('provas')
        .select('id_prova, nome, ano')
        .limit(5);

      if (!errorProvas) {
        resultado.provas = {
          existe: true,
          total: provas?.length || 0,
          exemplos: provas
        };
        console.log('✅ Tabela provas existe e tem dados');
      } else {
        resultado.provas = {
          existe: false,
          erro: errorProvas.message
        };
        console.log('❌ Tabela provas não existe ou erro:', errorProvas.message);
      }
    } catch (err: any) {
      resultado.provas = {
        existe: false,
        erro: err.message
      };
    }

    // Se ambas existem, testar correlação
    if (resultado.questoes?.tem_id_prova && resultado.provas?.existe) {
      try {
        const { data: correlacao, error: errorCorrelacao } = await supabase
          .from('questoes')
          .select(`
            id_prova,
            provas!inner(
              id_prova,
              nome,
              ano
            )
          `)
          .limit(3);

        if (!errorCorrelacao) {
          resultado.correlacao = {
            funciona: true,
            exemplos: correlacao
          };
          console.log('✅ Correlação funciona - questões estão vinculadas a provas');
        } else {
          resultado.correlacao = {
            funciona: false,
            erro: errorCorrelacao.message
          };
          console.log('❌ Correlação não funciona:', errorCorrelacao.message);
        }
      } catch (err: any) {
        resultado.correlacao = {
          funciona: false,
          erro: err.message
        };
      }
    }

    // Buscar uma amostra das questões para ver a estrutura real
    try {
      const { data: amostraQuestoes, error: errorAmostra } = await supabase
        .from('questoes')
        .select('*')
        .limit(1);

      if (!errorAmostra && amostraQuestoes && amostraQuestoes.length > 0) {
        resultado.estrutura_questao = {
          todas_colunas: Object.keys(amostraQuestoes[0]),
          exemplo: amostraQuestoes[0]
        };
      }
    } catch (err: any) {
      resultado.estrutura_questao = {
        erro: err.message
      };
    }

    console.log('📊 Resultado final:', JSON.stringify(resultado, null, 2));

    return {
      sucesso: true,
      resultado
    };

  } catch (error: any) {
    console.error('❌ Erro ao verificar id_prova:', error);
    return {
      sucesso: false,
      resultado: {},
      erro: error.message
    };
  }
}