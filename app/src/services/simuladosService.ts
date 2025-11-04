import { supabase } from '../lib/supabaseClient';

export interface SimuladoPorProva {
  id_simulado: number;
  id_prova: number;
  nome: string;
  ano: number;
  descricao?: string | null;
  total_questoes: number;
  data_aplicacao?: string | null;
  tempo_por_questao?: number | null;
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
   * Usa a tabela oficial `provas` para montar uma lista de simulados.
   * Cada prova vira um simulado disponível na aplicação.
   */
  static async buscarSimuladosPorProvas(): Promise<SimuladoPorProva[]> {
    try {
      const { data: provas, error: errorProvas } = await supabase
        .from('provas')
        .select('id_prova, ano, descricao, data_aplicacao, tempo_por_questao')
        .order('ano', { ascending: false });

      if (errorProvas) {
        console.error('Erro ao buscar provas:', errorProvas);
        throw errorProvas;
      }

      if (!provas || provas.length === 0) {
        return [];
      }

      const simulados: SimuladoPorProva[] = [];

      for (const prova of provas) {
        const { count, error: errorCount } = await supabase
          .from('questoes')
          .select('*', { count: 'exact', head: true })
          .eq('id_prova', prova.id_prova);

        if (errorCount) {
          console.error(`Erro ao contar questoes da prova ${prova.id_prova}:`, errorCount);
          continue;
        }

        const totalQuestoes = count ?? 0;
        if (totalQuestoes === 0) {
          continue;
        }

        simulados.push({
          id_simulado: prova.id_prova,
          id_prova: prova.id_prova,
          nome: prova.descricao || `ENEM ${prova.ano}`,
          ano: prova.ano,
          descricao: prova.descricao,
          total_questoes: totalQuestoes,
          data_aplicacao: prova.data_aplicacao,
          tempo_por_questao: prova.tempo_por_questao,
          data_criacao: prova.data_aplicacao ?? new Date().toISOString(),
          ativo: true,
        });
      }

      return simulados;
    } catch (error) {
      console.error('Erro ao buscar simulados por provas:', error);
      return [];
    }
  }

  static async buscarEstatisticasSimulados(): Promise<EstatisticasSimulados> {
    try {
      const simulados = await this.buscarSimuladosPorProvas();

      const provasDisponiveis = simulados.map((s) => s.id_prova);
      const anosDisponiveis = [...new Set(simulados.map((s) => s.ano))].sort((a, b) => b - a);
      const totalQuestoes = simulados.reduce((total, s) => total + s.total_questoes, 0);

      return {
        simuladosDisponiveis: simulados.length,
        provasDisponiveis,
        totalQuestoes,
        anosDisponiveis,
      };
    } catch (error) {
      console.error('Erro ao buscar estatisticas:', error);
      return {
        simuladosDisponiveis: 0,
        provasDisponiveis: [],
        totalQuestoes: 0,
        anosDisponiveis: [],
      };
    }
  }

  static async buscarQuestoesSimulado(idProva: number): Promise<any[]> {
    try {
      const { data: questoes, error } = await supabase
        .from('questoes')
        .select(
          `id_questao,
           id_prova,
           id_tema,
           enunciado,
           dificuldade,
           tem_imagem,
           nr_questao,
           peso_dificuldade,
           alternativas:alternativas (
             id_alternativa,
             letra,
             texto,
             correta,
             tem_imagem
           )`
        )
        .eq('id_prova', idProva)
        .order('nr_questao', { ascending: true })
        .order('id_questao', { ascending: true });

      if (error) throw error;
      return questoes ?? [];
    } catch (error) {
      console.error(`Erro ao buscar questoes da prova ${idProva}:`, error);
      return [];
    }
  }

  static async buscarProva(idProva: number): Promise<any | null> {
    try {
      const { data: prova, error } = await supabase
        .from('provas')
        .select('id_prova, ano, descricao, data_aplicacao, tempo_por_questao')
        .eq('id_prova', idProva)
        .maybeSingle();

      if (error) throw error;
      return prova ?? null;
    } catch (error) {
      console.error(`Erro ao buscar prova ${idProva}:`, error);
      return null;
    }
  }

  static async buscarHistoricoUsuario(userId: string): Promise<any[]> {
    try {
      const simulados = await this.buscarSimuladosPorProvas();

      return simulados.slice(0, 3).map((simulado, index) => ({
        id_resultado: `result_${simulado.id_prova}_${userId}`,
        simulado_id: simulado.id_simulado,
        simulado_nome: simulado.nome,
        id_prova: simulado.id_prova,
        ano: simulado.ano,
        pontuacao: Math.floor(Math.random() * 1000) + 500,
        acertos:
          Math.floor(Math.random() * simulado.total_questoes * 0.8) +
          Math.floor(simulado.total_questoes * 0.2),
        total_questoes: simulado.total_questoes,
        data_realizacao: new Date(
          Date.now() - index * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        tempo_gasto: Math.floor(Math.random() * 180) + 120,
        status: 'concluido',
      }));
    } catch (error) {
      console.error('Erro ao buscar historico:', error);
      return [];
    }
  }
}
