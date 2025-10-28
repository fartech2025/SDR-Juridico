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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6 text-green-400">Criar Conta</h1>
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="p-3 rounded bg-gray-800 text-gray-100"
            required
          />
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
            className="bg-green-700 hover:bg-green-600 p-3 rounded font-semibold"
          >
            Cadastrar
          </button>
        </form>
        {erro && <p className="text-red-400 mt-3">{erro}</p>}
        <p className="mt-4 text-sm text-gray-400">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
}
