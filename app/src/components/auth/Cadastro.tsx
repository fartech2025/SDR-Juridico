import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ensureUsuarioRegistro } from '../../services/supabaseService';
import DevBanner from '../layout/DevBanner';
import type { AuthFormEvent } from '../../types';

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (senha: string) => senha.length >= 6;

  const handleCadastro = async (e: AuthFormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password: senha,
        options: {
          data: {
            nome: nome
          }
        }
      });

      if (error) {
        setErro(error.message);
      } else if (data?.user) {
        await ensureUsuarioRegistro(data.user, nome);
        alert('Cadastro realizado! Você será redirecionado para o login.');
        navigate('/login');
      }
    } catch (error) {
      setErro('Erro inesperado ao cadastrar');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <DevBanner />
      <div className="flex-1 flex items-center justify-center p-2 sm:p-10">
        <div className="bg-gray-900 p-4 sm:p-10 rounded-3xl shadow-xl w-full max-w-md transition-all">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-400">🎓 Cadastro ENEM</h1>
          {erro && <p className="text-red-400 mb-4 text-center" role="alert">{erro}</p>}
          <form onSubmit={handleCadastro} className="space-y-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              autoFocus
              aria-label="Nome completo"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              aria-label="Email"
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              minLength={6}
              aria-label="Senha"
            />
            <button 
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 py-3 rounded-lg font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              Cadastrar
            </button>
          </form>
          <p className="text-center mt-4">
            Já tem conta? 
            <Link to="/login" className="text-blue-400 hover:underline ml-1 focus:ring-2 focus:ring-blue-400 focus:outline-none">
              Fazer login
            </Link>
          </p>
          {import.meta.env.VITE_DEV_MODE === 'true' && (
            <div className="mt-6 p-3 bg-blue-900/30 rounded-lg text-sm text-blue-300">
              💡 <strong>Credenciais de teste:</strong><br/>
              Email: frpdias@icloud.com<br/>
              Senha: 123456<br/>
              <span className="text-gray-400 text-xs">Ou use qualquer email + senha com 6+ caracteres</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
