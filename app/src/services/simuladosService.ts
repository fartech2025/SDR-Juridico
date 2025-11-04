import { supabase } from '../lib/supabaseClient';

// ✅ Interface ÚNICA e CONSOLIDADA para Simulados (baseada em Provas)
export interface SimuladoDoEnem {
  // Identificadores
  id_prova: number;              // FK real no banco de dados
  id_simulado_virtual: string;   // ID virtual gerado (ex: enem_2024_azul)
  
  // Informações básicas
  nome: string;                  // "ENEM 2024 - Caderno Azul"
  ano: number;
  cor_caderno: string | null;
  descricao: string;
  
  // Questões e configuração
  total_questoes: number;
  tempo_por_questao: number;
  
  // Metadados
  data_aplicacao: string | null;
  data_criacao: string;
  ativo: boolean;
}

// Interface para questão completa com alternativas
export interface QuestaoCompleta {
  id_questao: number;
  id_prova: number;
  id_tema: number | null;
  enunciado: string;
  dificuldade: string | null;
  tem_imagem: boolean;
  nr_questao: number;
  peso_dificuldade: number | null;
  alternativas: Alternativa[];
}

export interface Alternativa {
  id_alternativa: number;
  texto: string;
  letra: string;
  correta?: boolean;
}

// Interface para resultado de simulado
export interface ResultadoSimulado {
  id_resultado?: number;
  id_usuario: string;
  id_prova: number;
  nome_simulado: string;
  ano: number;
  total_questoes: number;
  acertos: number;
  nota: number;
  tempo_gasto_segundos: number;
  data_realizacao: string;
  status: 'em_andamento' | 'concluido' | 'abandonado';
}

export interface EstatisticasSimulados {
  simuladosDisponiveis: number;
  provasDisponiveis: number[];
  totalQuestoes: number;
  anosDisponiveis: number[];
}

export class SimuladosService {
  
  /**
   * 📚 Lista todos os simulados disponíveis (baseados em provas com questões)
   * Cada prova do ENEM vira um simulado completo
   */
  static async listarSimulados(): Promise<SimuladoDoEnem[]> {
    try {
      console.log('🔍 Buscando provas disponíveis...');
      
      // Buscar todas as provas
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

      const simulados: SimuladoDoEnem[] = [];

      // Para cada prova, contar questões e criar simulado virtual
      for (const prova of provas) {
        const { count: totalQuestoes, error: errorCount } = await supabase
          .from('questoes')
          .select('*', { count: 'exact', head: true })
          .eq('id_prova', prova.id_prova);

        if (errorCount) {
          console.error(`❌ Erro ao contar questões da prova ${prova.id_prova}:`, errorCount);
          continue;
        }

        // Só adiciona provas que têm questões
        if (totalQuestoes && totalQuestoes > 0) {
          const corCaderno = prova.cor_caderno || 'Padrão';
          
          const simulado: SimuladoDoEnem = {
            // Identificadores
            id_prova: prova.id_prova,
            id_simulado_virtual: `enem_${prova.ano}_${corCaderno.toLowerCase()}`,
            
            // Informações básicas
            nome: `ENEM ${prova.ano} - ${corCaderno}`,
            ano: prova.ano,
            cor_caderno: prova.cor_caderno,
            descricao: prova.descricao || `Simulado completo ENEM ${prova.ano} com ${totalQuestoes} questões`,
            
            // Questões e configuração
            total_questoes: totalQuestoes,
            tempo_por_questao: prova.tempo_por_questao || 180, // 3 minutos padrão
            
            // Metadados
            data_aplicacao: prova.data_aplicacao,
            data_criacao: new Date().toISOString(),
            ativo: true
          };

          simulados.push(simulado);
          console.log(`✅ Simulado: ${simulado.nome} (${totalQuestoes} questões)`);
        }
      }

      console.log(`🎯 Total: ${simulados.length} simulados disponíveis`);
      return simulados;

    } catch (error) {
      console.error('💥 Erro ao listar simulados:', error);
      return [];
    }
  }

  /**
   * 🔎 Busca um simulado específico por id_prova
   */
  static async buscarSimulado(idProva: number): Promise<SimuladoDoEnem | null> {
    try {
      const simulados = await this.listarSimulados();
      return simulados.find(s => s.id_prova === idProva) || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar simulado ${idProva}:`, error);
      return null;
    }
  }

  /**
   * 📊 Busca estatísticas dos simulados disponíveis
   */
  static async buscarEstatisticasSimulados(): Promise<EstatisticasSimulados> {
    try {
      const simulados = await this.listarSimulados();
      
      const provasDisponiveis = simulados.map((s: SimuladoDoEnem) => s.id_prova);
      const anosDisponiveis = [...new Set(simulados.map((s: SimuladoDoEnem) => s.ano))].sort((a, b) => b - a);
      const totalQuestoes = simulados.reduce((total: number, s: SimuladoDoEnem) => total + s.total_questoes, 0);
      
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
   * 📝 Busca questões de um simulado específico (via id_prova)
   * Inclui alternativas e ordenação por número da questão
   */
  static async buscarQuestoesSimulado(idProva: number): Promise<QuestaoCompleta[]> {
    try {
      console.log(`🔍 Buscando questões da prova ${idProva}...`);
      
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

      if (error) {
        console.error('❌ Erro ao buscar questões:', error);
        throw error;
      }

      console.log(`✅ Encontradas ${questoes?.length || 0} questões`);
      return (questoes || []) as QuestaoCompleta[];

    } catch (error) {
      console.error(`💥 Erro ao buscar questões da prova ${idProva}:`, error);
      return [];
    }
  }

  /**
   * 📋 Busca informações detalhadas de uma prova
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
   * 💾 Salva resultado de um simulado realizado
   */
  static async salvarResultado(resultado: ResultadoSimulado): Promise<boolean> {
    try {
      console.log('💾 Salvando resultado do simulado...');
      
      const { error } = await supabase
        .from('resultados_simulados')
        .insert({
          id_usuario: resultado.id_usuario,
          id_prova: resultado.id_prova,
          nome_simulado: resultado.nome_simulado,
          ano: resultado.ano,
          total_questoes: resultado.total_questoes,
          acertos: resultado.acertos,
          nota: resultado.nota,
          tempo_gasto_segundos: resultado.tempo_gasto_segundos,
          data_realizacao: resultado.data_realizacao,
          status: resultado.status
        });

      if (error) {
        console.error('❌ Erro ao salvar resultado:', error);
        return false;
      }

      console.log('✅ Resultado salvo com sucesso!');
      return true;

    } catch (error) {
      console.error('💥 Erro ao salvar resultado:', error);
      return false;
    }
  }

  /**
   * 📈 Busca histórico de resultados do usuário
   */
  static async buscarHistoricoUsuario(userId: string): Promise<ResultadoSimulado[]> {
    try {
      console.log(`🔍 Buscando histórico do usuário ${userId}...`);
      
      const { data: resultados, error } = await supabase
        .from('resultados_simulados')
        .select('*')
        .eq('id_usuario', userId)
        .order('data_realizacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        
        // Fallback: retorna mock de dados para desenvolvimento
        const simulados = await this.listarSimulados();
        return simulados.slice(0, 3).map((simulado: SimuladoDoEnem, index: number) => ({
          id_resultado: index + 1,
          id_usuario: userId,
          id_prova: simulado.id_prova,
          nome_simulado: simulado.nome,
          ano: simulado.ano,
          total_questoes: simulado.total_questoes,
          acertos: Math.floor(Math.random() * simulado.total_questoes * 0.8) + Math.floor(simulado.total_questoes * 0.2),
          nota: Math.floor(Math.random() * 400) + 600,
          tempo_gasto_segundos: Math.floor(Math.random() * 7200) + 3600, // 1-3 horas
          data_realizacao: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'concluido' as const
        }));
      }

      return (resultados || []) as ResultadoSimulado[];

    } catch (error) {
      console.error('💥 Erro ao buscar histórico:', error);
      return [];
    }
  }

  // ⚠️ DEPRECATED: Manter apenas para compatibilidade temporária
  // Use listarSimulados() ao invés deste método
  static async buscarSimuladosPorProvas(): Promise<SimuladoDoEnem[]> {
    console.warn('⚠️ buscarSimuladosPorProvas() está obsoleto. Use listarSimulados()');
    return this.listarSimulados();
  }
}