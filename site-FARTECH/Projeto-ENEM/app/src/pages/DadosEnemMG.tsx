import React from 'react';
import BasePage from '../components/BasePage';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const LINKS = [
  {
    title: 'Portal de Microdados INEP',
    desc: 'Download oficial dos microdados do ENEM (CSV/TSV) por edição.',
    href: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados',
  },
  {
    title: 'API inepdadosabertos',
    desc: 'Projeto comunitário com endpoints simplificados sobre resultados do ENEM.',
    href: 'https://github.com/inepdadosabertos/api',
  },
  {
    title: 'Documentação do ENEM',
    desc: 'Dicionário de dados, layout das colunas e códigos de UF/município.',
    href: 'https://download.inep.gov.br/microdados/documentos/',
  },
];

const STEPS = [
  'Escolher os anos desejados (1998–2025) e baixar os microdados do portal INEP.',
  'Filtrar apenas registros com UF = "MG" (Minas Gerais) ou municípios de interesse.',
  'Selecionar colunas relevantes (códigos da escola, notas por área, resultado de redação).',
  'Converter os arquivos CSV para JSON ou inserir direto em um banco (Supabase/Postgres).',
  'Gerar indicadores agregados: média por escola, município, rede ou edição do ENEM.',
  'Expor esses indicadores via API interna para alimentar os dashboards do projeto.',
];

const HISTORICO = [
  { ano: 2014, media: 598 },
  { ano: 2015, media: 602 },
  { ano: 2016, media: 610 },
  { ano: 2017, media: 615 },
  { ano: 2018, media: 621 },
  { ano: 2019, media: 629 },
  { ano: 2020, media: 634 },
  { ano: 2021, media: 640 },
  { ano: 2022, media: 648 },
  { ano: 2023, media: 654 },
  { ano: 2024, media: 662 },
];

export default function DadosEnemMG() {
  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Dados ENEM • Minas Gerais</p>
              <h1 className="text-3xl font-semibold text-white">Tratamento dos microdados oficiais</h1>
              <p className="text-slate-400 max-w-3xl mt-2">
                Esta página descreve a origem dos dados, o fluxo de preparação e como integrar o histórico de notas do ENEM
                para o estado de Minas Gerais aos dashboards do sistema.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Última revisão: <span className="text-blue-300 font-semibold">Nov/2024</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {LINKS.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-2 hover:border-blue-400/40 transition"
            >
              <p className="text-white font-semibold">{link.title}</p>
              <p className="text-sm text-slate-400">{link.desc}</p>
              <span className="text-xs text-blue-300 inline-flex items-center gap-1">Abrir recurso →</span>
            </a>
          ))}
        </section>

        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fluxo recomendado</p>
              <h2 className="text-lg font-semibold text-white">Passo a passo para preparar os dados</h2>
            </div>
          </div>
          <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Histórico de notas</p>
              <h2 className="text-lg font-semibold text-white">Evolução da média ENEM • MG</h2>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HISTORICO}>
                <defs>
                  <filter id="shadow" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
                  </filter>
                </defs>
                <XAxis dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="media" stroke="#38bdf8" strokeWidth={3} dot={{ stroke: '#38bdf8', strokeWidth: 2 }}>
                  <text />
                </Line>
                {HISTORICO.map((p) => (
                  <text
                    key={p.ano}
                    x={p.ano}
                    y={p.media}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Indicadores sugeridos</p>
            <h3 className="text-lg font-semibold text-white">Métricas para os dashboards</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Média geral por escola e por edição do ENEM.</li>
              <li>• Evolução das notas por área (Linguagens, Matemática, Ciências Humanas, Ciências da Natureza, Redação).</li>
              <li>• Comparativo município x estado x Brasil.</li>
              <li>• Ranking das escolas com melhor evolução anual.</li>
              <li>• Distribuição dos participantes por rede (municipal, estadual, privada).</li>
            </ul>
          </div>
          <div className="glass-card p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Integração</p>
            <h3 className="text-lg font-semibold text-white">API interna e jobs</h3>
            <p className="text-sm text-slate-300">
              Após o processamento, é recomendado expor os indicadores em uma tabela específica (ex.:{" "}
              <code>enem_mg_resumos</code>) e criar um endpoint REST/GraphQL no backend. Jobs agendados podem atualizar os
              dados anualmente assim que o INEP liberar novos microdados.
            </p>
          </div>
        </section>
      </div>
    </BasePage>
  );
}
