import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import BasePage from '../../components/BasePage';

type Serie = { nome: string; valor: number };
type SerieHora = { hora: string; percentual: number };

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
          supabase.from('vw_resultados_por_tema').select('nome_tema, percentual'),
          supabase.from('vw_resultados_por_dificuldade').select('dificuldade, percentual'),
          supabase.from('resultados_por_hora').select('hora, percentual'),
        ]);

        if (temasError) throw temasError;
        if (difError) throw difError;
        if (horasError) throw horasError;

        setTemas(agruparMediaPorNome(temasData ?? [], 'nome_tema'));
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

  return (
    <BasePage>
      <div className="space-y-6">
        <h1 className="ds-heading text-center text-blue-400">📊 Estatísticas</h1>
        <div className="glass-card p-4 sm:p-8 space-y-6">
          {loading ? (
            <p className="ds-muted text-center">Carregando estatísticas...</p>
          ) : erro ? (
            <p className="text-center text-red-400" role="alert">
              {erro}
            </p>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-100">Desempenho médio por tema</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={temas}>
                    <XAxis dataKey="nome" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valor" name="Percentual médio" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-100">Desempenho por dificuldade</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={dificuldades} dataKey="valor" nameKey="nome" outerRadius={110}>
                      {dificuldades.map((_, i) => (
                        <Cell key={i} fill={["#22c55e", "#eab308", "#ef4444"][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3 text-gray-100">Percentual de acertos por horário</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={horas}>
                    <XAxis dataKey="hora" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentual" name="Aproveitamento" fill="#6366f1" />
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
