import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Link } from "react-router-dom";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardAluno_dark() {
  const [dados, setDados] = useState({ aluno: {}, temas: [], dificuldade: [], semanal: [] });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: desempenho } = await supabase
        .from("desempenho_aluno")
        .select("*")
        .eq("id_usuario", user.id)
        .single();

      const { data: temas } = await supabase
        .from("desempenho_tema_dificuldade")
        .select("nome_tema, dificuldade, percentual")
        .eq("id_usuario", user.id);

      const { data: semanal } = await supabase
        .from("resultados_semanais")
        .select("semana, percentual")
        .eq("id_usuario", user.id)
        .order("semana");

      setDados({
        aluno: desempenho || {},
        temas: temas || [],
        dificuldade: agruparPorDificuldade(temas || []),
        semanal: semanal || [],
      });

      setCarregando(false);
    };

    carregarDados();
  }, []);

  const agruparPorDificuldade = (temas) => {
    const mapa = {};
    temas.forEach((t) => {
      if (!mapa[t.dificuldade]) mapa[t.dificuldade] = [];
      mapa[t.dificuldade].push(t.percentual);
    });
    return Object.entries(mapa).map(([tipo, vals]) => ({
      tipo,
      percentual: vals.reduce((a, b) => a + b, 0) / vals.length,
    }));
  };

  const pontosFortes = useMemo(() => dados.temas?.filter(t => t.percentual > 70).map(t => t.nome_tema), [dados]);
  const pontosFracos = useMemo(() => dados.temas?.filter(t => t.percentual < 50).map(t => t.nome_tema), [dados]);

  if (carregando) return <div className="text-center text-gray-300 p-10">Carregando dados do Supabase...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Painel do Estudante</h1>
            <p className="text-sm text-gray-400">Bem-vindo, {dados.aluno?.nome || "Aluno"}</p>
          </div>
          <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg">Voltar</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI title="Aproveitamento" value={(dados.aluno?.media_geral || 0) + '%'} />
          <KPI title="Provas Realizadas" value={dados.aluno?.provas_realizadas || 0} />
          <KPI title="Tempo Médio" value={(dados.aluno?.tempo_medio || 0).toFixed(1) + 's'} />
          <KPI title="Última Prova" value={dados.aluno?.ultima_prova?.split('T')[0] || '-'} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Desempenho por Tema">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dados.temas}>
                <XAxis dataKey="nome_tema" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="percentual" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por Dificuldade">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={dados.dificuldade} dataKey="percentual" nameKey="tipo" outerRadius={90}>
                  {dados.dificuldade.map((_, i) => (
                    <Cell key={i} fill={["#22c55e", "#eab308", "#ef4444"][i % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Evolução Semanal">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dados.semanal}>
                <XAxis dataKey="semana" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="percentual" stroke="#a78bfa" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InsightCard title="💡 Insights">
            <ul className="list-disc pl-4 text-sm text-gray-300 space-y-1">
              <li>Pontos fortes: {pontosFortes.join(', ') || '—'}</li>
              <li>Pontos fracos: {pontosFracos.join(', ') || '—'}</li>
              <li>Sugestão: revisar {pontosFracos[0] || 'temas críticos'}.</li>
            </ul>
          </InsightCard>

          <InsightCard title="🎯 Meta Semanal">
            <ul className="list-disc pl-4 text-sm text-gray-300 space-y-1">
              <li>Revisar 2 temas fracos</li>
              <li>Praticar 20 questões</li>
              <li>Refazer 1 simulado completo</li>
            </ul>
          </InsightCard>
        </div>
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
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InsightCard({ title, children }) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}