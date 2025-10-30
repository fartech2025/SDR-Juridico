import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    
    try {
      if (!supabase) {
        setErro("Erro de configuração. Tente novamente.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) setErro("Credenciais inválidas. Verifique seu email e senha.");
      else navigate("/");
    } catch (error) {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl mb-6 shadow-2xl relative">
              <span className="text-3xl">🎓</span>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-30"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
              ENEM Platform
            </h1>
            <p className="text-slate-400 text-lg">Acesse sua conta</p>
          </div>

          {/* Login Form */}
          <div className="glass-card p-8 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300 block">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium text-slate-300 block">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="input-field pl-10 pr-12 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {erro && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    {erro}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-12 relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="loading-spinner" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Entrar</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-slate-700/50"></div>
              <span className="px-4 text-slate-400 text-sm">ou</span>
              <div className="flex-1 border-t border-slate-700/50"></div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-slate-400 mb-4">Não tem uma conta?</p>
              <Link
                to="/cadastro"
                className="btn-secondary w-full h-12 inline-flex items-center justify-center gap-2 group"
              >
                <span>Criar Conta</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              Plataforma ENEM 2024 • Desenvolvido com 💙
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
