import { useEffect, useState } from "react";
import BasePage from "./BasePage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

type KpisGestor = {
  mediaTurma: number;
  melhor: number;
  pior: number;
  tempo: number;
};

type TemaMedia = {
  nome_tema: string;
  media: number;
};

type TendenciaItem = {
  periodo: string;
  media_percentual: number;
};

type RankingItem = {
  nome: string;
  media_geral: number;
};

const FALLBACK_DADOS = {
  kpis: { mediaTurma: 72.5, melhor: 94.2, pior: 41.3, tempo: 170 },
  temas: [
    { nome_tema: 'Linguagens', media: 74 },
    { nome_tema: 'Matemática', media: 68 },
    { nome_tema: 'Ciências Humanas', media: 79 },
    { nome_tema: 'Ciências da Natureza', media: 71 },
  ],
  tendencia: [
    { periodo: '01/11', media_percentual: 68 },
    { periodo: '04/11', media_percentual: 70 },
    { periodo: '07/11', media_percentual: 73 },
    { periodo: '10/11', media_percentual: 75 },
    { periodo: '13/11', media_percentual: 78 },
  ],
  ranking: [
    { nome: 'Ana Beatriz', media_geral: 94.2 },
    { nome: 'João Pedro', media_geral: 91.8 },
    { nome: 'Camila Rocha', media_geral: 89.4 },
    { nome: 'Luiz Fernando', media_geral: 87.1 },
  ],
};

export default function DashboardGestor_dark() {
  const [dados, setDados] = useState<{
    kpis: KpisGestor;
    temas: TemaMedia[];
    tendencia: TendenciaItem[];
    ranking: RankingItem[];
  } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const [
          { data: resultadosUsuarios },
          { data: resultadosTemas },
          { data: usuarios },
          { data: respostas },
        ] = await Promise.all([
          supabase
            .from("resultados_usuarios")
            .select("id_usuario, total_questoes, total_acertos, percentual_acertos, tempo_medio_resposta_ms"),
          supabase
            .from("resultados_por_tema")
            .select("id_usuario, id_tema, percentual, temas:temas(nome_tema)"),
          supabase.from("usuarios").select("id_usuario, nome, email"),
          supabase
            .from("respostas_usuarios")
            .select("correta, data_resposta")
            .order("data_resposta", { ascending: true }),
        ]);

        if (!resultadosUsuarios || resultadosUsuarios.length === 0) {
          setDados(FALLBACK_DADOS);
          setCarregando(false);
          return;
        }

        const percentualList = resultadosUsuarios.map((r) => Number(r.percentual_acertos ?? 0));
        const tempoList = resultadosUsuarios
          .map((r) => r.tempo_medio_resposta_ms)
          .filter((v): v is number => typeof v === "number");

        const mediaTurma =
          percentualList.length > 0
            ? percentualList.reduce((acc, pct) => acc + pct, 0) / percentualList.length
            : 0;
        const melhor = percentualList.length ? Math.max(...percentualList) : 0;
        const pior = percentualList.length ? Math.min(...percentualList) : 0;
        const tempo =
          tempoList.length > 0
            ? tempoList.reduce((acc, val) => acc + val, 0) / tempoList.length / 1000
            : 0;

        const temasMap = new Map<string, number[]>();
        type ResultadoTema = {
          percentual?: number | null;
          temas?: { nome_tema?: string | null } | null;
        };

        (resultadosTemas ?? []).forEach((tema: ResultadoTema) => {
          const nomeTema = tema.temas?.nome_tema || "Tema não informado";
          if (!temasMap.has(nomeTema)) {
            temasMap.set(nomeTema, []);
          }
          temasMap.get(nomeTema)?.push(Number(tema.percentual ?? 0));
        });
        const temas: TemaMedia[] = Array.from(temasMap.entries()).map(([nome_tema, valores]) => ({
          nome_tema,
          media: Number((valores.reduce((acc, val) => acc + val, 0) / valores.length).toFixed(2)),
        }));

        const tendencia = calcularTendencia(respostas ?? []);

        const ranking: RankingItem[] = resultadosUsuarios
          .map((res) => {
            const usuario = usuarios?.find((u) => u.id_usuario === res.id_usuario);
            return {
              nome: usuario?.nome || usuario?.email || `Usuário #${res.id_usuario}`,
              media_geral: Number(res.percentual_acertos ?? 0),
            };
          })
          .sort((a, b) => b.media_geral - a.media_geral)
          .slice(0, 10);

        setDados({
          kpis: {
            mediaTurma: Number(mediaTurma.toFixed(2)),
            melhor: Number(melhor.toFixed(2)),
            pior: Number(pior.toFixed(2)),
            tempo: Number(tempo.toFixed(1)),
          },
          temas,
          tendencia,
          ranking,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do painel do gestor", error);
        setDados(FALLBACK_DADOS);
        setErro(null);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  return (
    <BasePage fullWidth contentClassName="py-10">
      {carregando ? (
        <div className="text-center text-gray-300 p-10">Carregando dados do Supabase...</div>
      ) : (
        <>
        {erro && (
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Não foi possível sincronizar com o banco agora. Exibindo dados de referência.
          </div>
        )}
        <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
          <header className="glass-card p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Painel do Gestor</p>
              <h1 className="text-3xl font-semibold text-white mt-1">Inteligência operacional da rede</h1>
              <p className="text-slate-400 text-sm max-w-2xl mt-2">
                KPIs consolidados, tendência semanal e ranking em tempo real para orientar decisões da secretaria municipal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                🔄 Atualizado há 5 min
              </span>
              <Link to="/central-operacional" className="btn-primary px-5 h-11 flex items-center gap-2">
                📡 Ver Central Operacional
              </Link>
            </div>
          </header>

          {/* KPIs */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Média da rede', value: `${dados.kpis.mediaTurma}%`, subtitle: 'vs. semana anterior', icon: '📊', accent: 'from-sky-500 to-blue-500' },
              { title: 'Melhor desempenho', value: `${dados.kpis.melhor}%`, subtitle: 'aluno destaque', icon: '🏅', accent: 'from-emerald-500 to-green-400' },
              { title: 'Maior desafio', value: `${dados.kpis.pior}%`, subtitle: 'pior média registrada', icon: '⚠️', accent: 'from-amber-500 to-orange-400' },
              { title: 'Tempo médio/questão', value: formatarTempo(dados.kpis.tempo), subtitle: 'média consolidada', icon: '⏱️', accent: 'from-purple-500 to-pink-500' },
            ].map((kpi) => (
              <KPI
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                icon={kpi.icon}
                accent={kpi.accent}
              />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Média por tema" subtitle="Distribuição das últimas avaliações">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.temas}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="nome_tema" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }} />
                  <Bar dataKey="media" fill="url(#barGradient)" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tendência semanal" subtitle="Percentual médio de acertos">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dados.tendencia}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="periodo" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="media_percentual" stroke="url(#lineGradient)" strokeWidth={3} dot={{ stroke: '#c084fc', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ChartCard title="Ranking de alunos" subtitle="Top 10 da rede">
              <div className="overflow-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="text-xs uppercase text-slate-500 tracking-wide">
                      <th className="pb-2">Aluno</th>
                      <th className="pb-2 text-right">Média</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dados.ranking.map((r, i) => (
                      <tr key={i} className="hover:bg-white/5 transition">
                        <td className="py-2">
                          <span className="text-slate-400 mr-2">{i + 1}º</span>
                          <span className="text-white font-medium">{r.nome}</span>
                        </td>
                        <td className="py-2 text-right font-semibold text-blue-300">{r.media_geral.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Insights acionáveis</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  Temas com média &lt; 60%: priorizar reforço antes do próximo simulado.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  Tempo médio em 02:45 — dentro da meta (até 03:00 por questão).
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  4 alunos abaixo de 50%: recomendar plano de estudo personalizado.
                </li>
              </ul>
              <Link to="/" className="btn-secondary w-full text-center">
                ↩️ Sair
              </Link>
            </div>
          </section>
        </div>
        </>
      )}
    </BasePage>
  );
}

interface KPIProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accent?: string;
}

function KPI({ title, value, subtitle, icon, accent }: KPIProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-3 shadow-lg shadow-slate-950/40">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent ?? 'from-blue-500 to-cyan-400'} text-white text-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="p-5 rounded-3xl border border-white/10 backdrop-blur-xl bg-white/[0.03] shadow-[0_25px_80px_rgba(2,6,23,0.6)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{subtitle}</p>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function calcularTendencia(
  respostas: Array<{ correta: boolean; data_resposta: string }>
): TendenciaItem[] {
  if (!respostas.length) return [];

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
      media_percentual: valores.total ? Number(((valores.acertos / valores.total) * 100).toFixed(2)) : 0,
    }));
}
