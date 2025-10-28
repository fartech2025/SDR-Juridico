import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) setErro("Credenciais inválidas.");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
      
      <div className="relative glass-card p-10 w-full max-w-md text-center hover-lift">
        {/* Logo Container */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl hover:scale-110 transition-transform duration-300">
            <span className="text-3xl font-bold text-white">📚</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ENEM 2024
          </h1>
          <p className="text-slate-300 text-sm mt-2">Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              required
            />
          </div>
          <button
            type="submit"
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 p-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Entrar</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </form>
        
        {erro && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}
        
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <p className="text-sm text-slate-300">
            Não tem uma conta?{" "}
            <Link 
              to="/cadastro" 
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors duration-200"
            >
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
