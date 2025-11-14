import React from 'react';
import BasePage from '../components/BasePage';

const CONECTIVIDADE_KPI = [
  { label: 'Escolas monitoradas', value: '128', icon: '📍', accent: 'from-blue-500 to-cyan-400' },
  { label: '% conectividade adequada', value: '86%', icon: '📶', accent: 'from-emerald-500 to-lime-400' },
  { label: 'Escolas críticas', value: '12', icon: '⚠️', accent: 'from-amber-500 to-orange-400' },
  { label: 'Manutenções pendentes', value: '24', icon: '🔧', accent: 'from-violet-500 to-purple-400' },
];

const CONECTIVIDADE_TOP = [
  { escola: 'Aurora Digital', score: 98 },
  { escola: 'Horizonte Norte', score: 96 },
  { escola: 'Parque das Flores', score: 94 },
  { escola: 'Vale Verde', score: 93 },
  { escola: 'Nova Era', score: 90 },
];

const CONECTIVIDADE_LOW = [
  { escola: 'Rural Esperança', score: 52 },
  { escola: 'Serra Azul', score: 56 },
  { escola: 'Horizonte Rural', score: 58 },
  { escola: 'Campos Gerais', score: 60 },
  { escola: 'Bela Vista', score: 63 },
];

const INFRA_STATUS = [
  { categoria: 'Rede', ok: 84, atencao: 18, critico: 6 },
  { categoria: 'Energia', ok: 112, atencao: 10, critico: 2 },
  { categoria: 'Equipamentos', ok: 92, atencao: 25, critico: 11 },
  { categoria: 'Servidores', ok: 78, atencao: 30, critico: 20 },
  { categoria: 'Wi-Fi', ok: 70, atencao: 35, critico: 23 },
];

const ALERTAS = [
  { escola: 'EMEF Aurora', problema: 'Sem conexão há 2h', prioridade: 'Alta', tempo: '2h15', status: 'urgente' },
  { escola: 'EMEF Vale Verde', problema: 'Switch queimado', prioridade: 'Alta', tempo: '1 dia', status: 'urgente' },
  { escola: 'EMEF Horizonte', problema: 'Energia instável', prioridade: 'Média', tempo: '4h', status: 'atenção' },
  { escola: 'EMEF Nova Era', problema: 'Sem professor no laboratório', prioridade: 'Média', tempo: '2 dias', status: 'atenção' },
];

const COMPARATIVOS = [
  { regiao: 'Norte', adequado: 32, regular: 6, critico: 2 },
  { regiao: 'Sul', adequado: 28, regular: 8, critico: 1 },
  { regiao: 'Leste', adequado: 18, regular: 10, critico: 5 },
  { regiao: 'Oeste', adequado: 15, regular: 12, critico: 6 },
];

export default function RedeInteligente() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2XL:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Painel estratégico</p>
            <h1 className="text-3xl font-semibold text-white">Rede Municipal Inteligente</h1>
            <p className="text-slate-400 max-w-3xl mt-2">
              Monitoramento de conectividade, infraestrutura e alertas críticos por escola, com mapa de calor e KPIs executivos.
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Último refresh:
            <span className="text-blue-300 font-semibold ml-1">hoje • 08h05</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CONECTIVIDADE_KPI.map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 flex items-center gap-3 shadow-lg shadow-slate-950/40">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white bg-gradient-to-r ${kpi.accent}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-sm text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mapa de calor</p>
                <h2 className="text-lg font-semibold text-white">Conectividade por bairro</h2>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">Ver GIS completo</button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-900 h-[360px] flex items-center justify-center text-slate-400 text-sm">
              {/* Placeholder textual - substitua por mapa real (Mapbox/ECharts) */}
              <p className="text-center">
                Áreas mais densas indicam maior concentração de escolas conectadas.<br />
                Pontos em verde = conectividade ideal • amarelo = instável • vermelho = crítico.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Índice geral</p>
              <h2 className="text-lg font-semibold text-white">Conectividade (0-100)</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 h-40 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-300">87</p>
                <p className="text-xs text-slate-400 uppercase tracking-[0.4em]">percentual</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Meta 2025: 92% de conectividade ideal para toda a rede.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Top escolas (conectividade)</h3>
              <span className="text-xs text-slate-400">melhores x piores</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[{ titulo: 'Top 5', lista: CONECTIVIDADE_TOP }, { titulo: 'Piores 5', lista: CONECTIVIDADE_LOW }].map((grupo) => (
                <div key={grupo.titulo} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="text-white font-semibold mb-2">{grupo.titulo}</p>
                  <ul className="space-y-2 text-slate-300">
                    {grupo.lista.map((item) => (
                      <li key={item.escola} className="flex items-center justify-between">
                        <span>{item.escola}</span>
                        <span className={grupo.titulo === 'Top 5' ? 'text-emerald-300' : 'text-amber-300'}>{item.score}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tendência</p>
              <h3 className="text-lg font-semibold text-white">Evolução semanal</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] h-56 flex items-center justify-center text-slate-400 text-sm">
              {/* Placeholder textual */}
              Linha do tempo (últimas 12 semanas) indicando ganho de +6 pontos desde agosto.
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Infraestrutura</p>
                <h3 className="text-lg font-semibold text-white">Status consolidado</h3>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">Ver chamados</button>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {INFRA_STATUS.map((item) => (
                <div key={item.categoria}>
                  <p className="text-white font-semibold mb-1">{item.categoria}</p>
                  <div className="flex gap-2 text-xs text-slate-400">
                    <span>OK {item.ok}</span>
                    <span>• Atenção {item.atencao}</span>
                    <span>• Crítico {item.critico}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-1 flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${item.ok / 1.6}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${item.atencao / 2}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${item.critico / 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alertas inteligentes</p>
              <h3 className="text-lg font-semibold text-white">Prioridades do dia</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {ALERTAS.map((alerta) => (
                <div key={alerta.escola} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between text-white font-semibold">
                    <span>{alerta.escola}</span>
                    <span className={alerta.status === 'urgente' ? 'text-rose-300' : 'text-amber-300'}>{alerta.prioridade}</span>
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
            <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">Ver detalhamento</button>
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
