import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export default function DebugAuth() {
  const { user, loading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error: err } = await supabase.auth.getSession();
        if (err) {
          setError(`Erro ao buscar sessão: ${err.message}`);
        } else {
          setSession(data?.session);
        }
      } catch (err: any) {
        setError(`Erro inesperado: ${err.message}`);
      }
    };

    fetchSession();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-400 mb-8">🔍 Debug Auth</h1>

        {/* Supabase Config */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4">⚙️ Configuração Supabase</h2>
          <div className="space-y-2 text-slate-300 font-mono text-sm">
            <p>URL: {import.meta.env.VITE_SUPABASE_URL || '❌ Não definido'}</p>
            <p>Mock Mode: {import.meta.env.VITE_USE_SUPABASE_MOCK === 'true' ? '✅ Ativo' : '❌ Desativo'}</p>
          </div>
        </div>

        {/* useAuth Hook */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">🪝 useAuth()</h2>
          <div className="space-y-3 text-slate-300">
            <div>
              <p className="text-sm text-slate-400">Loading:</p>
              <p className="font-mono text-lg text-blue-300">{loading ? '⏳ true' : '✅ false'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">User:</p>
              {user ? (
                <pre className="bg-slate-950 p-3 rounded text-green-300 text-xs overflow-auto max-h-40">
                  {JSON.stringify({
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                  }, null, 2)}
                </pre>
              ) : (
                <p className="font-mono text-red-300">❌ null</p>
              )}
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-400 mb-4">📋 Session</h2>
          {error && <p className="text-red-400 mb-3">Erro: {error}</p>}
          {session ? (
            <pre className="bg-slate-950 p-3 rounded text-green-300 text-xs overflow-auto max-h-64">
              {JSON.stringify({
                access_token: session.access_token?.substring(0, 50) + '...',
                user: {
                  id: session.user?.id,
                  email: session.user?.email,
                },
                expires_at: new Date(session.expires_at! * 1000).toLocaleString('pt-BR'),
              }, null, 2)}
            </pre>
          ) : (
            <p className="font-mono text-yellow-300">⚠️ Sem sessão ativa</p>
          )}
        </div>

        {/* Test Login */}
        <div className="bg-slate-900 border border-orange-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-orange-400 mb-4">🧪 Teste Rápido</h2>
          <p className="text-slate-400 text-sm mb-4">
            Dados de teste (verifique seu banco Supabase):
          </p>
          <div className="space-y-2 text-slate-300 font-mono text-sm bg-slate-950 p-3 rounded border border-slate-700">
            <p>Email: <span className="text-orange-300">seu_email@exemplo.com</span></p>
            <p>Senha: <span className="text-orange-300">sua_senha_de_teste</span></p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">🛠️ Informações</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✅ Se <strong>user</strong> é <strong>null</strong> e <strong>session</strong> também: login não funcionou.</li>
            <li>✅ Se <strong>user</strong> está preenchido: autenticação OK.</li>
            <li>✅ Verifique o console do navegador (F12) para mais detalhes.</li>
            <li>✅ Verifique as variáveis `.env` do projeto.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
