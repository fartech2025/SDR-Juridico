import { supabase } from '../lib/supabaseClient';

export async function testeSimplesDados(): Promise<any> {
  try {
    console.log('🔍 Teste simples de dados nas tabelas...');
    
    const resultado: any = {};

    // 1. Contar provas
    const { count: countProvas, error: errorProvas } = await supabase
      .from('provas')
      .select('*', { count: 'exact', head: true });

    resultado.provas = {
      total: countProvas || 0,
      erro: errorProvas?.message
    };
    
    console.log(`📚 Provas encontradas: ${countProvas || 0}`);

    // 2. Contar questões  
    const { count: countQuestoes, error: errorQuestoes } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true });

    resultado.questoes = {
      total: countQuestoes || 0,
      erro: errorQuestoes?.message
    };

    console.log(`📝 Questões encontradas: ${countQuestoes || 0}`);

    // 3. Se há dados, buscar algumas amostras
    if (countProvas && countProvas > 0) {
      const { data: provasAmostra, error: errorAmostra } = await supabase
        .from('provas')
        .select('id_prova, ano, cor_caderno, descricao')
        .limit(3);

      resultado.amostrasProvas = provasAmostra || [];
      console.log('📋 Amostras de provas:', provasAmostra);
    }

    if (countQuestoes && countQuestoes > 0) {
      const { data: questoesAmostra, error: errorAmostra } = await supabase
        .from('questoes')
        .select('id_questao, id_prova, nr_questao, enunciado')
        .limit(3);

      resultado.amostrasQuestoes = questoesAmostra || [];
      console.log('📋 Amostras de questões:', questoesAmostra);
    }

    // 4. Se há questões, verificar correlação id_prova
    if (countQuestoes && countQuestoes > 0) {
      const { data: correlacao, error: errorCorrelacao } = await supabase
        .from('questoes')
        .select('id_prova')
        .not('id_prova', 'is', null)
        .limit(5);

      resultado.correlacoesIdProva = correlacao || [];
      
      if (correlacao && correlacao.length > 0) {
        const idsProva = [...new Set(correlacao.map(q => q.id_prova))];
        console.log('🔗 IDs de prova únicos nas questões:', idsProva);
        resultado.idsProvaUnicos = idsProva;
      }
    }

    return resultado;

  } catch (error: any) {
    console.error('💥 Erro no teste simples:', error);
    return { erro: error.message };
  }
}