import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabaseClient";

type TemaRow = { id_tema: number; percentual: number };
type DifRow = { dificuldade: string; percentual: number };

export default function Estatisticas() {
  const [temas, setTemas] = useState<TemaRow[]>([]);
  const [dificuldade, setDificuldade] = useState<DifRow[]>([]);

  useEffect(() => {
    const carregar = async () => {
      const { data: temaData } = await supabase.from("resultados_por_tema").select("id_tema, percentual");
      const { data: difData } = await supabase.from("resultados_por_dificuldade").select("dificuldade, percentual");
      setTemas(temaData || []);
      setDificuldade(difData || []);
    };
    carregar();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
        <h2 className="text-lg mb-3 text-blue-400 font-semibold">Desempenho por Tema</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={temas}>
            <XAxis dataKey="id_tema" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percentual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
        <h2 className="text-lg mb-3 text-green-400 font-semibold">Por Dificuldade</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={dificuldade} dataKey="percentual" nameKey="dificuldade" cx="50%" cy="50%" outerRadius={100}>
              {dificuldade.map((_, i) => (
                <Cell key={String(i)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
