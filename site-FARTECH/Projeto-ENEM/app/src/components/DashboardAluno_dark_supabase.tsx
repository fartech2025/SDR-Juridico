import { useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import Sidenav from "./Sidenav";
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

// Função para formatar segundos no formato HH:MM:SS
function formatarTempo(segundos: number): string {
  // Validação: se o tempo for maior que 1 hora (3600s), algo está errado nos dados
  // Tempo razoável para uma questão ENEM: 3-5 minutos (180-300s)
  if (segundos > 3600 || segundos < 0 || !isFinite(segundos)) {
    return '00:00:00'; // Retorna zero se dados inválidos
  }
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);
  
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

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

        type TemaResultado = {
          percentual?: number | null;
          temas?: {
            nome_tema?: string | null;
          } | null;
        };

        const temasFormatados: TemaDesempenho[] = (temas ?? []).map((tema: TemaResultado) => ({
          nome_tema: tema.temas?.nome_tema || "Tema não informado",
          percentual: Number(tema.percentual ?? 0),
        }));

        const dificuldadeFormatada: DificuldadeDesempenho[] = agruparPorDificuldade(temasFormatados.length ? temasFormatados : [], dificuldades ?? []);
        const progresso = calcularSerieTemporal(respostas ?? []);

        // Debug: verificar valor do tempo médio
        console.log('DEBUG tempo_medio_resposta_ms:', desempenhoGeral?.tempo_medio_resposta_ms);
        console.log('DEBUG total_questoes:', desempenhoGeral?.total_questoes);

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-950">
      {/* Sidenav - Sempre visível, mas com controle de collapse */}
      <Sidenav isOpen={true} />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 md:mb-6">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 truncate">
                Painel do Estudante
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Bem-vindo, {dados.aluno.nome}
                {dados.aluno.nivel !== undefined ? ` • Nível ${dados.aluno.nivel}` : null}
              </p>
              {dados.aluno.xp_total !== undefined ? (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  XP total: {dados.aluno.xp_total}
                </p>
              ) : null}
            </div>
            <Link 
              to="/" 
              className="bg-blue-700 hover:bg-blue-600 px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm sm:text-base whitespace-nowrap transition-colors flex-shrink-0 w-full sm:w-auto text-center"
            >
              ← Voltar
            </Link>
          </div>

        {/* KPIs - Grid Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <KPI title="Aproveitamento" value={`${dados.aluno.media_geral ?? 0}%`} />
          <KPI title="Questões" value={dados.aluno.provas_respondidas} />
          <KPI title="Tempo por Questão" value={formatarTempo(dados.aluno.tempo_medio_segundos)} />
          <KPI title="Atualização" value={ultimaAtualizacao} />
        </div>

        {/* Gráficos - Grid Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-4 md:mb-6">
          <ChartCard title="Desempenho por Tema">
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.temas}>
                  <XAxis 
                    dataKey="nome_tema" 
                    stroke="#9ca3af" 
                    fontSize={9}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="percentual" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Por Dificuldade">
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dados.dificuldade} 
                    dataKey="percentual" 
                    nameKey="tipo" 
                    outerRadius={70}
                    label={(entry) => `${entry.tipo}: ${entry.percentual}%`}
                  >
                    {dados.dificuldade.map((_, i) => (
                      <Cell key={i} fill={["#22c55e", "#eab308", "#ef4444"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Evolução diária" className="lg:col-span-2 xl:col-span-1">
            <div className="h-[250px] sm:h-[280px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados.progresso}>
                  <XAxis 
                    dataKey="periodo" 
                    stroke="#9ca3af" 
                    fontSize={9}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Line type="monotone" dataKey="percentual" stroke="#a78bfa" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Cards de Insights - Grid Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6 mb-6">
          <InsightCard title="💡 Insights">
            <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm text-gray-300 space-y-1.5 sm:space-y-2">
              <li>Pontos fortes: {pontosFortes.join(', ') || '—'}</li>
              <li>Pontos fracos: {pontosFracos.join(', ') || '—'}</li>
              <li>Sugestão: revisar {pontosFracos[0] || 'temas críticos'}.</li>
            </ul>
          </InsightCard>

          <InsightCard title="🎯 Meta Semanal">
            <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm text-gray-300 space-y-1.5 sm:space-y-2">
              <li>Revisar 2 temas fracos</li>
              <li>Praticar 20 questões</li>
              <li>Refazer 1 simulado completo</li>
            </ul>
          </InsightCard>
        </div>
        </div>
      </div>
    </div>
  );
}

interface KPIProps {
  title: string;
  value: string | number;
}

function KPI({ title, value }: KPIProps) {
  return (
    <div className="bg-gray-900 p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl border border-gray-800 text-center hover:border-gray-700 transition-colors">
      <p className="text-xs sm:text-sm text-gray-400 mb-1 truncate">{title}</p>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-gray-900 p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors ${className}`}>
      <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-gray-100">{title}</h3>
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
    <div className="bg-gray-900 p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
      <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-gray-100 flex items-center gap-2">{title}</h3>
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
