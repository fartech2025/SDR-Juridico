import React from 'react';
import type { SimuladoSidebarData } from './SidebarPerformance';

interface Props {
  data: SimuladoSidebarData;
}

export default function SidebarInsights({ data }: Props) {
  const tempoMedio = data.tempoMedio > 0 ? `${data.tempoMedio.toFixed(1)}s` : '—';
  const faltantes = Math.max(data.total - data.respondidas, 0);
  const progresso = data.total > 0 ? data.respondidas / data.total : 0;
  const raio = 34;
  const circunferencia = 2 * Math.PI * raio;
  const dashOffset = circunferencia * (1 - Math.min(progresso, 1));

  const distribuicao = [
    { label: 'Corretas', value: data.corretas, color: 'bg-emerald-400' },
    { label: 'Em revisão', value: Math.max(data.respondidas - data.corretas, 0), color: 'bg-amber-400' },
    { label: 'Pendentes', value: faltantes, color: 'bg-slate-500' },
  ].filter((item) => item.value > 0);

  return (
    <aside className="glass-card p-4 xl:p-5 space-y-5 border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Painel auxiliar</p>
        <h3 className="text-base font-semibold text-white">Insights do simulado</h3>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 py-5">
        <div className="relative">
          <svg width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r={raio}
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={raio}
              stroke="url(#sidebarProgressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={dashOffset}
              fill="transparent"
              transform="rotate(-90 50 50)"
            />
            <defs>
              <linearGradient id="sidebarProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Progresso</span>
            <span className="text-2xl font-semibold text-white">{Math.round(progresso * 100)}%</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">{data.respondidas} de {data.total || '—'} questões</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Tempo médio</p>
            <p className="text-2xl font-semibold text-white">{tempoMedio}</p>
          </div>
          <div className="rounded-full bg-emerald-500/10 border border-emerald-400/30 px-4 py-1 text-xs text-emerald-200">
            ritmo ideal
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Atualizado em tempo real conforme o aluno confirma cada questão.
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Pendências</p>
            <p className="text-xl font-semibold text-white">{faltantes}</p>
          </div>
          <p className="text-xs text-slate-400">restantes de {data.total || '—'}</p>
        </div>
        <div className="flex flex-col gap-2">
          {distribuicao.length ? (
            distribuicao.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-slate-300">
                <span className={`inline-flex h-2 w-2 rounded-full ${item.color}`} />
                <span className="flex-1">{item.label}</span>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Ainda não há dados para exibir.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
