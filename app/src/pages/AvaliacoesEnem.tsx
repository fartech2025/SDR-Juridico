import React from 'react';
import BasePage from '../components/BasePage';

const START_YEAR = 1998;
const END_YEAR = 2025;

const geraHistorico = () =>
  Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, idx) => {
    const ano = START_YEAR + idx;
    const simulados = 600 + Math.sin(idx / 3) * 40 + (idx % 5) * 8;
    const enemOficial = 620 + Math.cos(idx / 4) * 35 + (idx % 7) * 6;
    return {
      ano,
      simulado: Number(simulados.toFixed(1)),
      enem: Number(enemOficial.toFixed(1)),
    };
  });

const HISTORICO = geraHistorico();

const DESTAQUES = [
  { ano: 2024, titulo: 'Melhor média histórica', valor: '712 pts', desc: 'Rede municipal de Belo Horizonte' },
  { ano: 2023, titulo: 'Maior salto em simulados', valor: '+18 pts', desc: 'Implementação de telemetria ENEM' },
  { ano: 2015, titulo: 'Programa de tutoria', valor: '+12 pts', desc: 'Mentorias para alunos do 3º ano' },
];

export default function AvaliacoesEnem() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Avaliações ENEM</p>
              <h1 className="text-3xl font-semibold text-white">Histórico de desempenho 1998-2025</h1>
              <p className="text-slate-400 max-w-3xl mt-2">
                Acompanhe a evolução da rede nos simulados oficiais e nos resultados do ENEM, identificando tendências e
                programas que impactaram a curva de aprendizado.
              </p>
            </div>
            <div className="text-sm text-slate-400">
              Próxima atualização:
              <span className="text-blue-300 font-semibold ml-1">dez/2025</span>
            </div>
          </div>
        </header>

        <section className="glass-card p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {DESTAQUES.map((item) => (
              <div key={item.ano} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.ano}</p>
                <p className="text-lg font-semibold text-white">{item.titulo}</p>
                <p className="text-2xl text-blue-300 font-bold">{item.valor}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Série histórica</p>
                <h2 className="text-lg font-semibold text-white">Simulados vs ENEM oficial</h2>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white hover:border-blue-400/40">
                Exportar gráfico
              </button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Ano</th>
                    <th className="py-2 pr-4">Simulados (média)</th>
                    <th className="py-2 pr-4">ENEM oficial (média)</th>
                    <th className="py-2 pr-4">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {HISTORICO.map((linha) => (
                    <tr key={linha.ano}>
                      <td className="py-2 pr-4 font-semibold text-white">{linha.ano}</td>
                      <td className="py-2 pr-4">{linha.simulado} pts</td>
                      <td className="py-2 pr-4">{linha.enem} pts</td>
                      <td className="py-2 pr-4">
                        <span className={linha.enem - linha.simulado >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                          {(linha.enem - linha.simulado).toFixed(1)} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Programas em destaque</h2>
            <div className="space-y-3 text-sm text-slate-300">
              {[
                { titulo: 'Programa Conecta ENEM', periodo: '2022-2024', impacto: '+14 pts', detalhes: 'Expansão de laboratórios digitais e telemetria.' },
                { titulo: 'Mentoria Rede 360', periodo: '2016-2019', impacto: '+11 pts', detalhes: '4 encontros mensais com foco em redação e ciências.' },
                { titulo: 'Plano de Recuperação 2009', periodo: '2009-2011', impacto: '+9 pts', detalhes: 'Oficinas nos contraturnos e simulados quinzenais.' },
              ].map((programa) => (
                <div key={programa.titulo} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{programa.periodo}</span>
                    <span className="text-emerald-300 font-semibold">{programa.impacto}</span>
                  </div>
                  <p className="text-white font-semibold">{programa.titulo}</p>
                  <p className="text-xs text-slate-400">{programa.detalhes}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Comparativo rápido</p>
              <h3 className="text-lg font-semibold text-white">Top 5 escolas 2024</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              {['Aurora', 'Cidade Alta', 'Horizonte', 'Vale Verde', 'Nova Era'].map((escola, idx) => (
                <li key={escola} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>
                    {idx + 1}º {escola}
                  </span>
                  <span className="text-blue-300 font-semibold">{(710 - idx * 8).toFixed(0)} pts</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </BasePage>
  );
}
