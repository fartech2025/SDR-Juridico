import { supabase } from '../lib/supabaseClient';

// Interface para simulado baseado em prova
export interface SimuladoPorProva {
  id_simulado: string;
  id_prova: number;
  nome: string;
  ano: number;
  cor_caderno?: string;
  descricao?: string;
  total_questoes: number;
  data_aplicacao?: string;
  tempo_por_questao?: number;
  data_criacao: string;
  ativo: boolean;
}

export interface EstatisticasSimulados {
  simuladosDisponiveis: number;
  provasDisponiveis: number[];
  totalQuestoes: number;
  anosDisponiveis: number[];
}

export class SimuladosService {
  
  /**
   * Busca todos os simulados baseados na tabela provas
   */
  static async buscarSimuladosPorProvas(): Promise<SimuladoPorProva[]> {
    try {
      console.log('🔍 Buscando provas e suas questões...');
      
      // Buscar todas as provas com contagem de questões
      const { data: provas, error: errorProvas } = await supabase
        .from('provas')
        .select(`
          id_prova,
          ano,
          cor_caderno,
          descricao,
          data_aplicacao,
          tempo_por_questao
        `)
        .order('ano', { ascending: false });

      if (errorProvas) {
        console.error('❌ Erro ao buscar provas:', errorProvas);
        throw errorProvas;
      }

      if (!provas || provas.length === 0) {
        console.log('⚠️ Nenhuma prova encontrada');
        return [];
      }

      console.log(`📚 Encontradas ${provas.length} provas`);

      const simulados: SimuladoPorProva[] = [];

      // Para cada prova, contar suas questões
      for (const prova of provas) {
        const { count: totalQuestoes, error: errorCount } = await supabase
          .from('questoes')
          .select('*', { count: 'exact', head: true })
          .eq('id_prova', prova.id_prova);

        if (errorCount) {
          console.error(`❌ Erro ao contar questões da prova ${prova.id_prova}:`, errorCount);
          continue;
        }

        if (totalQuestoes && totalQuestoes > 0) {
          const simulado: SimuladoPorProva = {
            id_simulado: `enem_${prova.ano}_${prova.cor_caderno || 'padrao'}`,
            id_prova: prova.id_prova,
            nome: `ENEM ${prova.ano} - ${prova.cor_caderno || 'Padrão'}`,
            ano: prova.ano,
            cor_caderno: prova.cor_caderno,
            descricao: prova.descricao || `Simulado ENEM ${prova.ano} com ${totalQuestoes} questões`,
            total_questoes: totalQuestoes,
            data_aplicacao: prova.data_aplicacao,
            tempo_por_questao: prova.tempo_por_questao || 120,
            data_criacao: new Date().toISOString(),
            ativo: true
          };

          simulados.push(simulado);
          console.log(`✅ Simulado criado: ${simulado.nome} (${totalQuestoes} questões)`);
        }
      }

      console.log(`🎯 Total: ${simulados.length} simulados criados`);
      return simulados;

    } catch (error) {
      console.error('💥 Erro ao buscar simulados por provas:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas dos simulados baseados em provas
   */
  static async buscarEstatisticasSimulados(): Promise<EstatisticasSimulados> {
    try {
      const simulados = await this.buscarSimuladosPorProvas();
      
      const provasDisponiveis = simulados.map(s => s.id_prova);
      const anosDisponiveis = [...new Set(simulados.map(s => s.ano))].sort((a, b) => b - a);
      const totalQuestoes = simulados.reduce((total, s) => total + s.total_questoes, 0);
      
      return {
        simuladosDisponiveis: simulados.length,
        provasDisponiveis,
        totalQuestoes,
        anosDisponiveis
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return {
        simuladosDisponiveis: 0,
        provasDisponiveis: [],
        totalQuestoes: 0,
        anosDisponiveis: []
      };
    }
  }

  /**
   * Busca questões de um simulado específico (id_prova)
   */
  static async buscarQuestoesSimulado(idProva: number): Promise<any[]> {
    try {
      const { data: questoes, error } = await supabase
        .from('questoes')
        .select(`
          id_questao,
          id_prova,
          id_tema,
          enunciado,
          dificuldade,
          tem_imagem,
          nr_questao,
          peso_dificuldade,
          alternativas (
            id_alternativa,
            texto,
            letra
          )
        `)
        .eq('id_prova', idProva)
        .order('nr_questao');

      if (error) throw error;
      return questoes || [];

    } catch (error) {
      console.error(`❌ Erro ao buscar questões da prova ${idProva}:`, error);
      return [];
    }
  }

  /**
   * Busca informações de uma prova específica
   */
  static async buscarProva(idProva: number): Promise<any | null> {
    try {
      const { data: prova, error } = await supabase
        .from('provas')
        .select('*')
        .eq('id_prova', idProva)
        .single();

      if (error) throw error;
      return prova;

    } catch (error) {
      console.error(`❌ Erro ao buscar prova ${idProva}:`, error);
      return null;
    }
  }

  /**
   * Busca histórico de resultados do usuário (mock por enquanto)
   */
  static async buscarHistoricoUsuario(userId: string): Promise<any[]> {
    try {
      const simulados = await this.buscarSimuladosPorProvas();
      
      // Mock de dados - depois implementar com tabela real de resultados
      return simulados.slice(0, 3).map((simulado, index) => ({
        id_resultado: `result_${simulado.id_prova}_${userId}`,
        simulado_id: simulado.id_simulado,
        simulado_nome: simulado.nome,
        id_prova: simulado.id_prova,
        ano: simulado.ano,
        pontuacao: Math.floor(Math.random() * 1000) + 500,
        acertos: Math.floor(Math.random() * simulado.total_questoes * 0.8) + Math.floor(simulado.total_questoes * 0.2),
        total_questoes: simulado.total_questoes,
        data_realizacao: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        tempo_gasto: Math.floor(Math.random() * 180) + 120, // 2-5 horas
        status: 'concluido'
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return [];
    }
  }
}