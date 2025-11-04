import { useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import SimuladosSidebar from "./SimuladosSidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ensureUsuarioRegistro } from "../services/supabaseService";

type TemaDesempenho = {
  nome_tema: string;
  percentual: number;
};

type DificuldadeDesempenho = {
  tipo: string;
  percentual: number;
};

type SerieProgresso = {
  periodo: string;
  percentual: number;
};

type PainelAluno = {
  nome: string;
  media_geral: number;
  provas_respondidas: number;
  tempo_medio_segundos: number;
  ultima_atualizacao?: string | null;
  nivel?: number;
  xp_total?: number;
  streak_dias?: number;
};

export default function DashboardAluno_dark() {
  const [dados, setDados] = useState<{
    aluno: PainelAluno;
    temas: TemaDesempenho[];
    dificuldade: DificuldadeDesempenho[];
    progresso: SerieProgresso[];
  } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          setErro("Não foi possível identificar o usuário autenticado.");
          setCarregando(false);
          return;
        }

        const perfil = await ensureUsuarioRegistro(user);

        const [{ data: desempenhoGeral }, { data: temas }, { data: dificuldades }, { data: respostas }] =
          await Promise.all([
            supabase
              .from("resultados_usuarios")
              .select("total_questoes, total_acertos, percentual_acertos, tempo_medio_resposta_ms, data_ultima_atualizacao")
              .eq("id_usuario", perfil.id_usuario)
              .maybeSingle(),
            supabase
              .from("resultados_por_tema")
              .select("percentual, id_tema, temas:temas(nome_tema)")
              .eq("id_usuario", perfil.id_usuario),
            supabase
              .from("resultados_por_dificuldade")
              .select("dificuldade, percentual")
              .eq("id_usuario", perfil.id_usuario),
            supabase
              .from("respostas_usuarios")
              .select("correta, data_resposta")
              .eq("id_usuario", perfil.id_usuario)
              .order("data_resposta", { ascending: true }),
          ]);

        const temasFormatados: TemaDesempenho[] = (temas ?? []).map((t: any) => ({
          nome_tema: t.temas?.nome_tema || "Tema não informado",
          percentual: Number(t.percentual ?? 0),
        }));

        const dificuldadeFormatada: DificuldadeDesempenho[] = agruparPorDificuldade(temasFormatados.length ? temasFormatados : [], dificuldades ?? []);
        const progresso = calcularSerieTemporal(respostas ?? []);

        setDados({
          aluno: {
            nome: perfil.nome ?? perfil.email,
            media_geral: Number(desempenhoGeral?.percentual_acertos ?? 0),
            provas_respondidas: Number(desempenhoGeral?.total_questoes ?? 0),
            tempo_medio_segundos: desempenhoGeral?.tempo_medio_resposta_ms
              ? Number((desempenhoGeral.tempo_medio_resposta_ms / 1000).toFixed(1))
              : 0,
            ultima_atualizacao: desempenhoGeral?.data_ultima_atualizacao ?? null,
            nivel: perfil.nivel ?? undefined,
            xp_total: perfil.xp_total ?? undefined,
            streak_dias: perfil.streak_dias ?? undefined,
          },
          temas: temasFormatados,
          dificuldade: dificuldadeFormatada,
          progresso,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do painel do aluno", error);
        setErro("Erro ao carregar dados do painel. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  // ✅ TODOS os hooks SEMPRE são chamados - ANTES de qualquer condicional
  const pontosFortes = useMemo(
    () => dados?.temas.filter((t) => t.percentual > 70).map((t) => t.nome_tema) ?? [],
    [dados?.temas]
  );
  const pontosFracos = useMemo(
    () => dados?.temas.filter((t) => t.percentual < 50).map((t) => t.nome_tema) ?? [],
    [dados?.temas]
  );

  // ✅ AGORA os early returns - DEPOIS de todos os hooks
  if (carregando) {
    return (
      <BasePage>
        <div className="text-center text-gray-300 p-10">Carregando dados do Supabase...</div>
      </BasePage>
    );
  }

  if (erro || !dados) {
    return (
      <BasePage>
        <div className="bg-gray-900 p-8 rounded-3xl shadow-xl w-full max-w-md text-center space-y-4 mx-auto">
          <h1 className="text-2xl font-bold text-red-400">Ops!</h1>
          <p>{erro ?? 'Não foi possível carregar o painel do aluno.'}</p>
          <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg inline-block">
            Voltar para o início
          </Link>
        </div>
      </BasePage>
    );
  }

  const ultimaAtualizacao = dados.aluno.ultima_atualizacao
    ? new Date(dados.aluno.ultima_atualizacao).toLocaleDateString('pt-BR')
    : '-';

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar de Simulados */}
      <SimuladosSidebar isOpen={true} />

      {/* Conteúdo Principal */}
      <BasePage className="flex-1">
        <div className="w-full px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-400">Painel do Estudante</h1>
              <p className="text-sm text-gray-400">
                Bem-vindo, {dados.aluno.nome}
                {dados.aluno.nivel !== undefined ? ` • Nível ${dados.aluno.nivel}` : null}
              </p>
              {dados.aluno.xp_total !== undefined ? (
                <p className="text-xs text-gray-500">XP total: {dados.aluno.xp_total}</p>
              ) : null}
            </div>
            <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg">Voltar</Link>
          </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI title="Aproveitamento" value={`${dados.aluno.media_geral ?? 0}%`} />
          <KPI title="Questões Respondidas" value={dados.aluno.provas_respondidas} />
          <KPI title="Tempo Médio" value={`${dados.aluno.tempo_medio_segundos}s`} />
          <KPI title="Última atualização" value={ultimaAtualizacao} />
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

          <ChartCard title="Evolução diária">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dados.progresso}>
                <XAxis dataKey="periodo" stroke="#9ca3af" />
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
    </BasePage>
    </div>
  );
}

interface KPIProps {
  title: string;
  value: string | number;
}

function KPI({ title, value }: KPIProps) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

interface InsightCardProps {
  title: string;
  children: React.ReactNode;
}

function InsightCard({ title, children }: InsightCardProps) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function agruparPorDificuldade(
  temas: TemaDesempenho[],
  dificuldadesRaw: Array<{ dificuldade: string; percentual: number }>
): DificuldadeDesempenho[] {
  if (dificuldadesRaw.length) {
    return dificuldadesRaw.map((d) => ({
      tipo: d.dificuldade,
      percentual: Number(d.percentual ?? 0),
    }));
  }

  const mapa = new Map<string, number[]>();
  temas.forEach((tema) => {
    const chave = tema.nome_tema.includes('Fácil')
      ? 'Fácil'
      : tema.nome_tema.includes('Médio')
      ? 'Médio'
      : tema.nome_tema.includes('Difícil')
      ? 'Difícil'
      : 'Não classificado';
    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }
    mapa.get(chave)?.push(tema.percentual);
  });

  return Array.from(mapa.entries()).map(([tipo, valores]) => ({
    tipo,
    percentual: Number((valores.reduce((acc, val) => acc + val, 0) / valores.length).toFixed(2)),
  }));
}

function calcularSerieTemporal(
  respostas: Array<{ correta: boolean; data_resposta: string }>
): SerieProgresso[] {
  if (!respostas.length) {
    return [];
  }

  const agrupado = new Map<string, { total: number; acertos: number }>();
  respostas.forEach((resposta) => {
    const dia = resposta.data_resposta ? resposta.data_resposta.slice(0, 10) : '';
    if (!dia) return;
    if (!agrupado.has(dia)) {
      agrupado.set(dia, { total: 0, acertos: 0 });
    }
    const atual = agrupado.get(dia)!;
    atual.total += 1;
    if (resposta.correta) {
      atual.acertos += 1;
    }
  });

  return Array.from(agrupado.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, valores]) => ({
      periodo: new Date(dia).toLocaleDateString('pt-BR'),
      percentual: valores.total ? Number(((valores.acertos / valores.total) * 100).toFixed(2)) : 0,
    }));
}
