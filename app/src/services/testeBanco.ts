import { supabase } from '../lib/supabaseClient';

export async function testarConexaoBanco() {
  console.log('🔌 Testando conexao com banco real...');

  try {
    const tabelasEssenciais = ['usuarios', 'provas', 'questoes', 'alternativas', 'respostas_usuarios'];
    const resultados: Record<string, any> = {};

    for (const tabela of tabelasEssenciais) {
      try {
        const { count, error } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });

        if (error) {
          resultados[tabela] = { existe: false, erro: error.message };
        } else {
          resultados[tabela] = { existe: true, total_registros: count };
        }
      } catch (err: any) {
        resultados[tabela] = { existe: false, erro: err?.message || 'Erro desconhecido' };
      }
    }

    console.log('📊 Status das tabelas:', resultados);
    return { sucesso: true, tabelas: resultados };
  } catch (error: any) {
    console.error('🚨 Erro geral:', error);
    return { sucesso: false, erro: error?.message || 'Erro desconhecido' };
  }
}

export async function verificarDadosSimulados() {
  console.log('🧪 Verificando dados de simulados...');

  try {
    const { data: provas, error: errProvas } = await supabase
      .from('provas')
      .select('id_prova, ano, descricao, data_aplicacao')
      .limit(5);

    if (errProvas) {
      console.error('⚠️ Erro ao buscar provas:', errProvas);
      return { simulados: [], erro: errProvas.message };
    }

    console.log('🔍 Provas encontradas:', provas);

    for (const prova of provas ?? []) {
      const { count } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('id_prova', prova.id_prova);

      console.log(`🔎 Prova ${prova.ano}: ${count} questoes`);
    }

    return { simulados: provas ?? [], erro: null };
  } catch (error: any) {
    console.error('🚨 Erro ao verificar simulados:', error);
    return { simulados: [], erro: error?.message || 'Erro desconhecido' };
  }
}
