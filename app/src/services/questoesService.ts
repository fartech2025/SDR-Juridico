import { supabase } from '../lib/supabaseClient';

export interface Imagem {
  id_imagem: number;
  tipo_entidade: 'questao' | 'alternativa' | 'solucao';
  caminho_arquivo: string;
  descricao?: string;
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
  ano: number;
  conteudo?: string;
  ano_enem?: number;
  imagens?: Imagem[];
}

export interface SimuladoComQuestoes {
  id_simulado: number;
  nome: string;
  descricao?: string;
  data_criacao: string;
  questoes: QuestaoComImagens[];
}

/**
 * Busca todas as questões com suas imagens associadas
 */
export async function buscarQuestoesComImagens(): Promise<QuestaoComImagens[]> {
  try {
    const { data, error } = await supabase
      .from('vw_questoes_com_imagens')
      .select('*');

    if (error) throw error;
    return data as QuestaoComImagens[];
  } catch (error) {
    console.error('Erro ao buscar questões com imagens:', error);
    throw error;
  }
}

/**
 * Busca uma questão específica com suas imagens
 */
export async function buscarQuestaoComImagens(
  id_questao: number
): Promise<QuestaoComImagens | null> {
  try {
    const { data, error } = await supabase
      .from('vw_questoes_com_imagens')
      .select('*')
      .eq('id_questao', id_questao)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as QuestaoComImagens) || null;
  } catch (error) {
    console.error(`Erro ao buscar questão ${id_questao}:`, error);
    throw error;
  }
}

/**
 * Busca questões por tema com suas imagens
 */
export async function buscarQuestoesPorTemaPlusImagens(
  tema: string,
  limite?: number
): Promise<QuestaoComImagens[]> {
  try {
    let query = supabase
      .from('vw_questoes_com_imagens')
      .select('*')
      .eq('tema', tema);

    if (limite) query = query.limit(limite);

    const { data, error } = await query;

    if (error) throw error;
    return data as QuestaoComImagens[];
  } catch (error) {
    console.error(`Erro ao buscar questões do tema ${tema}:`, error);
    throw error;
  }
}

/**
 * Busca questões por dificuldade com suas imagens
 */
export async function buscarQuestoesPorDificuldadePlusImagens(
  dificuldade: string,
  limite?: number
): Promise<QuestaoComImagens[]> {
  try {
    let query = supabase
      .from('vw_questoes_com_imagens')
      .select('*')
      .eq('dificuldade', dificuldade);

    if (limite) query = query.limit(limite);

    const { data, error } = await query;

    if (error) throw error;
    return data as QuestaoComImagens[];
  } catch (error) {
    console.error(
      `Erro ao buscar questões da dificuldade ${dificuldade}:`,
      error
    );
    throw error;
  }
}

/**
 * Busca imagens de uma entidade específica (questão, alternativa ou solução)
 */
export async function buscarImagensPorEntidade(
  tipo_entidade: 'questao' | 'alternativa' | 'solucao',
  id_entidade: number
): Promise<Imagem[]> {
  try {
    const { data, error } = await supabase
      .from('questoes_imagens')
      .select('id_imagem, tipo_entidade, caminho_arquivo, descricao')
      .eq('tipo_entidade', tipo_entidade)
      .eq('id_entidade', id_entidade);

    if (error) throw error;
    return data as Imagem[];
  } catch (error) {
    console.error(
      `Erro ao buscar imagens de ${tipo_entidade} ${id_entidade}:`,
      error
    );
    throw error;
  }
}

/**
 * Insere uma nova imagem para uma questão/alternativa/solução
 */
export async function inserirImagemQuestao(
  tipo_entidade: 'questao' | 'alternativa' | 'solucao',
  id_entidade: number,
  caminho_arquivo: string,
  descricao?: string
): Promise<Imagem> {
  try {
    const { data, error } = await supabase
      .from('questoes_imagens')
      .insert({
        tipo_entidade,
        id_entidade,
        caminho_arquivo,
        descricao,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Imagem;
  } catch (error) {
    console.error('Erro ao inserir imagem de questão:', error);
    throw error;
  }
}

/**
 * Atualiza uma imagem existente
 */
export async function atualizarImagemQuestao(
  id_imagem: number,
  caminho_arquivo?: string,
  descricao?: string
): Promise<Imagem> {
  try {
    const updates: Record<string, any> = {};
    if (caminho_arquivo) updates.caminho_arquivo = caminho_arquivo;
    if (descricao !== undefined) updates.descricao = descricao;

    const { data, error } = await supabase
      .from('questoes_imagens')
      .update(updates)
      .eq('id_imagem', id_imagem)
      .select()
      .single();

    if (error) throw error;
    return data as Imagem;
  } catch (error) {
    console.error(`Erro ao atualizar imagem ${id_imagem}:`, error);
    throw error;
  }
}

/**
 * Deleta uma imagem
 */
export async function deletarImagemQuestao(id_imagem: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('questoes_imagens')
      .delete()
      .eq('id_imagem', id_imagem);

    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao deletar imagem ${id_imagem}:`, error);
    throw error;
  }
}

/**
 * Busca um simulado com todas suas questões e imagens
 */
export async function buscarSimuladoComQuestoes(
  id_simulado: number
): Promise<SimuladoComQuestoes | null> {
  try {
    // Primeiro busca o simulado
    const { data: simulado, error: erroSimulado } = await supabase
      .from('simulados')
      .select('*')
      .eq('id_simulado', id_simulado)
      .single();

    if (erroSimulado && erroSimulado.code !== 'PGRST116') throw erroSimulado;
    if (!simulado) return null;

    // Depois busca as questões do simulado
    const { data: questoes, error: erroQuestoes } = await supabase
      .from('simulado_questoes')
      .select('id_questao')
      .eq('id_simulado', id_simulado);

    if (erroQuestoes) throw erroQuestoes;

    // Busca cada questão com suas imagens
    const questoesComImagens: QuestaoComImagens[] = [];
    for (const q of questoes || []) {
      const questao = await buscarQuestaoComImagens(q.id_questao);
      if (questao) questoesComImagens.push(questao);
    }

    return {
      ...simulado,
      questoes: questoesComImagens,
    } as SimuladoComQuestoes;
  } catch (error) {
    console.error(`Erro ao buscar simulado ${id_simulado}:`, error);
    throw error;
  }
}

/**
 * Busca todos os simulados com contagem de questões
 */
export async function buscarSimuladosDisponveis() {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        id_simulado,
        nome,
        descricao,
        data_criacao,
        simulado_questoes (count)
      `);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar simulados:', error);
    throw error;
  }
}
