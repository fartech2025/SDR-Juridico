import { supabase } from '../lib/supabaseClient';

export async function testarConexaoBanco() {
  console.log("🔗 Testando conexão com banco real...");
  
  try {
    // Testar tabelas específicas necessárias
    const tabelasEssenciais = ['usuarios', 'simulados', 'resultados_simulados', 'simulado_questoes'];
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

    console.log("📊 Status das tabelas:", resultados);
    return { sucesso: true, tabelas: resultados };

  } catch (error: any) {
    console.error("💥 Erro geral:", error);
    return { sucesso: false, erro: error?.message || 'Erro desconhecido' };
  }
}

export async function verificarDadosSimulados() {
  console.log("🎯 Verificando dados de simulados...");
  
  try {
    // Verificar simulados disponíveis
    const { data: simulados, error: errSimulados } = await supabase
      .from('simulados')
      .select('id_simulado, nome, descricao, data_criacao')
      .limit(5);

    if (errSimulados) {
      console.error("❌ Erro ao buscar simulados:", errSimulados);
      return { simulados: [], erro: errSimulados.message };
    }

    console.log("📋 Simulados encontrados:", simulados);

    // Verificar se há questões nos simulados
    for (const simulado of simulados || []) {
      const { count } = await supabase
        .from('simulado_questoes')
        .select('*', { count: 'exact', head: true })
        .eq('id_simulado', simulado.id_simulado);

      console.log(`📝 Simulado "${simulado.nome}": ${count} questões`);
    }

    return { simulados: simulados || [], erro: null };

  } catch (error: any) {
    console.error("💥 Erro ao verificar simulados:", error);
    return { simulados: [], erro: error?.message || 'Erro desconhecido' };
  }
}