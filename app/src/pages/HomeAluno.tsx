import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabaseClient";

type TemaRow = { id_tema: number; percentual: number };
type DifRow = { dificuldade: string; percentual: number };

export default function HomeAluno() {
  const [nome, setNome] = useState<string>("");
  const [progressoGeral, setProgressoGeral] = useState<number>(0);
  const [temas, setTemas] = useState<TemaRow[]>([]);
  const [dificuldade, setDificuldade] = useState<DifRow[]>([]);

  useEffect(() => {
    const carregar = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      setNome(user?.user_metadata?.nome || "Aluno");

      // progresso geral estimado: percentual médio de resultados_usuarios (se existir)
      const { data: res } = await supabase.from("resultados_usuarios").select("percentual_acertos").eq("id_usuario", user?.id).limit(1);
      if (res && res.length > 0 && typeof res[0].percentual_acertos === "number") {
        setProgressoGeral(Math.round(res[0].percentual_acertos));
      }

      const { data: temaData } = await supabase.from("resultados_por_tema").select("id_tema, percentual");
      const { data: difData } = await supabase.from("resultados_por_dificuldade").select("dificuldade, percentual");
      setTemas(temaData || []);
      setDificuldade(difData || []);
    };
    carregar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Olá, {nome}</h1>
            <p className="text-gray-400">Bem-vindo ao seu painel de estudos.</p>
          </div>
          <Link to="/provas" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-xl">
            Ir para Provas
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-gray-300 mb-2">Progresso geral nos simulados</p>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-3 bg-blue-600" style={{ width: String(progressoGeral) + "%" }}></div>
          </div>
          <p className="text-gray-400 text-sm mt-1">{progressoGeral}% concluído</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-blue-400 font-semibold mb-3">Desempenho por Tema</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={temas}>
              <XAxis dataKey="id_tema" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-green-400 font-semibold mb-3">Acertos por Dificuldade</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dificuldade} dataKey="percentual" nameKey="dificuldade" cx="50%" cy="50%" outerRadius={90}>
                {dificuldade.map((_, i) => <Cell key={String(i)} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
