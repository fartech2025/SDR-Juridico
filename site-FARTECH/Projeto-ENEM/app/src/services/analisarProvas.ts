import { supabase } from '../lib/supabaseClient';
import { SimuladoDoEnem } from './simuladosService';

interface ProvaRegistro {
  id_prova: number;
  ano: number | null;
  descricao: string | null;
  data_aplicacao: string | null;
  tempo_por_questao: number | null;
}

interface Questao {
  id_questao: number;
  id_prova: number;
  enunciado: string;
  dificuldade?: string | null;
  tema?: string | null;
  subtemas?: string[];
}

interface SimuladoAnalise extends SimuladoDoEnem {
  areas_conhecimento: string[];
  disciplinas: string[];
  questoes: Questao[];
}

export async function analisarProvasEQuestoes(): Promise<{
  sucesso: boolean;
  simulados: SimuladoAnalise[];
  erro?: string;
}> {
  try {
    console.log('[INFO] Analisando tabela provas e correlacao com questoes...');

    const { data: provas, error: errorProvas } = await supabase
      .from('provas')
      .select('id_prova, ano, descricao, data_aplicacao, tempo_por_questao')
      .order('id_prova');

    if (errorProvas) {
      throw new Error(`Erro ao buscar provas: ${errorProvas.message}`);
    }

    if (!provas?.length) {
      return {
        sucesso: true,
        simulados: [],
        erro: 'Nenhuma prova encontrada na tabela provas',
      };
    }

    const simulados: SimuladoAnalise[] = [];

    for (const prova of provas as ProvaRegistro[]) {
      console.log(
        `[INFO] Analisando prova ID ${prova.id_prova}: ${prova.descricao ?? 'Sem descricao'}`
      );

      const { data: questoes, error: errorQuestoes } = await supabase
        .from('questoes')
        .select(`
          id_questao,
          id_prova,
          enunciado,
          dificuldade,
          temas:temas ( nome_tema ),
          questoes_subtemas (
            subtemas ( nome_subtema )
          )
        `)
        .eq('id_prova', prova.id_prova);

      if (errorQuestoes) {
        console.error(
          `[WARN] Erro ao buscar questoes da prova ${prova.id_prova}:`,
          errorQuestoes.message
        );
        continue;
      }

      const questoesFormatadas: Questao[] = (questoes ?? []).map((questao: any) => ({
        id_questao: questao.id_questao,
        id_prova: questao.id_prova,
        enunciado: questao.enunciado,
        dificuldade: questao.dificuldade ?? null,
        tema: questao.temas?.nome_tema ?? null,
        subtemas: (questao.questoes_subtemas ?? [])
          .map((rel: any) => rel?.subtemas?.nome_subtema)
          .filter((nome: string | null | undefined): nome is string => Boolean(nome)),
      }));

      const totalQuestoes = questoesFormatadas.length;
      console.log(`[INFO] Prova ${prova.id_prova}: ${totalQuestoes} questoes`);

      if (totalQuestoes === 0) {
        continue;
      }

      const areas = [...new Set(questoesFormatadas.map(q => q.tema))].filter(
        (value): value is string => Boolean(value)
      );
      const disciplinas = [
        ...new Set(questoesFormatadas.flatMap(q => q.subtemas ?? [])),
      ].filter((value): value is string => Boolean(value));

      const anoProva = prova.ano ?? 0;

      const simulado: SimuladoAnalise = {
        id_simulado: prova.id_prova,
        id_prova: prova.id_prova,
        nome: prova.descricao || (anoProva ? `ENEM ${anoProva}` : `Prova ${prova.id_prova}`),
        ano: anoProva,
        descricao: prova.descricao || `Simulado baseado na prova ${prova.id_prova}`,
        total_questoes: totalQuestoes,
        tempo_por_questao: prova.tempo_por_questao ?? null,
        data_aplicacao: prova.data_aplicacao ?? null,
        data_criacao: new Date().toISOString(),
        ativo: true,
        areas_conhecimento: areas,
        disciplinas,
        questoes: questoesFormatadas,
      };

      simulados.push(simulado);

      console.log(`[INFO] Simulado criado: ${simulado.nome}`);
      console.log(`   - Questoes: ${totalQuestoes}`);
      console.log(`   - Temas: ${areas.join(', ') || 'nao informados'}`);
      console.log(`   - Subtemas: ${disciplinas.join(', ') || 'nao informados'}`);
    }

    console.log(`[INFO] Total: ${simulados.length} simulados criados baseados em provas`);

    return {
      sucesso: true,
      simulados,
    };
  } catch (error: any) {
    console.error('[WARN] Erro ao analisar provas e questoes:', error);
    return {
      sucesso: false,
      simulados: [],
      erro: error?.message ?? 'Erro desconhecido',
    };
  }
}

export async function verificarEstruturaBanco(): Promise<{
  sucesso: boolean;
  estrutura: any;
  erro?: string;
}> {
  try {
    console.log('[INFO] Verificando estrutura das tabelas provas e questoes...');

    const { data: amostraProvas, error: errorProvas } = await supabase
      .from('provas')
      .select('*')
      .limit(3);

    const { data: amostraQuestoes, error: errorQuestoes } = await supabase
      .from('questoes')
      .select('*')
      .limit(3);

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
        amostra: amostraProvas?.slice(0, 2),
      },
      questoes: {
        existe: !errorQuestoes,
        total_registros: countQuestoes || 0,
        colunas: amostraQuestoes?.[0] ? Object.keys(amostraQuestoes[0]) : [],
        amostra: amostraQuestoes?.slice(0, 2),
      },
    };

    console.log('[INFO] Estrutura verificada:', JSON.stringify(estrutura, null, 2));

    return {
      sucesso: true,
      estrutura,
    };
  } catch (error: any) {
    console.error('[WARN] Erro ao verificar estrutura:', error);
    return {
      sucesso: false,
      estrutura: {},
      erro: error?.message ?? 'Erro desconhecido',
    };
  }
}


