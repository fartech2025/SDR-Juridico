import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Questao, Usuario, QuestaoAlternativa, QuestaoImagem } from '../types/index';

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

// Lightweight: retorna apenas os ids (e nr_questao se disponível) para montar o simulado sem carregar imagens
export async function fetchQuestoesIdsPorProvaTema(id_prova: number, id_tema?: number) {
  const questoesQuery = supabase
    .from('questoes')
    .select('id_questao,nr_questao')
    .eq('id_prova', id_prova)
    .order('nr_questao', { ascending: true })
    .order('id_questao', { ascending: true });

  const query = id_tema && id_tema !== -1 ? questoesQuery.eq('id_tema', id_tema) : questoesQuery;
  const { data, error } = await query;
  return { data: data ?? [], error };
}

// Fetch completo de uma única questão (inclui alternativas e imagens relacionadas)
export async function fetchQuestaoById(id_questao: number) {
  const { data: q, error: qErr } = await supabase
    .from('questoes')
    .select('id_questao,id_tema,id_prova,enunciado,dificuldade,tem_imagem,peso_dificuldade,nr_questao')
    .eq('id_questao', id_questao)
    .maybeSingle();

  if (qErr) return { data: null, error: qErr };
  if (!q) return { data: null, error: null };

  const { data: alternativasData, error: altErr } = await supabase
    .from('alternativas')
    .select('id_alternativa,id_questao,letra,texto,correta,tem_imagem')
    .eq('id_questao', id_questao)
    .order('letra', { ascending: true });

  if (altErr) return { data: null, error: altErr };

  const alternativaIds = (alternativasData ?? []).map((a: any) => a.id_alternativa);

  const { data: imagensData, error: imgErr } = await supabase
    .from('imagens')
    .select('id_imagem,id_entidade,tipo_entidade,caminho_arquivo,descricao')
    .in('id_entidade', [id_questao, ...alternativaIds]);

  if (imgErr) return { data: null, error: imgErr };

  const imagensPorEntidade = (imagensData ?? []).reduce<Record<string, QuestaoImagem[]>>((acc, img: any) => {
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

  const alternativas = (alternativasData ?? []).map((alt: any) => ({
    id_alternativa: alt.id_alternativa,
    letra: alt.letra,
    texto: alt.texto,
    correta: !!alt.correta,
    tem_imagem: !!alt.tem_imagem,
    imagens: imagensPorEntidade[`alternativa:${alt.id_alternativa}`] ?? [],
  }));

  const questaoImagens = imagensPorEntidade[`questao:${id_questao}`] ?? [];
  const alternativaCorreta = alternativas.find((a) => a.correta)?.letra ?? null;

  const formatted: Questao = {
    id_questao: q.id_questao,
    id_tema: q.id_tema,
    id_prova: q.id_prova,
    enunciado: q.enunciado,
    dificuldade: q.dificuldade,
    tem_imagem: !!q.tem_imagem,
    nr_questao: q.nr_questao ?? null,
    peso_dificuldade: q.peso_dificuldade ?? null,
    imagens: questaoImagens,
    alternativas,
    alternativa_correta: alternativaCorreta,
  };

  return { data: formatted, error: null };
}

export async function fetchTemas() {
  return supabase.from('temas').select('id_tema, nome_tema, descricao');
}

export async function fetchProvas() {
  return supabase
    .from('provas')
    .select('id_prova, descricao, ano, tempo_por_questao, cor_caderno, data_aplicacao')
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
        celular: '',
        senha_hash: '',
        data_cadastro: new Date().toISOString(),
        num_provas_realizadas: 0,
        esta_logado: false,
        nivel: 1,
        xp_total: 0,
        streak_dias: 0,
        ultima_resposta_em: null
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
