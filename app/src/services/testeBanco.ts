import { supabase } from '../lib/supabaseClient';

export async function testarConexaoBanco() {
  console.log("🔗 Testando conexão com banco real...");
  
  try {
    // Testar tabelas específicas necessárias (removido simulados e simulado_questoes)
    const tabelasEssenciais = ['usuarios', 'provas', 'questoes', 'resultados_simulados'];
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
  console.log("🎯 Verificando dados de simulados (provas)...");
  
  try {
    // ✅ NOVO: Verificar provas disponíveis (não mais tabela simulados)
    const { data: provas, error: errProvas } = await supabase
      .from('provas')
      .select('id_prova, ano, descricao, data_aplicacao')
      .limit(5);

    if (errProvas) {
      console.error("❌ Erro ao buscar provas:", errProvas);
      return { provas: [], erro: errProvas.message };
    }

    console.log("📋 Provas encontradas:", provas);

    // Verificar se há questões nas provas
    for (const prova of provas || []) {
      const { count } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('id_prova', prova.id_prova);

      console.log(`📝 Prova "${prova.descricao}" (${prova.ano}): ${count} questões`);
    }

    return { provas: provas || [], erro: null };

  } catch (error: any) {
    console.error("💥 Erro ao verificar provas:", error);
    return { provas: [], erro: error?.message || 'Erro desconhecido' };
  }
}