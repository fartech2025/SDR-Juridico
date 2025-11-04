import { supabase } from '../lib/supabaseClient';

interface Questao {
  id_questao: number;
  id_prova: number;
  ano: number | null;
  enunciado: string;
  dificuldade?: string | null;
  tema?: string | null;
  subtemas?: string[];
}

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
    console.log('[INFO] Analisando questões por ano...');

    const { data: questoes, error } = await supabase
      .from('questoes')
      .select(`
        id_questao,
        id_prova,
        enunciado,
        dificuldade,
        provas:provas ( ano ),
        temas:temas ( nome_tema ),
        questoes_subtemas (
          subtemas ( nome_subtema )
        )
      `);

    if (error) {
      throw new Error(`Erro ao buscar questões: ${error.message}`);
    }

    if (!questoes?.length) {
      return {
        sucesso: true,
        simulados: [],
        erro: 'Nenhuma questão encontrada',
      };
    }

    const questoesNormalizadas: Questao[] = (questoes ?? []).map((questao: any) => ({
      id_questao: questao.id_questao,
      id_prova: questao.id_prova,
      ano: questao.provas?.ano ?? null,
      enunciado: questao.enunciado,
      dificuldade: questao.dificuldade ?? null,
      tema: questao.temas?.nome_tema ?? null,
      subtemas: (questao.questoes_subtemas ?? [])
        .map((rel: any) => rel?.subtemas?.nome_subtema)
        .filter((nome: string | null | undefined): nome is string => Boolean(nome)),
    }));

    const agrupadoPorAno = questoesNormalizadas.reduce<Map<number, Questao[]>>((acc, questao) => {
      if (questao.ano === null || questao.ano === undefined) {
        return acc;
      }

      const bucket = acc.get(questao.ano) ?? [];
      bucket.push(questao);
      acc.set(questao.ano, bucket);
      return acc;
    }, new Map());

    const simulados: SimuladoPorAno[] = Array.from(agrupadoPorAno.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([ano, lista]) => {
        const areas = [...new Set(lista.map(q => q.tema))].filter(
          (value): value is string => Boolean(value)
        );
        const disciplinas = [
          ...new Set(lista.flatMap(q => q.subtemas ?? [])),
        ].filter((value): value is string => Boolean(value));

        return {
          ano,
          totalQuestoes: lista.length,
          areas,
          disciplinas,
          questoes: lista,
        };
      });

    console.log(`[INFO] Encontrados ${simulados.length} simulados (por ano)`);
    simulados.forEach(sim => {
      console.log(`[INFO] ${sim.ano}: ${sim.totalQuestoes} questões`);
    });

    return {
      sucesso: true,
      simulados,
    };
  } catch (error: any) {
    console.error('[WARN] Erro ao analisar questões:', error);
    return {
      sucesso: false,
      simulados: [],
      erro: error?.message ?? 'Erro desconhecido',
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
        erro: analise.erro,
      };
    }

    const simuladosVirtuais = analise.simulados.map(simulado => ({
      id_simulado: `enem_${simulado.ano}`,
      nome: `ENEM ${simulado.ano}`,
      descricao: `Simulado completo do ENEM ${simulado.ano} com ${simulado.totalQuestoes} questões`,
      ano: simulado.ano,
      tipo: 'completo',
      duracao_minutos: 300,
      total_questoes: simulado.totalQuestoes,
      areas_conhecimento: simulado.areas,
      disciplinas: simulado.disciplinas,
      data_criacao: new Date().toISOString(),
      ativo: true,
      questoes: simulado.questoes.map(q => q.id_questao),
    }));

    console.log(`[INFO] Criados ${simuladosVirtuais.length} simulados virtuais`);

    return {
      sucesso: true,
      simuladosCriados: simuladosVirtuais,
    };
  } catch (error: any) {
    console.error('[WARN] Erro ao criar simulados virtuais:', error);
    return {
      sucesso: false,
      simuladosCriados: [],
      erro: error?.message ?? 'Erro desconhecido',
    };
  }
}

