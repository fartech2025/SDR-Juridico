import { CSSProperties, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import BasePage from '../../components/BasePage';

type Serie = { nome: string; valor: number };
type SerieHora = { hora: string; percentual: number };

const PIE_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#facc15'];
const tooltipStyle: CSSProperties = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '0.8rem',
  padding: '0.75rem 1rem',
};

export default function Estatisticas() {
  const [temas, setTemas] = useState<Serie[]>([]);
  const [dificuldades, setDificuldades] = useState<Serie[]>([]);
  const [horas, setHoras] = useState<SerieHora[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [
          { data: temasData, error: temasError },
          { data: dificuldadesData, error: difError },
          { data: horasData, error: horasError },
        ] = await Promise.all([
          supabase
            .from('resultados_por_tema')
            .select('percentual, id_tema, temas:temas(nome_tema)'),
          supabase
            .from('resultados_por_dificuldade')
            .select('dificuldade, percentual'),
          supabase.from('resultados_por_hora').select('hora, percentual'),
        ]);

        if (temasError) throw temasError;
        if (difError) throw difError;
        if (horasError) throw horasError;

        const temasNormalizados = (temasData ?? []).map((linha: any) => ({
          ...linha,
          nome_tema: linha.temas?.nome_tema ?? 'Tema não informado',
        }));

        setTemas(agruparMediaPorNome(temasNormalizados, 'nome_tema'));
        setDificuldades(agruparMediaPorNome(dificuldadesData ?? [], 'dificuldade'));
        setHoras(agruparMediaPorHora(horasData ?? []));
      } catch (error) {
        console.error('Erro ao carregar estatísticas gerais', error);
        setErro('Não foi possível carregar as estatísticas no momento.');
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const mediaGeralTemas = temas.length
    ? Number((temas.reduce((acc, tema) => acc + tema.valor, 0) / temas.length).toFixed(1))
    : 0;

  const melhorDificuldade =
    dificuldades.length > 0
      ? dificuldades.slice(1).reduce(
          (prev, atual) => (atual.valor > prev.valor ? atual : prev),
          dificuldades[0]!
        )
      : null;

  const melhorHorario =
    horas.length > 0
      ? horas.slice(1).reduce(
          (prev, atual) => (atual.percentual > prev.percentual ? atual : prev),
          horas[0]!
        )
      : null;

  const cardsResumo = [
    {
      titulo: 'Média geral da rede',
      valor: mediaGeralTemas ? `${mediaGeralTemas}%` : '—',
      detalhe: `${temas.length || 0} temas monitorados`,
    },
    {
      titulo: 'Horário de maior rendimento',
      valor: melhorHorario ? melhorHorario.hora : '—',
      detalhe: melhorHorario ? `${melhorHorario.percentual.toFixed(1)}% de acertos` : 'Sem registros recentes',
    },
    {
      titulo: 'Dificuldade com melhor desempenho',
      valor: melhorDificuldade ? melhorDificuldade.nome : '—',
      detalhe: melhorDificuldade ? `${melhorDificuldade.valor.toFixed(1)}% de acerto` : 'Sem registros recentes',
    },
  ];

  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4 md:px-8">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Monitoramento ENEM</p>
          <h1 className="text-3xl font-semibold text-white">Painel estatístico da rede municipal</h1>
          <p className="text-slate-400">Indicadores atualizados dos simulados e avaliações.</p>
        </div>
        {!loading && !erro && (
          <section className="grid gap-4 md:grid-cols-3">
            {cardsResumo.map((card) => (
              <div
                key={card.titulo}
                className="glass-card border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-4 text-left shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{card.titulo}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{card.valor}</p>
                <p className="mt-1 text-sm text-slate-400">{card.detalhe}</p>
              </div>
            ))}
          </section>
        )}
        <div className="space-y-6">
          {loading ? (
            <div className="glass-card p-6 text-center text-slate-400">Carregando estatísticas...</div>
          ) : erro ? (
            <div className="glass-card p-6 text-center text-red-400" role="alert">
              {erro}
            </div>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-4 shadow-xl">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Desempenho médio por tema</h2>
                    <p className="text-sm text-slate-400">Distribuição de acertos por área de conhecimento.</p>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={temas}>
                      <defs>
                        <linearGradient id="temaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
                      <XAxis dataKey="nome" tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(14,165,233,0.08)' }} />
                      <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                      <Bar dataKey="valor" name="Percentual médio" fill="url(#temaGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-4 shadow-xl">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Desempenho por dificuldade</h2>
                    <p className="text-sm text-slate-400">Comparativo entre questões fáceis, médias e difíceis.</p>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={dificuldades} dataKey="valor" nameKey="nome" innerRadius={60} outerRadius={110} paddingAngle={4}>
                        {dificuldades.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="glass-card border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-4 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-white">Percentual de acertos por horário</h2>
                  <p className="text-sm text-slate-400">Mapeamento dos melhores horários de estudo.</p>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={horas}>
                    <defs>
                      <linearGradient id="horarioGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
                    <XAxis dataKey="hora" tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
                    <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                    <Bar dataKey="percentual" name="Aproveitamento" fill="url(#horarioGradient)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </>
          )}
        </div>
      </div>
    </BasePage>
  );
}

function agruparMediaPorNome<T extends Record<string, unknown>>(
  linhas: T[],
  coluna: keyof T
): Serie[] {
  const mapa = new Map<string, number[]>();
  linhas.forEach((linha) => {
    const nome = String(linha[coluna] ?? 'Indefinido');
    const valor = Number((linha as Record<string, unknown>).percentual ?? 0);
    if (!mapa.has(nome)) {
      mapa.set(nome, []);
    }
    mapa.get(nome)?.push(valor);
  });

  return Array.from(mapa.entries()).map(([nome, valores]) => ({
    nome,
    valor: valores.length ? Number((valores.reduce((acc, v) => acc + v, 0) / valores.length).toFixed(2)) : 0,
  }));
}

function agruparMediaPorHora(
  linhas: Array<{ hora: number; percentual: number }>
): SerieHora[] {
  const mapa = new Map<number, number[]>();
  linhas.forEach((linha) => {
    const hora = Number(linha.hora ?? 0);
    const percentual = Number(linha.percentual ?? 0);
    if (!mapa.has(hora)) {
      mapa.set(hora, []);
    }
    mapa.get(hora)?.push(percentual);
  });

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a - b)
    .map(([hora, valores]) => ({
      hora: `${String(hora).padStart(2, '0')}h`,
      percentual: valores.length ? Number((valores.reduce((acc, v) => acc + v, 0) / valores.length).toFixed(2)) : 0,
    }));
}
