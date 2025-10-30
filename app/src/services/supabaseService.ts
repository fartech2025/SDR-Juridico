import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Questao, Usuario, QuestaoAlternativa, QuestaoImagem } from '../types';

type SelectResponse<T> = {
  data: T[] | null;
  error: Error | null;
};

export async function fetchQuestoesPorProvaTema(id_prova: number, id_tema?: number) {
  const questoesQuery = supabase
    .from('questoes')
    .select('id_questao,id_tema,id_prova,enunciado,dificuldade,tem_imagem,peso_dificuldade,nr_questao')
    .eq('id_prova', id_prova)
    .order('nr_questao', { ascending: true })
    .order('id_questao', { ascending: true });

  const query = id_tema && id_tema !== -1 ? questoesQuery.eq('id_tema', id_tema) : questoesQuery;

  const { data, error } = await query;
  if (error) {
    return { data: null, error };
  }

  const questoes = data ?? [];
  const questaoIds = questoes.map((q) => q.id_questao);

  const alternativasPorQuestao = new Map<number, QuestaoAlternativa[]>();
  const alternativaIds: number[] = [];
  if (questaoIds.length) {
    const { data: alternativasData } = await supabase
      .from('alternativas')
      .select('id_alternativa,id_questao,letra,texto,correta,tem_imagem')
      .in('id_questao', questaoIds)
      .order('id_questao', { ascending: true })
      .order('letra', { ascending: true });

    if (alternativasData) {
      for (const alt of alternativasData) {
        const alternativa: QuestaoAlternativa = {
          id_alternativa: alt.id_alternativa,
          letra: alt.letra,
          texto: alt.texto,
          correta: !!alt.correta,
          tem_imagem: !!alt.tem_imagem,
          imagens: [],
        };
        alternativaIds.push(alt.id_alternativa);
        const bucket = alternativasPorQuestao.get(alt.id_questao);
        if (bucket) bucket.push(alternativa);
        else alternativasPorQuestao.set(alt.id_questao, [alternativa]);
      }
    }
  }

  let imagensPorEntidade: Record<string, QuestaoImagem[]> = {};
  if (questaoIds.length) {
    const { data: imagensData } = await supabase
      .from('imagens')
      .select('id_imagem,id_entidade,tipo_entidade,caminho_arquivo,descricao')
      .in('id_entidade', [...questaoIds, ...alternativaIds]);

    if (imagensData) {
      imagensPorEntidade = imagensData.reduce<Record<string, QuestaoImagem[]>>((acc, img) => {
        const key = `${img.tipo_entidade}:${img.id_entidade}`;
        const entry: QuestaoImagem = {
          id_imagem: img.id_imagem,
          caminho_arquivo: img.caminho_arquivo,
          descricao: img.descricao,
        };
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {});
    }
  }

  const formatted: Questao[] = questoes.map((questao) => {
    const alternativas = alternativasPorQuestao.get(questao.id_questao) ?? [];
    for (const alternativa of alternativas) {
      const altKey = `alternativa:${alternativa.id_alternativa}`;
      alternativa.imagens = imagensPorEntidade[altKey] ?? [];
    }
    const alternativaCorreta = alternativas.find((alt) => alt.correta)?.letra ?? null;

    const questaoImagensKey = `questao:${questao.id_questao}`;

    return {
      id_questao: questao.id_questao,
      id_tema: questao.id_tema,
      id_prova: questao.id_prova,
      enunciado: questao.enunciado,
      dificuldade: questao.dificuldade,
      tem_imagem: !!questao.tem_imagem,
      nr_questao: questao.nr_questao ?? null,
      peso_dificuldade: questao.peso_dificuldade ?? null,
      imagens: imagensPorEntidade[questaoImagensKey] ?? [],
      alternativas,
      alternativa_correta: alternativaCorreta,
    };
  });

  return { data: formatted, error: null };
}

export async function fetchTemas() {
  return supabase.from('temas').select('id_tema, nome_tema, descricao');
}

export async function fetchProvas() {
  return supabase
    .from('provas')
    .select('id_prova, nome, ano, descricao, tempo_por_questao')
    .order('ano', { ascending: false });
}

export async function fetchUsuarioPorAuthId(authUserId: string) {
  return supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle<Usuario>();
}

export async function ensureUsuarioRegistro(user: User, nome?: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .upsert(
      {
        auth_user_id: user.id,
        email: user.email,
        nome: nome ?? user.user_metadata?.nome ?? null,
      },
      { onConflict: 'auth_user_id', ignoreDuplicates: false }
    )
    .select('*')
    .maybeSingle<Usuario>();

  if (error) {
    throw error;
  }

  return data ?? (await fetchUsuarioPorAuthId(user.id)).data!;
}

export async function listarUsuarios(): Promise<SelectResponse<Usuario>> {
  const { data, error } = await supabase.from('usuarios').select('*');
  return { data, error };
}

export { supabase };
