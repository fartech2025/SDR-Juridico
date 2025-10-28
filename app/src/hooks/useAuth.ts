import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession ? supabase.auth.getSession() : null;
    if (session) {
      setUser(session.user);
      setLoading(false);
    } else {
      supabase.auth.getUser().then(({ data, error }) => {
        setUser(data?.user || null);
        setLoading(false);
      });
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
