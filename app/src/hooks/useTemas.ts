import { useEffect, useState } from 'react';
import { fetchTemas } from '../services/supabaseService';
import type { Tema } from '../types';

export function useTemas() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchTemas();
      if (error) setError('Erro ao carregar temas');
      setTemas(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return { temas, loading, error };
}
