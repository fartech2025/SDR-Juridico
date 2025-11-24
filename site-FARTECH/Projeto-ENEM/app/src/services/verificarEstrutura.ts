import { supabase } from '../lib/supabaseClient';

export async function verificarColunasTabelas(): Promise<{
  sucesso: boolean;
  estrutura: Record<string, unknown>;
  erro?: string;
}> {
  try {
    const estrutura: Record<string, unknown> = {};

    const tabelasParaVerificar = [
      'provas',
      'questoes',
      'alternativas',
      'imagens',
      'respostas_usuarios',
      'resultados_por_tema',
      'resultados_por_dificuldade',
      'resultados_usuarios',
    ];

    for (const tabela of tabelasParaVerificar) {
      try {
        const { data, error } = await supabase.from(tabela).select('*').limit(1);
        if (error) {
          estrutura[tabela] = { existe: false, erro: error.message };
        } else if (data && data.length > 0) {
          estrutura[tabela] = {
            existe: true,
            colunas: Object.keys(data[0]),
            amostra: data[0],
          };
        } else {
          estrutura[tabela] = { existe: true, vazio: true };
        }
      } catch (err: any) {
        estrutura[tabela] = { existe: false, erro: err?.message ?? 'Erro desconhecido' };
      }
    }

    return { sucesso: true, estrutura };
  } catch (error: any) {
    return { sucesso: false, estrutura: {}, erro: error?.message ?? 'Erro desconhecido' };
  }
}

export async function buscarQuestoesComDetalhes(): Promise<{
  sucesso: boolean;
  questoes: any[];
  erro?: string;
}> {
  try {
    const { data: questoes, error } = await supabase.from('questoes').select('*').limit(10);

    if (error) {
      throw error;
    }

    if (questoes && questoes.length > 0) {
      const analise = {
        total_questoes: questoes.length,
        provas: [...new Set(questoes.map((q) => q.id_prova).filter(Boolean))],
        temas: [...new Set(questoes.map((q) => q.id_tema).filter(Boolean))],
        dificuldades: [...new Set(questoes.map((q) => q.dificuldade).filter(Boolean))],
      };
      console.log('Análise das questões:', analise);
    }

    return { sucesso: true, questoes: questoes ?? [] };
  } catch (error: any) {
    console.error('Erro ao buscar questoes:', error);
    return { sucesso: false, questoes: [], erro: error?.message ?? 'Erro desconhecido' };
  }
}
