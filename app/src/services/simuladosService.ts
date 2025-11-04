import { supabase } from '../lib/supabaseClient';

export interface SimuladoDoEnem {
  id_simulado: number;
  id_prova: number;
  nome: string;
  ano: number;
  descricao: string | null;
  total_questoes: number;
  tempo_por_questao: number | null;
  data_aplicacao: string | null;
  data_criacao: string;
  ativo: boolean;
}

export interface QuestaoCompleta {
  id_questao: number;
  id_prova: number;
  id_tema: number | null;
  enunciado: string;
  dificuldade: string | null;
  tem_imagem: boolean;
  nr_questao: number | null;
  peso_dificuldade: number | null;
  alternativas: Array<{
    id_alternativa: number;
    letra: string;
    texto: string | null;
    correta: boolean;
    tem_imagem: boolean;
  }>;
}

export interface EstatisticasSimulados {
  simuladosDisponiveis: number;
  provasDisponiveis: number[];
  totalQuestoes: number;
  anosDisponiveis: number[];
}

type RespostaAgrupada = {
  id_prova: number;
  total_respondidas: number;
  total_acertos: number;
  ultima_resposta?: string | null;
};

export class SimuladosService {
  static async listarSimulados(): Promise<SimuladoDoEnem[]> {
    const { data: provas, error } = await supabase
      .from('provas')
      .select('id_prova, ano, descricao, data_aplicacao, tempo_por_questao')
      .order('ano', { ascending: false });

    if (error) {
      console.error('Erro ao buscar provas para simulados:', error);
      throw error;
    }

    const lista: SimuladoDoEnem[] = [];

    for (const prova of provas ?? []) {
      const { count, error: countError } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('id_prova', prova.id_prova);

      if (countError) {
        console.error(`Falha ao contar questÃµes da prova ${prova.id_prova}:`, countError);
        continue;
      }

      const totalQuestoes = count ?? 0;
      if (totalQuestoes === 0) {
        continue;
      }

      lista.push({
        id_simulado: prova.id_prova,
        id_prova: prova.id_prova,
        nome: prova.descricao || `ENEM ${prova.ano}`,
        ano: prova.ano,
        descricao: prova.descricao ?? null,
        total_questoes: totalQuestoes,
        tempo_por_questao: prova.tempo_por_questao ?? null,
        data_aplicacao: prova.data_aplicacao ?? null,
        data_criacao: prova.data_aplicacao ?? new Date().toISOString(),
        ativo: true,
      });
    }

    return lista;
  }

    static async buscarSimulado(idSimulado: number): Promise<SimuladoDoEnem | null> {
    const simulados = await this.listarSimulados();
    return simulados.find((s) => s.id_simulado === idSimulado) ?? null;
  }
static async buscarSimuladosPorProvas(): Promise<SimuladoDoEnem[]> {
    return this.listarSimulados();
  }

  static async buscarEstatisticasSimulados(): Promise<EstatisticasSimulados> {
    const simulados = await this.listarSimulados();

    const provasDisponiveis = simulados.map((s) => s.id_prova);
    const anosDisponiveis = [...new Set(simulados.map((s) => s.ano))].sort((a, b) => b - a);
    const totalQuestoes = simulados.reduce((total, s) => total + s.total_questoes, 0);

    return {
      simuladosDisponiveis: simulados.length,
      provasDisponiveis,
      totalQuestoes,
      anosDisponiveis,
    };
  }

  static async buscarQuestoesSimulado(idProva: number): Promise<QuestaoCompleta[]> {
    const { data, error } = await supabase
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

    if (error) {
      console.error(`Erro ao buscar questÃµes da prova ${idProva}:`, error);
      throw error;
    }

    return (data ?? []).map((linha) => ({
      id_questao: linha.id_questao,
      id_prova: linha.id_prova,
      id_tema: linha.id_tema ?? null,
      enunciado: linha.enunciado,
      dificuldade: linha.dificuldade ?? null,
      tem_imagem: Boolean(linha.tem_imagem),
      nr_questao: linha.nr_questao ?? null,
      peso_dificuldade: linha.peso_dificuldade ?? null,
      alternativas: (linha.alternativas ?? []).map((alt: any) => ({
        id_alternativa: alt.id_alternativa,
        letra: alt.letra,
        texto: alt.texto,
        correta: Boolean(alt.correta),
        tem_imagem: Boolean(alt.tem_imagem),
      })),
    }));
  }

  static async buscarProva(idProva: number) {
    const { data, error } = await supabase
      .from('provas')
      .select('id_prova, ano, descricao, data_aplicacao, tempo_por_questao')
      .eq('id_prova', idProva)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  static async buscarHistoricoUsuario(idUsuario: number): Promise<RespostaAgrupada[]> {
    const { data, error } = await supabase
      .from('respostas_usuarios')
      .select('correta, data_resposta, questoes:questoes(id_prova)')
      .eq('id_usuario', idUsuario);

    if (error) {
      console.error('Erro ao agrupar respostas por usuÃ¡rio:', error);
      throw error;
    }

    const agregados = new Map<number, RespostaAgrupada>();

    (data ?? []).forEach((linha: any) => {
      const idProva = linha.questoes?.id_prova;
      if (!idProva) return;

      const bucket =
        agregados.get(idProva) ?? {
          id_prova: idProva,
          total_respondidas: 0,
          total_acertos: 0,
          ultima_resposta: null as string | null,
        };

      bucket.total_respondidas += 1;
      if (linha.correta) {
        bucket.total_acertos += 1;
      }

      const dataResposta = linha.data_resposta as string | null;
      if (!bucket.ultima_resposta || (dataResposta && dataResposta > bucket.ultima_resposta)) {
        bucket.ultima_resposta = dataResposta ?? null;
      }

      agregados.set(idProva, bucket);
    });

    return Array.from(agregados.values());
  }
}

