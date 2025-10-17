import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchQuestoesPorProvaTema(id_prova: number, id_tema?: number) {
  let query = supabase
    .from('questoes')
    .select(`*, alternativas (alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, alternativa_correta)`)
    .eq('id_prova', id_prova);
  if (id_tema && id_tema !== -1) {
    query = query.eq('id_tema', id_tema);
  }
  return await query;
}

export async function fetchTemas() {
  return await supabase.from('temas').select('*');
}

export async function fetchProvas() {
  return await supabase.from('provas').select('*');
}

// Adicione outras funções de serviço conforme necessário
