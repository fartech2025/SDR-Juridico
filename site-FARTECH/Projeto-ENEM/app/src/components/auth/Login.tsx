import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ensureUsuarioRegistro } from '../../services/supabaseService';
import DevBanner from '../layout/DevBanner';
import type { AuthFormEvent } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (senha: string) => senha.length >= 6;

  const handleLogin = async (e: AuthFormEvent) => {
    e.preventDefault();
    setErro('');

    if (!validateEmail(email)) {
      setErro('Email inválido.');
      return;
    }
    if (!validatePassword(senha)) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setErro(error.message);
      } else {
        if (data?.user) {
          await ensureUsuarioRegistro(data.user);
        }
        // Após login, levar para Home protegida; a landing continua pública em '/'
        navigate('/home');
      }
    } catch (error) {
      console.error('Erro inesperado ao fazer login:', error);
      setErro('Erro inesperado ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <DevBanner />
      <div className="flex-1 flex items-center justify-center p-2 sm:p-10">
        <div className="bg-gray-900 p-4 sm:p-10 rounded-3xl shadow-xl w-full max-w-md transition-all">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-400">🎓 Login ENEM</h1>
          {erro && <p className="text-red-400 mb-4 text-center" role="alert">{erro}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              autoFocus
              aria-label="Email"
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              aria-label="Senha"
            />
            <button 
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 py-3 rounded-lg font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              Entrar
            </button>
          </form>
          <p className="text-center mt-4">
            Não tem conta? 
            <Link to="/cadastro" className="text-blue-400 hover:underline ml-1 focus:ring-2 focus:ring-blue-400 focus:outline-none">
              Cadastre-se
            </Link>
          </p>
          {import.meta.env.VITE_DEV_MODE === 'true' && (
            <div className="mt-6 p-3 bg-blue-900/30 rounded-lg text-sm text-blue-300">
              💡 <strong>Credenciais de teste:</strong><br/>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('frpdias@icloud.com');
                    setSenha('123456');
                  }}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  Preencher credenciais
                </button>
              </div>
              <span className="text-gray-400 text-xs block mt-1">Ou use qualquer email + senha com 6+ caracteres</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
