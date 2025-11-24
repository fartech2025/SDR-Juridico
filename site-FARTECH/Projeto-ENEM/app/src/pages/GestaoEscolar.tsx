import React from 'react';
import BasePage from '../components/BasePage';

const VISÕES = [
  { title: 'Infraestrutura', value: '92%', desc: 'Unidades com conectividade e manutenção em dia' },
  { title: 'Cobertura pedagógica', value: '84%', desc: 'Professores com plano de aula atualizado' },
  { title: 'Telemetria ativa', value: '132 escolas', desc: 'Monitoramento em tempo real' },
];

const AUDITORIAS = [
  { label: 'Transporte escolar', status: 'Concluída', nota: 'A' },
  { label: 'Merenda e estoques', status: 'Em andamento', nota: 'B+' },
  { label: 'Segurança e acesso', status: 'Planejada', nota: '—' },
];

export default function GestaoEscolar() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Gestão Escolar</p>
              <h1 className="text-3xl font-semibold text-white">Visão integrada das unidades municipais</h1>
              <p className="text-slate-400 max-w-3xl mt-2">
                Consolide indicadores operacionais por escola, acompanhe auditorias e mantenha a rede alinhada às metas da
                Secretaria.
              </p>
            </div>
            <div className="text-sm text-slate-400">
              Última auditoria geral:
              <span className="text-blue-300 font-semibold ml-1">10/11 • 15h40</span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status das escolas</p>
                <h2 className="text-lg font-semibold text-white">Saúde operacional</h2>
              </div>
              <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-blue-400/50">
                Exportar relatório
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {VISÕES.map((visao) => (
                <div key={visao.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{visao.title}</p>
                  <p className="text-2xl font-semibold text-white">{visao.value}</p>
                  <p className="text-xs text-slate-400">{visao.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Capacidade e lotação</p>
              <div className="space-y-3 text-sm text-slate-300">
                {[
                  { label: 'Salas com telemetria', value: '78%', color: 'bg-sky-400' },
                  { label: 'Laboratórios operacionais', value: '64%', color: 'bg-emerald-400' },
                  { label: 'Bibliotecas abertas', value: '91%', color: 'bg-purple-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: item.value }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="glass-card p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Auditorias</p>
              <h2 className="text-lg font-semibold text-white">Compliance municipal</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {AUDITORIAS.map((auditoria) => (
                <div key={auditoria.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{auditoria.label}</p>
                    <p className="text-xs text-slate-400">{auditoria.status}</p>
                  </div>
                  <span className="text-lg font-semibold text-blue-300">{auditoria.nota}</span>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 space-y-3">
              <p className="text-white font-semibold">Checklist rápido</p>
              <ul className="space-y-2 text-xs">
                <li>• Inventário de laboratório atualizado</li>
                <li>• Contrato de internet válido para 2025</li>
                <li>• Plano de continuidade aprovado</li>
              </ul>
              <button className="rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 opacity-60 cursor-not-allowed">
                Registrar atualização
              </button>
            </div>
          </aside>
        </section>
      </div>
    </BasePage>
  );
}
