import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let mounted = true;
        // Se Supabase não está configurado, pula a inicialização
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        // Configuração de auth rápida com fallback imediato
        const init = async () => {
            try {
                // Timeout curto para não travar a UI
                const sessionPromise = supabase.auth.getSession().catch(() => ({ data: { session: null } }));
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 500));
                const result = await Promise.race([sessionPromise, timeoutPromise]);
                if (mounted) {
                    setSession(result.data.session);
                    setUser(result.data.session?.user ?? null);
                    setLoading(false);
                }
            }
            catch (error) {
                console.warn('Auth initialization skipped:', error);
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    setLoading(false);
                }
            }
        };
        // Listener de mudanças de auth
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (mounted) {
                setSession(newSession);
                setUser(newSession?.user ?? null);
            }
        });
        init();
        return () => {
            mounted = false;
            authListener?.subscription?.unsubscribe?.();
        };
    }, []);
    const value = useMemo(() => ({
        user,
        session,
        loading,
        async signIn(email, password) {
            if (!isSupabaseConfigured) {
                return { error: new Error('Supabase não configurado') };
            }
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error: error ?? undefined };
        },
        async signUp(email, password) {
            if (!isSupabaseConfigured) {
                return { error: new Error('Supabase não configurado') };
            }
            const { error } = await supabase.auth.signUp({ email, password });
            return { error: error ?? undefined };
        },
        async signOut() {
            if (!isSupabaseConfigured) {
                return { error: undefined };
            }
            const { error } = await supabase.auth.signOut();
            return { error: error ?? undefined };
        },
    }), [user, session, loading]);
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
