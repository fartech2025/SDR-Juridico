import React from 'react';
import BasePage from '../components/BasePage';

const KPIS = [
  { label: 'Escolas monitoradas', value: '128', desc: 'Rede municipal completa' },
  { label: 'Índice de conectividade', value: '86%', desc: 'Meta 2025: 92%' },
  { label: 'Escolas críticas', value: '12', desc: 'Com conectividade instável' },
  { label: 'Chamados abertos', value: '24', desc: 'Manutenções pendentes' },
  { label: 'Status infraestrutura', value: '73% adequado', desc: 'Rede + energia + TI' },
];

const CONECTIVIDADE_TOP = [
  { escola: 'Aurora Digital', score: 98 },
  { escola: 'Horizonte Norte', score: 96 },
  { escola: 'Parque das Flores', score: 94 },
];

const CONECTIVIDADE_LOW = [
  { escola: 'Rural Esperança', score: 52 },
  { escola: 'Serra Azul', score: 56 },
];

const ALERTAS = [
  { escola: 'EMEF Aurora', problema: 'Sem internet', prioridade: 'Alta', tempo: '2h15' },
  { escola: 'EMEF Vale Verde', problema: 'Switch queimado', prioridade: 'Alta', tempo: '1 dia' },
  { escola: 'EMEF Horizonte', problema: 'Energia instável', prioridade: 'Média', tempo: '4h' },
];

const COMPARATIVOS = [
  { regiao: 'Norte', adequado: 32, regular: 6, critico: 2 },
  { regiao: 'Sul', adequado: 28, regular: 8, critico: 1 },
  { regiao: 'Leste', adequado: 18, regular: 10, critico: 5 },
  { regiao: 'Oeste', adequado: 15, regular: 12, critico: 6 },
];

export default function SecEducacao() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Secretaria de Educação</p>
            <h1 className="text-3xl font-semibold text-white">Painel Estratégico da Rede Municipal Inteligente</h1>
            <p className="text-slate-400 max-w-3xl mt-2">
              Visão em tempo real da conectividade, infraestrutura e alertas críticos das escolas municipais.
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Última sincronização: <span className="text-blue-300 font-semibold">hoje • 08h15</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-1">
              <p className="text-sm text-slate-400">{kpi.label}</p>
              <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mapa da rede</p>
                <h2 className="text-lg font-semibold text-white">Mapa de calor e status</h2>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">Ver GIS completo</button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-900 h-[340px] flex items-center justify-center text-slate-400 text-sm">
              <p className="text-center px-8">
                Heatmap indicando concentração de escolas por bairro. Pontos coloridos exibem status (verde, amarelo, vermelho) com tooltip detalhado.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Índice geral de conectividade</p>
              <h2 className="text-lg font-semibold text-white">Velocímetro</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 h-48 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-300">87</p>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">pontos</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">Meta: 92% até dezembro de 2025.</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Ranking de conectividade</h3>
              <span className="text-xs text-slate-400">Top e piores</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-300">
              <div>
                <p className="text-white font-semibold mb-2">Melhores</p>
                <ul className="space-y-2">
                  {CONECTIVIDADE_TOP.map((item) => (
                    <li key={item.escola} className="flex justify-between">
                      <span>{item.escola}</span>
                      <span className="text-emerald-300">{item.score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-2">Piores</p>
                <ul className="space-y-2">
                  {CONECTIVIDADE_LOW.map((item) => (
                    <li key={item.escola} className="flex justify-between">
                      <span>{item.escola}</span>
                      <span className="text-amber-300">{item.score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tendência mensal</p>
              <h3 className="text-lg font-semibold text-white">Evolução da conectividade</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] h-48 flex items-center justify-center text-slate-400 text-sm">
              Linha do tempo (placeholder) - últimos 12 meses mostram ganho de +8 pts pós implantação da telemetria.
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Infraestrutura</p>
                <h3 className="text-lg font-semibold text-white">Status por categoria</h3>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">Ver chamados</button>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {['Rede', 'Energia', 'Equipamentos', 'Servidores', 'Wi-Fi'].map((item, idx) => (
                <div key={item}>
                  <p className="text-white font-semibold">{item}</p>
                  <p className="text-xs text-slate-400 mb-1">Adequado / Atenção / Crítico</p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${70 - idx * 5}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${20 + idx * 3}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${10 + idx * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alertas e ocorrências</p>
              <h3 className="text-lg font-semibold text-white">Prioridades do dia</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {ALERTAS.map((alerta) => (
                <div key={alerta.escola} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span>{alerta.escola}</span>
                    <span className={alerta.prioridade === 'Alta' ? 'text-rose-300' : 'text-amber-300'}>{alerta.prioridade}</span>
                  </div>
                  <p className="text-xs text-slate-400">{alerta.problema} • {alerta.tempo}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Comparativos regionais</p>
              <h3 className="text-lg font-semibold text-white">Distribuição por status</h3>
            </div>
            <span className="text-xs text-slate-400">Adequado / Regular / Crítico</span>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 pr-4">Região</th>
                  <th className="pb-2 pr-4">Adequado</th>
                  <th className="pb-2 pr-4">Regular</th>
                  <th className="pb-2">Crítico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {COMPARATIVOS.map((item) => (
                  <tr key={item.regiao}>
                    <td className="py-2 pr-4 text-white font-semibold">{item.regiao}</td>
                    <td className="py-2 pr-4 text-emerald-300">{item.adequado}</td>
                    <td className="py-2 pr-4 text-amber-300">{item.regular}</td>
                    <td className="py-2 text-rose-300">{item.critico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </BasePage>
  );
}
