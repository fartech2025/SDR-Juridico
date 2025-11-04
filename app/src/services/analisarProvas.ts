import { supabase } from '../lib/supabaseClient';

// Interface para prova
interface Prova {
  id_prova: number;
  nome?: string;
  ano?: number;
  tipo?: string;
  descricao?: string;
  data_prova?: string;
  ativa?: boolean;
}

// Interface para questão
interface Questao {
  id_questao: number;
  id_prova: number;
  enunciado: string;
  area_conhecimento?: string;
  disciplina?: string;
  gabarito?: string;
  dificuldade?: string;
}

// Interface para simulado baseado em prova
interface SimuladoPorProva {
  id_prova: number;
  nome: string;
  ano?: number;
  tipo?: string;
  descricao?: string;
  total_questoes: number;
  areas_conhecimento: string[];
  disciplinas: string[];
  questoes: Questao[];
}

export async function analisarProvasEQuestoes(): Promise<{
  sucesso: boolean;
  simulados: SimuladoPorProva[];
  erro?: string;
}> {
  try {
    console.log('🔍 Analisando tabela provas e correlação com questões...');
    
    // Primeiro, buscar todas as provas
    const { data: provas, error: errorProvas } = await supabase
      .from('provas')
      .select('*')
      .order('id_prova');

    if (errorProvas) {
      throw new Error(`Erro ao buscar provas: ${errorProvas.message}`);
    }

    console.log(`📚 Encontradas ${provas?.length || 0} provas`);

    if (!provas || provas.length === 0) {
      return {
        sucesso: true,
        simulados: [],
        erro: 'Nenhuma prova encontrada na tabela provas'
      };
    }

    // Agora buscar questões para cada prova
    const simulados: SimuladoPorProva[] = [];

    for (const prova of provas) {
      console.log(`🔍 Analisando prova ID ${prova.id_prova}: ${prova.descricao || 'Sem descrição'}`);
      
      // Buscar questões desta prova
      const { data: questoes, error: errorQuestoes } = await supabase
        .from('questoes')
        .select('id_questao, id_prova, enunciado, area_conhecimento, disciplina, gabarito, dificuldade')
        .eq('id_prova', prova.id_prova);

      if (errorQuestoes) {
        console.error(`❌ Erro ao buscar questões da prova ${prova.id_prova}:`, errorQuestoes.message);
        continue;
      }

      const totalQuestoes = questoes?.length || 0;
      console.log(`📝 Prova ${prova.id_prova}: ${totalQuestoes} questões`);

      if (totalQuestoes > 0) {
        // Extrair áreas e disciplinas únicas
        const areas = [...new Set(questoes!.map(q => q.area_conhecimento))].filter(Boolean);
        const disciplinas = [...new Set(questoes!.map(q => q.disciplina))].filter(Boolean);
        
        const simulado: SimuladoPorProva = {
          id_prova: prova.id_prova,
          nome: prova.descricao || `Prova ${prova.id_prova}`,
          ano: prova.ano,
          tipo: prova.tipo,
          descricao: prova.descricao || `Simulado baseado na prova ${prova.id_prova}`,
          total_questoes: totalQuestoes,
          areas_conhecimento: areas,
          disciplinas: disciplinas,
          questoes: questoes!
        };

        simulados.push(simulado);
        
        console.log(`✅ Simulado criado: ${simulado.nome}`);
        console.log(`   📊 ${totalQuestoes} questões`);
        console.log(`   📑 Áreas: ${areas.join(', ')}`);
        console.log(`   📚 Disciplinas: ${disciplinas.join(', ')}`);
      }
    }

    console.log(`✅ Total: ${simulados.length} simulados criados baseados em provas`);

    return {
      sucesso: true,
      simulados
    };

  } catch (error: any) {
    console.error('❌ Erro ao analisar provas e questões:', error);
    return {
      sucesso: false,
      simulados: [],
      erro: error.message
    };
  }
}

export async function verificarEstruturaBanco(): Promise<{
  sucesso: boolean;
  estrutura: any;
  erro?: string;
}> {
  try {
    console.log('🔍 Verificando estrutura das tabelas provas e questões...');
    
    // Verificar tabela provas
    const { data: amostraProvas, error: errorProvas } = await supabase
      .from('provas')
      .select('*')
      .limit(3);

    // Verificar tabela questões
    const { data: amostraQuestoes, error: errorQuestoes } = await supabase
      .from('questoes')
      .select('*')
      .limit(3);

    // Contar registros
    const { count: countProvas } = await supabase
      .from('provas')
      .select('*', { count: 'exact', head: true });

    const { count: countQuestoes } = await supabase
      .from('questoes')
      .select('*', { count: 'exact', head: true });

    const estrutura = {
      provas: {
        existe: !errorProvas,
        total_registros: countProvas || 0,
        colunas: amostraProvas?.[0] ? Object.keys(amostraProvas[0]) : [],
        amostra: amostraProvas?.slice(0, 2)
      },
      questoes: {
        existe: !errorQuestoes,
        total_registros: countQuestoes || 0,
        colunas: amostraQuestoes?.[0] ? Object.keys(amostraQuestoes[0]) : [],
        amostra: amostraQuestoes?.slice(0, 2)
      }
    };

    console.log('📊 Estrutura verificada:', JSON.stringify(estrutura, null, 2));

    return {
      sucesso: true,
      estrutura
    };

  } catch (error: any) {
    console.error('❌ Erro ao verificar estrutura:', error);
    return {
      sucesso: false,
      estrutura: {},
      erro: error.message
    };
  }
}