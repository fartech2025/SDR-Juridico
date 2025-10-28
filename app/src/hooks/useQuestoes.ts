import { useEffect, useState } from 'react';
import { fetchQuestoesPorProvaTema } from '../services/supabaseService';
import type { Questao } from '../types';

export function useQuestoes(id_prova: number, id_tema?: number) {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchQuestoesPorProvaTema(id_prova, id_tema);
      if (error) setError('Erro ao carregar questões');
      setQuestoes(data || []);
      setLoading(false);
    }
    if (id_prova) load();
  }, [id_prova, id_tema]);

  return { questoes, loading, error };
}
