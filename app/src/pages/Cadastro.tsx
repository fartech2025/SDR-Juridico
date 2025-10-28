import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const { error, data } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    if (error) setErro(error.message);
    else {
      await supabase.from("usuarios").upsert({
        id_usuario: data?.user?.id,
        nome,
        email,
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-blue-500/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
      
      <div className="relative glass-card p-10 w-full max-w-md text-center hover-lift">
        {/* Logo Container */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-2xl hover:scale-110 transition-transform duration-300">
            <span className="text-3xl font-bold text-white">🎓</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
            Criar Conta
          </h1>
          <p className="text-slate-300 text-sm mt-2">Junte-se ao ENEM 2024</p>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
              required
            />
          </div>
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
              required
            />
          </div>
          <button
            type="submit"
            className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 p-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Cadastrar</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </form>
        
        {erro && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}
        
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <p className="text-sm text-slate-300">
            Já tem uma conta?{" "}
            <Link 
              to="/login" 
              className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors duration-200"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
