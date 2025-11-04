import { supabase } from '../lib/supabaseClient';

/**
 * Teste simples e direto para verificar id_prova
 */
export async function testeSimpleIdProva(): Promise<any> {
  try {
    console.log('🔍 Teste simples de id_prova...');
    
    // 1. Buscar uma questão com todas as colunas
    const { data: q1, error: e1 } = await supabase
      .from('questoes')
      .select('*')
      .limit(1);
    
    console.log('📋 Primeira questão completa:');
    console.log(JSON.stringify(q1?.[0], null, 2));
    
    if (e1) console.log('❌ Erro questões:', e1.message);
    
    // 2. Testar se id_prova existe tentando selecionar diretamente
    const { data: q2, error: e2 } = await supabase
      .from('questoes')
      .select('id_prova')
      .limit(1);
    
    console.log('\n✅ Seleção id_prova:', q2);
    if (e2) console.log('❌ Erro ao selecionar id_prova:', e2.message);
    
    // 3. Tentar relacionamento com provas
    const { data: q3, error: e3 } = await supabase
      .from('questoes')
      .select('id_prova, provas(id_prova, ano, descricao)')
      .limit(1);
    
    console.log('\n📚 Com relacionamento provas:', q3);
    if (e3) console.log('❌ Erro no relacionamento:', e3.message);
    
    return {
      questao_completa: q1?.[0],
      id_prova_direto: q2?.[0],
      com_relacionamento: q3?.[0],
      erros: { e1, e2, e3 }
    };
    
  } catch (err: any) {
    console.error('💥 Erro geral:', err);
    return { erro: err.message };
  }
}
