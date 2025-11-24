import React from 'react';
import BasePage from '../components/BasePage';

const FREQUENCIA_BAIRRO = [
  { bairro: 'Aurora', frequencia: 95, meta: 92 },
  { bairro: 'Horizonte', frequencia: 88, meta: 90 },
  { bairro: 'Vale Verde', frequencia: 91, meta: 90 },
  { bairro: 'Centro Histórico', frequencia: 85, meta: 92 },
];

const INTEGRACOES = [
  { titulo: 'SIGEduc', descricao: 'Sincronizado às 06:30', status: 'ok' },
  { titulo: 'SGP - Portal do Professor', descricao: 'Atualização parcial', status: 'atenção' },
  { titulo: 'Merenda & Estoques', descricao: 'Integração agendada 14h', status: 'ok' },
];

const ALERTAS_EVASAO = [
  { escola: 'EMEF Horizonte', alunos: 8, tendencia: '+2 semana', status: 'alto' },
  { escola: 'EMEF Nova Era', alunos: 5, tendencia: '+0', status: 'médio' },
  { escola: 'EMEF Vale Verde', alunos: 2, tendencia: '-1', status: 'baixo' },
];

export default function PainelEstrategico() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Painel estratégico</p>
            <h1 className="text-3xl font-semibold text-white">Secretaria Municipal de Educação</h1>
            <p className="text-slate-400 max-w-3xl mt-2">
              Visão consolidada dos indicadores críticos: frequência por bairro, integrações com sistemas satélite e alertas de evasão.
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Última sincronização:
            <span className="text-blue-300 font-semibold ml-1">hoje • 07h20</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Frequência</p>
                <h2 className="text-lg font-semibold text-white">Indicadores por bairro</h2>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white hover:border-blue-400/40">Exportar</button>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {FREQUENCIA_BAIRRO.map((linha) => (
                <div key={linha.bairro} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{linha.bairro}</p>
                      <p className="text-xs text-slate-400">Meta {linha.meta}%</p>
                    </div>
                    <span className="text-lg font-semibold text-blue-300">{linha.frequencia}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400" style={{ width: `${linha.frequencia}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Integrações SIGEduc + SGP</p>
              <h3 className="text-lg font-semibold text-white">Status de sincronização</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {INTEGRACOES.map((item) => (
                <div key={item.titulo} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{item.titulo}</p>
                    <p className="text-xs text-slate-400">{item.descricao}</p>
                  </div>
                  <span className={item.status === 'atenção' ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alertas críticos</p>
              <h2 className="text-lg font-semibold text-white">Evasão monitorada</h2>
            </div>
            <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white hover:border-rose-400/40">Plano de ação</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 pr-4">Escola</th>
                  <th className="pb-2 pr-4">Alunos em risco</th>
                  <th className="pb-2 pr-4">Tendência</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {ALERTAS_EVASAO.map((alerta) => (
                  <tr key={alerta.escola}>
                    <td className="py-2 pr-4 text-white font-semibold">{alerta.escola}</td>
                    <td className="py-2 pr-4">{alerta.alunos}</td>
                    <td className="py-2 pr-4">{alerta.tendencia}</td>
                    <td className="py-2">
                      <span className={
                        alerta.status === 'alto' ? 'text-rose-300' :
                        alerta.status === 'médio' ? 'text-amber-300' :
                        'text-emerald-300'
                      }>
                        {alerta.status}
                      </span>
                    </td>
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
