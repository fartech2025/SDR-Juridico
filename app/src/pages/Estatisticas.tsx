import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabaseClient";
import BasePage from '../components/BasePage';

type TemaRow = { id_tema: number; percentual: number };
type DifRow = { dificuldade: string; percentual: number };

export default function Estatisticas() {
  const [temas, setTemas] = useState<TemaRow[]>([]);
  const [dificuldade, setDificuldade] = useState<DifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        // Sempre buscar dados reais do Supabase, modo demo se falhar

        // Buscar dados reais do Supabase
        const { data: temaData, error: temaError } = await supabase
          .from("resultados_por_tema")
          .select("id_tema, percentual")
          .eq('id_usuario', 1);

        const { data: difData, error: difError } = await supabase
          .from("resultados_por_dificuldade")
          .select("dificuldade, percentual")
          .eq('id_usuario', 1);

        if (temaError) throw temaError;
        if (difError) throw difError;

        // Se não houver dados, usar dados demo
        if (!temaData || temaData.length === 0) {
          setTemas([
            { id_tema: 1, percentual: 0 },
            { id_tema: 2, percentual: 0 },
            { id_tema: 3, percentual: 0 }
          ]);
        } else {
          setTemas(temaData);
        }

        if (!difData || difData.length === 0) {
          setDificuldade([
            { dificuldade: 'Fácil', percentual: 0 },
            { dificuldade: 'Médio', percentual: 0 },
            { dificuldade: 'Difícil', percentual: 0 }
          ]);
        } else {
          setDificuldade(difData);
        }

      } catch (e: any) {
        console.error('Erro ao carregar estatísticas:', e);
        setError(e.message);
        // Fallback para dados demo
        setTemas([
          { id_tema: 1, percentual: 85 },
          { id_tema: 2, percentual: 72 },
          { id_tema: 3, percentual: 68 }
        ]);
        setDificuldade([
          { dificuldade: 'Fácil', percentual: 78 },
          { dificuldade: 'Médio', percentual: 65 },
          { dificuldade: 'Difícil', percentual: 42 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  if (loading) {
    return (
      <BasePage maxWidth="max-w-6xl">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-glow">📊</div>
          <h2 className="text-2xl font-bold text-white mb-2">Carregando estatísticas...</h2>
          <p className="text-slate-300">Aguarde enquanto buscamos seus dados de performance.</p>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage maxWidth="max-w-6xl">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            📊 Estatísticas
          </h1>
          <p className="text-slate-300 text-lg">Análise completa do seu desempenho</p>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm glass-card">
            <p className="text-yellow-400 text-center">⚠️ Aviso: {error} (Exibindo dados de demonstração)</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto relative">
        {/* Desempenho por Tema */}
        <div className="glass-card p-8 hover-lift">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              Desempenho por Tema
            </h2>
            <p className="text-slate-300 text-sm">Análise detalhada por área de conhecimento</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={temas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="id_tema" 
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                    color: '#e2e8f0'
                  }}
                />
                <Bar 
                  dataKey="percentual" 
                  fill="url(#blueGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por Dificuldade */}
        <div className="glass-card p-8 hover-lift">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Por Dificuldade
            </h2>
            <p className="text-slate-300 text-sm">Distribuição por nível de complexidade</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie 
                  data={dificuldade} 
                  dataKey="percentual" 
                  nameKey="dificuldade" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={120}
                  innerRadius={40}
                >
                  {dificuldade.map((_, i) => (
                    <Cell 
                      key={String(i)} 
                      fill={i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                    color: '#e2e8f0'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {dificuldade.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  index === 0 ? 'bg-emerald-500' : 
                  index === 1 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <div className="text-white text-sm font-medium">{item.dificuldade}</div>
                <div className="text-slate-300 text-xs">{item.percentual}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
