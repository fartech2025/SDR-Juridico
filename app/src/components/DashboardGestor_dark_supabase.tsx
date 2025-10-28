import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Link } from "react-router-dom";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardGestor_dark() {
  const [dados, setDados] = useState({ kpis: {}, temas: [], tendencia: [], ranking: [] });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);

      // Dados gerais da turma
      const { data: geral } = await supabase.from("desempenho_geral_turma").select("*").single();

      // Médias por tema
      const { data: temas } = await supabase.rpc("media_por_tema");

      // Tendência semanal
      const { data: tendencia } = await supabase.rpc("tendencia_semana_turma");

      // Ranking de alunos
      const { data: ranking } = await supabase.from("desempenho_aluno").select("nome, media_geral").order("media_geral", { ascending: false });

      setDados({
        kpis: {
          mediaTurma: geral?.media_turma || 0,
          melhor: geral?.melhor_desempenho || 0,
          pior: geral?.pior_desempenho || 0,
          tempo: geral?.tempo_medio_turma || 0,
        },
        temas: temas || [],
        tendencia: tendencia || [],
        ranking: ranking || [],
      });

      setCarregando(false);
    };

    carregarDados();
  }, []);

  if (carregando) return <div className="text-center text-gray-300 p-10">Carregando dados do Supabase...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Painel do Gestor</h1>
            <p className="text-sm text-gray-400">Acompanhamento geral da turma</p>
          </div>
          <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg">Voltar</Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI title="Média da turma" value={dados.kpis.mediaTurma.toFixed(2) + '%'} />
          <KPI title="Melhor aluno" value={dados.kpis.melhor.toFixed(2) + '%'} />
          <KPI title="Pior aluno" value={dados.kpis.pior.toFixed(2) + '%'} />
          <KPI title="Tempo médio" value={dados.kpis.tempo.toFixed(1) + 's'} />
        </div>

        {/* Média por tema */}
        <ChartCard title="Média por Tema">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dados.temas}>
              <XAxis dataKey="nome_tema" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="media" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tendência semanal */}
        <ChartCard title="Tendência Semanal da Turma">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dados.tendencia}>
              <XAxis dataKey="semana" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="media_percentual" stroke="#a78bfa" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ranking de alunos */}
        <ChartCard title="Ranking de Alunos">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="p-2">Aluno</th>
                <th className="p-2">Média</th>
              </tr>
            </thead>
            <tbody>
              {dados.ranking.map((r, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="p-2">{r.nome}</td>
                  <td className="p-2">{r.media_geral?.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-gray-900 p-5 mb-6 rounded-2xl border border-gray-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}