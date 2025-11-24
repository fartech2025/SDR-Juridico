import React from 'react';
import BasePage from '../components/BasePage';

const TRANSPORTE = [
  { aluno: 'Ana Souza', rota: 'Rota Norte 03', ponto: 'Praça Aurora', status: 'Ativo' },
  { aluno: 'João Lima', rota: 'Rota Rural 01', ponto: 'Fazenda Horizonte', status: 'Ativo' },
  { aluno: 'Marina Costa', rota: 'Rota Leste 07', ponto: 'Av. Central', status: 'Aguardando' },
];

const ROTAS = [
  { titulo: 'Rota Norte 03', distancia: '18 km', pontos: 12, ocupacao: '92%' },
  { titulo: 'Rota Rural 01', distancia: '46 km', pontos: 8, ocupacao: '78%' },
  { titulo: 'Rota Leste 07', distancia: '22 km', pontos: 10, ocupacao: '81%' },
];

const CARDAPIO = [
  { dia: 'Segunda', prato: 'Arroz integral + feijão + frango grelhado + salada' },
  { dia: 'Terça', prato: 'Macarrão ao sugo + carne moída + legumes' },
  { dia: 'Quarta', prato: 'Feijoada leve + couve + farofa' },
  { dia: 'Quinta', prato: 'Peixe assado + purê de batata + salada' },
  { dia: 'Sexta', prato: 'Risoto de frango + mix de verduras' },
];

const ESTOQUE = [
  { item: 'Arroz 5kg', quantidade: '230 unid.', validade: '02/2025', status: 'ok' },
  { item: 'Feijão 1kg', quantidade: '180 unid.', validade: '04/2025', status: 'atenção' },
  { item: 'Leite UHT', quantidade: '420 unid.', validade: '01/2025', status: 'ok' },
  { item: 'Frutas (mix)', quantidade: '310 kg', validade: 'semana', status: 'ok' },
];

export default function LogisticaEscolar() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Logística Escolar</p>
              <h1 className="text-3xl font-semibold text-white">Transporte, merenda e estoque integrados</h1>
              <p className="text-slate-400 max-w-3xl mt-2">
                Acompanhe ônibus cadastrados, rotas e a disponibilidade dos insumos de merenda em um único painel com as
                informações essenciais para a Secretaria.
              </p>
            </div>
            <div className="text-sm text-slate-400">
              Status geral:
              <span className="text-emerald-300 font-semibold ml-1">Operação estável</span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transporte cadastrado</p>
                <h2 className="text-lg font-semibold text-white">Alunos por rota</h2>
              </div>
              <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">
                Exportar lista
              </button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 overflow-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Aluno</th>
                    <th className="pb-2 pr-4">Rota</th>
                    <th className="pb-2 pr-4">Ponto</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {TRANSPORTE.map((registro) => (
                    <tr key={registro.aluno}>
                      <td className="py-2 pr-4 text-white font-semibold">{registro.aluno}</td>
                      <td className="py-2 pr-4">{registro.rota}</td>
                      <td className="py-2 pr-4">{registro.ponto}</td>
                      <td className="py-2">
                        <span className={registro.status === 'Ativo' ? 'text-emerald-300' : 'text-amber-300'}>
                          {registro.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {ROTAS.map((rota) => (
                <div key={rota.titulo} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 space-y-1">
                  <p className="text-sm text-white font-semibold">{rota.titulo}</p>
                  <p className="text-xs text-slate-400">{rota.distancia} • {rota.pontos} pontos</p>
                  <p className="text-xs text-slate-400">Ocupação: <span className="text-blue-300 font-semibold">{rota.ocupacao}</span></p>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cardápio semanal</p>
              <h2 className="text-lg font-semibold text-white">Merenda escolar</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {CARDAPIO.map((refeicao) => (
                <div key={refeicao.dia} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-white font-semibold">{refeicao.dia}</p>
                  <p className="text-xs text-slate-400">{refeicao.prato}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Estoque crítico</p>
              <div className="space-y-3">
                {ESTOQUE.map((item) => (
                  <div key={item.item} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{item.item}</p>
                      <p className="text-xs text-slate-400">Validade: {item.validade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-300 font-semibold">{item.quantidade}</p>
                      <p className={`text-xs ${item.status === 'atenção' ? 'text-amber-300' : 'text-slate-400'}`}>{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </BasePage>
  );
}
