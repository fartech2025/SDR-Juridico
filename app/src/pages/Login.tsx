

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import BasePage from "../components/BasePage";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Função de login (pode ser adaptada para autenticação real)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    // Exemplo: login fake, só redireciona
    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 800);
  };

  return (
    <BasePage>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl mb-6 shadow-2xl">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="ds-heading mb-2">Login</h1>
        <p className="ds-subtitle">Acesse sua conta ENEM Platform</p>
      </div>
      {/* Login Form */}
      <div className="glass-card p-8 max-w-md mx-auto">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="ds-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field h-12 text-center"
              required
              disabled={loading}
            />
          </div>
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="senha" className="ds-label">Senha</label>
            <input
              id="senha"
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-field h-12 text-center"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-ghost mt-2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? "Ocultar Senha" : "Mostrar Senha"}
            </button>
          </div>
          {/* Error Message */}
          {erro && (
            <div className="alert-error text-red-500 text-center font-medium">{erro}</div>
          )}
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-12"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="text-center mt-8">
          <p className="ds-muted mb-4">Ainda não tem conta?</p>
          <Link
            to="/cadastro"
            className="btn btn-ghost w-full h-12"
          >
            Criar Conta
          </Link>
        </div>
      </div>
      {/* Footer */}
      <div className="text-center mt-8">
        <p className="ds-muted text-sm">
          ENEM Platform 2024 • Desenvolvido com 💚
        </p>
      </div>
    </BasePage>
  );
}
