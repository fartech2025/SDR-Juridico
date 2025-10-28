import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchQuestoesPorProvaTema(id_prova: number, id_tema?: number) {
  console.log(`🔍 supabaseService.fetchQuestoesPorProvaTema - Prova: ${id_prova}, Tema: ${id_tema}`);
  
  let query = supabase
    .from('questoes')
    .select(`*, alternativas (id_alternativa, id_questao, letra, texto, correta)`)
    .eq('id_prova', id_prova);
    
  if (id_tema && id_tema !== -1) {
    console.log(`🏷️ Aplicando filtro por tema: ${id_tema}`);
    query = query.eq('id_tema', id_tema);
  } else {
    console.log(`📚 Carregando todas as questões da prova (tema: ${id_tema})`);
  }
  
  const result = await query;
  console.log(`📊 Resultado da consulta: ${result.data?.length || 0} questões, erro:`, result.error);
  
  return result;
}

export async function fetchTemas() {
  return await supabase.from('temas').select('*');
}

export async function fetchProvas() {
  return await supabase.from('provas').select('*');
}

// Adicione outras funções de serviço conforme necessário
