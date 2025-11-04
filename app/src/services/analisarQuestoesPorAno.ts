import { supabase } from '../lib/supabaseClient';

// Interface para questão
interface Questao {
  id_questao: number;
  ano: number;
  area_conhecimento: string;
  disciplina: string;
  enunciado: string;
  gabarito: string;
  dificuldade?: string;
}

// Interface para simulado baseado em ano
interface SimuladoPorAno {
  ano: number;
  totalQuestoes: number;
  areas: string[];
  disciplinas: string[];
  questoes: Questao[];
}

export async function analisarQuestoesPorAno(): Promise<{
  sucesso: boolean;
  simulados: SimuladoPorAno[];
  erro?: string;
}> {
  try {
    console.log('🔍 Analisando questões por ano...');
    
    // Buscar todas as questões com informações básicas
    const { data: questoes, error } = await supabase
      .from('questoes')
      .select('id_questao, ano, area_conhecimento, disciplina, enunciado, gabarito, dificuldade')
      .order('ano', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar questões: ${error.message}`);
    }

    if (!questoes || questoes.length === 0) {
      return {
        sucesso: true,
        simulados: [],
        erro: 'Nenhuma questão encontrada'
      };
    }

    // Agrupar questões por ano
    const questoesPorAno: { [ano: number]: Questao[] } = {};
    
    questoes.forEach((questao: any) => {
      const ano = questao.ano;
      if (!questoesPorAno[ano]) {
        questoesPorAno[ano] = [];
      }
      questoesPorAno[ano].push(questao);
    });

    // Criar simulados baseados nos anos
    const simulados: SimuladoPorAno[] = Object.keys(questoesPorAno)
      .map(ano => parseInt(ano))
      .sort((a, b) => b - a) // Ordem decrescente (mais recente primeiro)
      .map(ano => {
        const questoesDoAno = questoesPorAno[ano];
        
        // Extrair áreas e disciplinas únicas
        const areas = [...new Set(questoesDoAno.map(q => q.area_conhecimento))].filter(Boolean);
        const disciplinas = [...new Set(questoesDoAno.map(q => q.disciplina))].filter(Boolean);
        
        return {
          ano,
          totalQuestoes: questoesDoAno.length,
          areas,
          disciplinas,
          questoes: questoesDoAno
        };
      });

    console.log(`✅ Encontrados ${simulados.length} simulados (por ano)`);
    simulados.forEach(sim => {
      console.log(`📅 ${sim.ano}: ${sim.totalQuestoes} questões`);
    });

    return {
      sucesso: true,
      simulados
    };

  } catch (error: any) {
    console.error('❌ Erro ao analisar questões:', error);
    return {
      sucesso: false,
      simulados: [],
      erro: error.message
    };
  }
}

export async function criarSimuladosVirtuais(): Promise<{
  sucesso: boolean;
  simuladosCriados: any[];
  erro?: string;
}> {
  try {
    const analise = await analisarQuestoesPorAno();
    
    if (!analise.sucesso) {
      return {
        sucesso: false,
        simuladosCriados: [],
        erro: analise.erro
      };
    }

    // Criar simulados virtuais baseados nos anos
    const simuladosVirtuais = analise.simulados.map(simulado => ({
      id_simulado: `enem_${simulado.ano}`,
      nome: `ENEM ${simulado.ano}`,
      descricao: `Simulado completo do ENEM ${simulado.ano} com ${simulado.totalQuestoes} questões`,
      ano: simulado.ano,
      tipo: 'completo',
      duracao_minutos: 300, // 5 horas como o ENEM real
      total_questoes: simulado.totalQuestoes,
      areas_conhecimento: simulado.areas,
      disciplinas: simulado.disciplinas,
      data_criacao: new Date().toISOString(),
      ativo: true,
      questoes: simulado.questoes.map(q => q.id_questao)
    }));

    console.log(`✅ Criados ${simuladosVirtuais.length} simulados virtuais`);

    return {
      sucesso: true,
      simuladosCriados: simuladosVirtuais
    };

  } catch (error: any) {
    console.error('❌ Erro ao criar simulados virtuais:', error);
    return {
      sucesso: false,
      simuladosCriados: [],
      erro: error.message
    };
  }
}