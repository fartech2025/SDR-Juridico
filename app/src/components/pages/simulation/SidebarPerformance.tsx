import React from 'react';

export type SimuladoSidebarData = {
  respondidas: number;
  total: number;
  corretas: number;
  tempoMedio: number;
};

interface Props {
  data: SimuladoSidebarData;
}

export default function SidebarPerformance({ data }: Props) {
  const progresso = data.total > 0 ? (data.respondidas / data.total) * 100 : 0;
  const acuracia = data.respondidas > 0 ? (data.corretas / data.respondidas) * 100 : 0;
  const tempoFormatado = data.tempoMedio > 0 ? `${data.tempoMedio.toFixed(1)} s` : '—';
  const segmentos = 10;
  const segmentosPreenchidos = data.total > 0 ? Math.min(segmentos, Math.round((data.respondidas / data.total) * segmentos)) : 0;

  return (
    <aside className="glass-card p-4 xl:p-5 space-y-5 border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/40">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500">Simulado em tempo real</p>
        <h3 className="text-lg font-semibold text-white">Indicadores do aluno</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-blue-200/80">Respondidas</p>
          <p className="text-2xl font-semibold text-white">{data.respondidas}</p>
          <p className="text-[11px] text-slate-400">de {data.total || '—'}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-emerald-200/80">Corretas</p>
          <p className="text-2xl font-semibold text-white">{data.corretas}</p>
          <p className="text-[11px] text-slate-400">{data.respondidas ? `${acuracia.toFixed(0)}%` : '—'}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-slate-300">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400">Progresso geral</span>
            <span className="text-white font-semibold">{data.respondidas}/{data.total || '—'}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="mt-2 flex gap-1 h-8 items-end">
            {Array.from({ length: segmentos }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  index < segmentosPreenchidos ? 'bg-gradient-to-t from-sky-500 to-sky-300 h-8' : 'bg-white/10 h-4'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400">Taxa de acerto</span>
            <span className="text-green-300 font-semibold">{data.respondidas ? `${acuracia.toFixed(1)}%` : '—'}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-[width] duration-500 ease-out"
              style={{ width: `${acuracia}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-400">Tempo médio por questão</p>
          <p className="text-2xl font-semibold text-white">{tempoFormatado}</p>
        </div>
      </div>
    </aside>
  );
}
