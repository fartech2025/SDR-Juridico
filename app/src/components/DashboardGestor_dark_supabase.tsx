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

        if (!resultadosUsuarios) {
          setDados({
            kpis: { mediaTurma: 0, melhor: 0, pior: 0, tempo: 0 },
            temas: [],
            tendencia: [],
            ranking: [],
          });
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
        (resultadosTemas ?? []).forEach((tema: any) => {
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
        setErro("Erro ao carregar dados agregados. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  return (
    <BasePage>
      {carregando ? (
        <div className="text-center text-gray-300 p-10">Carregando dados do Supabase...</div>
      ) : erro || !dados ? (
        <div className="bg-gray-900 p-8 rounded-3xl shadow-xl w-full max-w-md text-center space-y-4 mx-auto">
          <h1 className="text-2xl font-bold text-red-400">Algo deu errado</h1>
          <p>{erro ?? 'Não foi possível carregar dados da turma.'}</p>
          <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg inline-block">
            Voltar para o início
          </Link>
        </div>
      ) : (
        <div className="w-full px-6 py-8" style={{ paddingTop: '6.5rem' }}>
          {/* Título no canto superior direito */}
          {/* Título absoluto no topo direito, alinhado com ENEM Ultra */}
          <div className="absolute right-8 top-8 z-30 text-right">
            <h1 className="text-3xl font-bold text-blue-400 drop-shadow">Painel do Gestor</h1>
            <p className="text-base text-gray-300 mt-1">Acompanhamento geral da turma</p>
          </div>
          {/* ...conteúdo principal... */}

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPI title="Média da turma" value={`${dados.kpis.mediaTurma}%`} />
            <KPI title="Melhor aluno" value={`${dados.kpis.melhor}%`} />
            <KPI title="Pior aluno" value={`${dados.kpis.pior}%`} />
            <KPI title="Tempo por Questão" value={formatarTempo(dados.kpis.tempo)} />
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
                <XAxis dataKey="periodo" stroke="#9ca3af" />
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
                    <td className="p-2">{r.media_geral.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>
          {/* Botão Voltar no final */}
          <div className="flex justify-end mt-10">
            <Link to="/" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg">Voltar</Link>
          </div>
        </div>
      )}
    </BasePage>
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
    <div className="p-5 mb-6 rounded-2xl border border-gray-800 backdrop-blur-sm bg-slate-900/60">
      <h3 className="font-semibold mb-3">{title}</h3>
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
