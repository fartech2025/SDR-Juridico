import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import BasePage from "../components/BasePage";

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (senha: string) => {
    return senha.length >= 6;
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    // Validações
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setErro("Email inválido.");
      setLoading(false);
      return;
    }
    if (!validatePassword(senha)) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        setErro("Erro de configuração. Tente novamente.");
        return;
      }

      const { error, data } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });
      
      if (error) {
        setErro(error.message);
      } else if (data?.user) {
        await supabase.from("usuarios").upsert({
          id_usuario: data.user.id,
          nome,
          email,
        });
        navigate("/");
      }
    } catch (error) {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BasePage>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 rounded-3xl mb-6 shadow-2xl relative">
          <span className="text-3xl">🎓</span>
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl blur opacity-30"></div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
          Criar Conta
        </h1>
        <p className="text-slate-400 text-lg">Junte-se ao ENEM Platform</p>
      </div>
      {/* Registration Form */}
      <div className="glass-card p-8 backdrop-blur-xl">
        <form onSubmit={handleCadastro} className="space-y-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-slate-300 block">
              <span className="px-2">Nome Completo</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="nome"
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-field pl-14 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 align-middle text-center"
                required
                disabled={loading}
              />
            </div>
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300 block">
              <span className="px-2">Email</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-14 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 align-middle text-center"
                required
                disabled={loading}
              />
            </div>
          </div>
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-medium text-slate-300 block">
              <span className="px-2">Senha</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="Senha (mín. 6)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field pl-14 pr-12 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 align-middle text-center"
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
            <p className="text-xs text-slate-500">Mínimo de 6 caracteres</p>
            {/* Campo de confirmação de senha */}
            <div className="space-y-2">
              <label htmlFor="confirmarSenha" className="text-sm font-medium text-slate-300 block">
                <span className="px-2">Confirmar Senha</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmarSenha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmar senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="input-field pl-14 pr-12 h-12 text-white placeholder-slate-400 bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 align-middle text-center"
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
            className="w-full h-12 relative group disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="loading-spinner border-t-white" />
                <span>Criando conta...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Criar Conta</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
        {/* Login Link */}
        <div className="text-center">
          <p className="text-slate-400 mb-4">Já tem uma conta?</p>
          <Link
            to="/login"
            className="btn-secondary w-full h-12 inline-flex items-center justify-center gap-2 group border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500"
          >
            <span>Fazer Login</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-slate-500 text-sm">
          ENEM Platform 2024 • Desenvolvido com 💚
        </p>
      </div>
    </BasePage>
  );
}
