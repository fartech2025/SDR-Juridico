import { supabase } from '../lib/supabaseClient';
import { SimuladosService, type SimuladoPorProva } from './simuladosService';

export interface Imagem {
  id_imagem: number;
  tipo_entidade: 'questao' | 'alternativa' | 'solucao';
  id_entidade: number;
  caminho_arquivo: string;
  descricao?: string | null;
}

export interface QuestaoComImagens {
  id_questao: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  tema: string;
  dificuldade: string;
  ano: number | null;
  conteudo?: string | null;
  ano_enem?: number | null;
  imagens?: Imagem[];
}

export interface SimuladoComQuestoes {
  id_simulado: number;
  nome: string;
  descricao?: string | null;
  data_criacao: string;
  questoes: QuestaoComImagens[];
}

type RawQuestao = {
  id_questao: number;
  enunciado: string;
  dificuldade: string;
  id_prova: number;
  id_tema: number;
  alternativa?: any;
  nr_questao?: number | null;
  temas?: { nome_tema?: string | null };
  provas?: { ano?: number | null };
  alternativas?: Array<{
    id_alternativa: number;
    letra: string;
    texto: string | null;
    correta: boolean | null;
    tem_imagem: boolean | null;
  }>;
};

type QuestoesFiltro = {
  idQuestao?: number;
  idProva?: number;
  idTema?: number;
  temaNome?: string;
  dificuldade?: string;
  limit?: number;
};

async function carregarQuestoesDetalhadas(filtro: QuestoesFiltro = {}) {
  let query = supabase
    .from('questoes')
    .select(
      `id_questao,
       enunciado,
       dificuldade,
       id_prova,
       id_tema,
       nr_questao,
       temas:temas ( nome_tema ),
       provas:provas ( ano ),
       alternativas:alternativas (
         id_alternativa,
         letra,
         texto,
         correta,
         tem_imagem
       )`
    )
    .order('nr_questao', { ascending: true })
    .order('id_questao', { ascending: true });

  if (filtro.idQuestao) {
    query = query.eq('id_questao', filtro.idQuestao);
  }

  if (filtro.idProva) {
    query = query.eq('id_prova', filtro.idProva);
  }

  if (filtro.idTema) {
    query = query.eq('id_tema', filtro.idTema);
  }

  if (filtro.dificuldade) {
    query = query.eq('dificuldade', filtro.dificuldade);
  }

  if (filtro.limit) {
    query = query.limit(filtro.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let filtradas = data ?? [];

  // Se o filtro vier pelo nome do tema, aplicar em memória (evita múltiplas consultas)
  if (filtro.temaNome) {
    const nomeNormalizado = filtro.temaNome.trim().toLowerCase();
    filtradas = filtradas.filter((questao: any) =>
      (questao.temas?.nome_tema ?? '').toLowerCase() === nomeNormalizado
    );
  }

  return filtradas as RawQuestao[];
}

function organizarAlternativas(
  alternativas: RawQuestao['alternativas']
): {
  porLetra: Record<string, string>;
  respostaCorreta: string;
  alternativaIds: number[];
} {
  const letras = ['A', 'B', 'C', 'D', 'E'];
  const porLetra: Record<string, string> = {
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  };

  let respostaCorreta = '';
  const alternativaIds: number[] = [];

  for (const alt of alternativas ?? []) {
    const letra = (alt.letra || '').toUpperCase();
    if (letras.includes(letra)) {
      porLetra[letra] = alt.texto ?? '';
      alternativaIds.push(alt.id_alternativa);
      if (alt.correta) {
        respostaCorreta = letra;
      }
    }
  }

  return { porLetra, respostaCorreta, alternativaIds };
}

async function carregarImagens(
  questaoIds: number[],
  alternativaIds: number[]
): Promise<{ porQuestao: Map<number, Imagem[]>; porAlternativa: Map<number, Imagem[]> }> {
  const porQuestao = new Map<number, Imagem[]>();
  const porAlternativa = new Map<number, Imagem[]>();

  if (questaoIds.length) {
    const { data: imagensQuestao, error } = await supabase
      .from('imagens')
      .select('id_imagem, tipo_entidade, id_entidade, caminho_arquivo, descricao')
      .eq('tipo_entidade', 'questao')
      .in('id_entidade', questaoIds);

    if (!error) {
      for (const img of imagensQuestao ?? []) {
        const lista = porQuestao.get(img.id_entidade) ?? [];
        lista.push({
          id_imagem: img.id_imagem,
          tipo_entidade: 'questao',
          id_entidade: img.id_entidade,
          caminho_arquivo: img.caminho_arquivo,
          descricao: img.descricao,
        });
        porQuestao.set(img.id_entidade, lista);
      }
    } else {
      console.error('Erro ao carregar imagens de questao:', error);
    }
  }

  if (alternativaIds.length) {
    const { data: imagensAlternativa, error } = await supabase
      .from('imagens')
      .select('id_imagem, tipo_entidade, id_entidade, caminho_arquivo, descricao')
      .eq('tipo_entidade', 'alternativa')
      .in('id_entidade', alternativaIds);

    if (!error) {
      for (const img of imagensAlternativa ?? []) {
        const lista = porAlternativa.get(img.id_entidade) ?? [];
        lista.push({
          id_imagem: img.id_imagem,
          tipo_entidade: 'alternativa',
          id_entidade: img.id_entidade,
          caminho_arquivo: img.caminho_arquivo,
          descricao: img.descricao,
        });
        porAlternativa.set(img.id_entidade, lista);
      }
    } else {
      console.error('Erro ao carregar imagens de alternativa:', error);
    }
  }

  return { porQuestao, porAlternativa };
}

function montarQuestaoComImagens(
  questao: RawQuestao,
  imagensQuestao: Map<number, Imagem[]>,
  imagensAlternativa: Map<number, Imagem[]>
): QuestaoComImagens {
  const { porLetra, respostaCorreta } = organizarAlternativas(questao.alternativas);
  const questaoImages = imagensQuestao.get(questao.id_questao) ?? [];
  const alternativasImages = questao.alternativas?.flatMap((alt) => {
    const imagens = imagensAlternativa.get(alt.id_alternativa) ?? [];
    return imagens.map((img) => ({
      ...img,
      tipo_entidade: 'alternativa' as const,
    }));
  }) ?? [];

  return {
    id_questao: questao.id_questao,
    enunciado: questao.enunciado,
    alternativa_a: porLetra.A ?? '',
    alternativa_b: porLetra.B ?? '',
    alternativa_c: porLetra.C ?? '',
    alternativa_d: porLetra.D ?? '',
    alternativa_e: porLetra.E ?? '',
    resposta_correta: respostaCorreta || '',
    tema: questao.temas?.nome_tema ?? 'Tema não informado',
    dificuldade: questao.dificuldade ?? 'Médio',
    ano: questao.provas?.ano ?? null,
    conteudo: null,
    ano_enem: questao.provas?.ano ?? null,
    imagens: [...questaoImages, ...alternativasImages],
  };
}

async function montarQuestoes(filtro: QuestoesFiltro = {}): Promise<QuestaoComImagens[]> {
  const questoes = await carregarQuestoesDetalhadas(filtro);
  if (!questoes.length) {
    return [];
  }

  const questaoIds = questoes.map((q) => q.id_questao);
  const alternativaIds = questoes.flatMap((q) => q.alternativas?.map((alt) => alt.id_alternativa) ?? []);

  const { porQuestao, porAlternativa } = await carregarImagens(questaoIds, alternativaIds);

  return questoes.map((questao) => montarQuestaoComImagens(questao, porQuestao, porAlternativa));
}

export async function buscarQuestoesComImagens(): Promise<QuestaoComImagens[]> {
  try {
    return await montarQuestoes();
  } catch (error) {
    console.error('Erro ao buscar questoes com imagens:', error);
    throw error;
  }
}

export async function buscarQuestaoComImagens(id_questao: number): Promise<QuestaoComImagens | null> {
  try {
    const questoes = await montarQuestoes({ idQuestao: id_questao });
    return questoes[0] ?? null;
  } catch (error) {
    console.error(`Erro ao buscar questao ${id_questao}:`, error);
    throw error;
  }
}

export async function buscarQuestoesPorTemaPlusImagens(
  tema: string,
  limite?: number
): Promise<QuestaoComImagens[]> {
  try {
    return await montarQuestoes({ temaNome: tema, limit: limite });
  } catch (error) {
    console.error(`Erro ao buscar questoes do tema ${tema}:`, error);
    throw error;
  }
}

export async function buscarQuestoesPorDificuldadePlusImagens(
  dificuldade: string,
  limite?: number
): Promise<QuestaoComImagens[]> {
  try {
    return await montarQuestoes({ dificuldade, limit: limite });
  } catch (error) {
    console.error(`Erro ao buscar questoes da dificuldade ${dificuldade}:`, error);
    throw error;
  }
}

export async function buscarImagensPorEntidade(
  tipo_entidade: Imagem['tipo_entidade'],
  id_entidade: number
): Promise<Imagem[]> {
  const { data, error } = await supabase
    .from('imagens')
    .select('id_imagem, tipo_entidade, id_entidade, caminho_arquivo, descricao')
    .eq('tipo_entidade', tipo_entidade)
    .eq('id_entidade', id_entidade);

  if (error) {
    throw error;
  }

  return (data ?? []).map((img) => ({
    id_imagem: img.id_imagem,
    tipo_entidade: img.tipo_entidade as Imagem['tipo_entidade'],
    id_entidade: img.id_entidade,
    caminho_arquivo: img.caminho_arquivo,
    descricao: img.descricao,
  }));
}

export async function criarImagemQuestao(
  tipo_entidade: Imagem['tipo_entidade'],
  id_entidade: number,
  caminho_arquivo: string,
  descricao?: string
): Promise<Imagem> {
  const { data, error } = await supabase
    .from('imagens')
    .insert({
      tipo_entidade,
      id_entidade,
      caminho_arquivo,
      descricao,
    })
    .select('id_imagem, tipo_entidade, id_entidade, caminho_arquivo, descricao')
    .single();

  if (error) {
    throw error;
  }

  return {
    id_imagem: data.id_imagem,
    tipo_entidade: data.tipo_entidade as Imagem['tipo_entidade'],
    id_entidade: data.id_entidade,
    caminho_arquivo: data.caminho_arquivo,
    descricao: data.descricao,
  };
}

export async function atualizarImagemQuestao(
  id_imagem: number,
  updates: { caminho_arquivo?: string; descricao?: string | null }
): Promise<Imagem> {
  const { data, error } = await supabase
    .from('imagens')
    .update(updates)
    .eq('id_imagem', id_imagem)
    .select('id_imagem, tipo_entidade, id_entidade, caminho_arquivo, descricao')
    .single();

  if (error) {
    throw error;
  }

  return {
    id_imagem: data.id_imagem,
    tipo_entidade: data.tipo_entidade as Imagem['tipo_entidade'],
    id_entidade: data.id_entidade,
    caminho_arquivo: data.caminho_arquivo,
    descricao: data.descricao,
  };
}

export async function deletarImagemQuestao(id_imagem: number): Promise<void> {
  const { error } = await supabase.from('imagens').delete().eq('id_imagem', id_imagem);
  if (error) {
    throw error;
  }
}

export async function buscarSimuladoComQuestoes(
  id_simulado: number
): Promise<SimuladoComQuestoes | null> {
  try {
    const simulados = await SimuladosService.buscarSimuladosPorProvas();
    const simuladoBase = simulados.find((s) => s.id_simulado === id_simulado);
    if (!simuladoBase) {
      return null;
    }

    const questoes = await montarQuestoes({ idProva: simuladoBase.id_prova });

    return {
      id_simulado: simuladoBase.id_simulado,
      nome: simuladoBase.nome,
      descricao: simuladoBase.descricao,
      data_criacao: simuladoBase.data_criacao,
      questoes,
    };
  } catch (error) {
    console.error(`Erro ao buscar simulado ${id_simulado}:`, error);
    throw error;
  }
}

export async function buscarSimuladosDisponveis(): Promise<SimuladoPorProva[]> {
  return SimuladosService.buscarSimuladosPorProvas();
}
