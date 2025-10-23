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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-gray-800 text-gray-100"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="p-3 rounded bg-gray-800 text-gray-100"
            required
          />
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-600 p-3 rounded font-semibold"
          >
            Entrar
          </button>
        </form>
        {erro && <p className="text-red-400 mt-3">{erro}</p>}
        <p className="mt-4 text-sm text-gray-400">
          Não tem uma conta?{" "}
          <Link to="/cadastro" className="text-blue-400 hover:underline">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}
