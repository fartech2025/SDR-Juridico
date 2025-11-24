import { useEffect, useState } from 'react';
import { fetchProvas } from '../services/supabaseService';
import type { Prova } from '../types/index';

export function useProvas() {
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchProvas();
      if (error) setError('Erro ao carregar provas');
      setProvas(data || []);
      setLoading(false);
    }
    void load();
  }, []);

  return { provas, loading, error };
}
