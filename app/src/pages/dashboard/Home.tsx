import BasePage from '../../components/BasePage';
import { Link } from 'react-router-dom';
import { prefetchRoute } from '../../lib/prefetch';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

const NAV_QUICK_ACTIONS = [
  { label: 'Matrícula Online', path: '/matricula', icon: '📝', desc: 'Fluxo de inscrição municipal' },
  { label: 'Painel da Secretaria', path: '/painel-gestor', icon: '🏛️', desc: 'Indicadores em tempo real' },
  { label: 'Gestão Escolar', path: '/gestao-escolar', icon: '🏫', desc: 'Visão por unidade' },
  { label: 'Avaliações ENEM', path: '/avaliacoes-enem', icon: '🎯', desc: 'Simulados e diagnósticos' },
  { label: 'Logística Escolar', path: '/logistica-escolar', icon: '🚌', desc: 'Transporte, merenda, estoques' },
  { label: 'Relatórios Estratégicos', path: '/estatisticas', icon: '📊', desc: 'KPIs institucionais' }
];

const UPCOMING_EVENTS = [
  { title: 'Simpósio Pedagógico', date: '24 Nov', type: 'Webinar', highlight: true },
  { title: 'Capacitação Sec. Educação', date: '30 Nov', type: 'Workshop' },
  { title: 'Revisão ENEM Ao Vivo', date: '12 Dez', type: 'Transmissão' },
];

const MUNICIPAL_METRICS = [
  { label: 'Escolas conectadas', value: '128', trend: '+12 novas' },
  { label: 'Estudantes ativos', value: '52.430', trend: 'Rede municipal' },
  { label: 'Turmas monitoradas', value: '2.348', trend: 'Tempo real' },
  { label: 'Professores engajados', value: '4.215', trend: '72% com acesso diário' }
];

const MODULES = [
  { title: 'Matrículas & Cadastro Único', desc: 'Fluxo unificado, vagas prioritárias e zoneamento automático.', icon: '🗂️' },
  { title: 'Transporte & Rotas', desc: 'Geolocalização, manutenção e controle de frota escolar.', icon: '🚌' },
  { title: 'Merenda & Estoques', desc: 'Compras, cardápios e distribuição com alertas.', icon: '🍽️' },
  { title: 'Avaliação & ENEM', desc: 'Simulados, indicadores e comparativos por unidade.', icon: '📈' },
  { title: 'Assistência Estudantil', desc: 'Uniformes, kits e monitoramento socioemocional.', icon: '🤝' },
  { title: 'Ouvidoria & Comunidade', desc: 'Canais abertos e histórico de atendimentos.', icon: '💬' }
];

const STRATEGIC_DASHBOARDS = [
  {
    title: 'Painel da Secretaria',
    highlights: ['Indicadores de frequência por bairro', 'Integração SIGEduc + SGP', 'Alertas de evasão'],
    cta: { label: 'Abrir painel', path: '/painel-estrategico' }
  },
  {
    title: 'Rede Municipal Inteligente',
    highlights: ['Mapa de calor das escolas', 'Índice de conectividade', 'Status da infraestrutura'],
    cta: { label: 'Ver mapa', path: '/rede-inteligente' }
  }
];

const ADVANCED_SHORTCUTS = [
  { label: 'Painel do Gestor', description: 'Visão institucional', path: '/painel-gestor', icon: '👔' },
  { label: 'Sec. Educação', description: 'Projetos parceiros', path: '/sec-educacao', icon: '🏛️' },
  { label: 'Database Inspetor', description: 'Audite dados e tabelas', path: '/database-inspetor', icon: '🗃️' },
  { label: 'Relações de Tabelas', description: 'Documentação técnica', path: '/database-relations', icon: '🔗' },
  { label: 'Documentação', description: 'Guias e procedimentos', path: '/documentacao-relacionamentos', icon: '📚' },
];

const MONITOR_SHORTCUT = { label: 'Monitor', description: 'Status em tempo real', path: '/monitor', icon: '🖥️' };

export default function Home() {
  const leftShortcuts = ADVANCED_SHORTCUTS.slice(0, 3);
  const rightShortcuts = [...ADVANCED_SHORTCUTS.slice(3), MONITOR_SHORTCUT];
  return (
    <BasePage fullWidth contentClassName="py-8">
      <div className="relative w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <aside className="hidden 2xl:flex flex-col gap-4 w-64 fixed left-8 top-32 bottom-8 overflow-y-auto pr-2">
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Desempenho por Polo</h3>
              <span className="text-xs text-blue-300">Atualizado hoje</span>
            </div>
            <div className="space-y-4 text-sm">
              {['Centro', 'Zona Norte', 'Zona Sul', 'Rural'].map((polo) => {
                const value = Math.round(Math.random() * 35 + 65);
                return (
                  <div key={polo}>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>{polo}</span>
                      <span className="text-slate-200 font-semibold">{value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          value > 80 ? 'bg-emerald-400' : value > 70 ? 'bg-blue-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Alertas críticos</h3>
            <ul className="space-y-3 text-xs text-slate-200">
              {[
                { label: 'Evasão', value: 15, desc: 'Colégio Horizonte' },
                { label: 'Frota reduzida', value: 8, desc: 'Zona Rural' },
                { label: 'Merenda', value: 5, desc: 'Estoque crítico' },
              ].map((alert) => (
                <li key={alert.label} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>{alert.label}</span>
                    <span className="text-red-300 font-semibold">{alert.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500" style={{ width: `${alert.value}%` }} />
                  </div>
                  <p className="text-slate-400">{alert.desc}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ferramentas e suporte</p>
              <h3 className="text-sm font-semibold text-white">Atalhos avançados</h3>
            </div>
            <div className="space-y-3">
              {leftShortcuts.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2 text-left hover:border-blue-400/40 transition"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm text-white font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
        <aside className="hidden 2xl:flex flex-col gap-4 w-64 fixed right-8 top-32 bottom-8 overflow-y-auto pl-2">
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Ranking de escolas</h3>
            <div className="space-y-2">
              {['Aurora', 'Modelo Centro', 'Parques', 'Horizonte', 'Nova Era'].map((school, idx) => (
                <div key={school} className="flex items-center gap-2">
                  <span className="w-5 text-slate-400">{idx + 1}º</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-slate-200">
                      <span>{school}</span>
                      <span>{Math.round(Math.random() * 15 + 85)} pts</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${90 - idx * 5}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Índice de conectividade</h3>
            <div className="space-y-3 text-sm text-slate-400">
              {[
                { label: 'Fibra dedicada', value: 82, color: 'bg-emerald-400' },
                { label: '4G/5G', value: 64, color: 'bg-blue-400' },
                { label: 'Offline', value: 4, color: 'bg-rose-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Acesso rápido</p>
              <h3 className="text-sm font-semibold text-white">Operações críticas</h3>
            </div>
            <div className="space-y-3">
              {rightShortcuts.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2 hover:border-purple-400/40 transition"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm text-white font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-10 2xl:ml-[calc(16rem+20px)] 2xl:mr-[calc(16rem+20px)]">
        {/* Hero */}
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="glass-card p-8 space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SaaS Educacional Municipal</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                Plataforma oficial da Secretaria Municipal de Educação.
              </h1>
              <p className="text-slate-400 text-lg">
                Conecte escolas, acompanhe matrículas, transporte, merenda e avalie o desempenho da rede em um painel único.
                Inspirado nos melhores sistemas SaaS governamentais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/central-operacional" className="btn-primary px-6 h-12 inline-flex items-center gap-2">
                🚀 Acessar Central Operacional
              </Link>
              <Link to="/sec-educacao" className="btn-secondary px-6 h-12 inline-flex items-center gap-2">
                🏛️ Secretaria Parceira
              </Link>
              <div className="text-sm text-slate-400">
                Próxima atualização da rede: <span className="text-blue-300 font-semibold">15/11</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Eventos</p>
                <h2 className="text-lg font-semibold text-white">Calendário Acadêmico</h2>
              </div>
              <Link to="/monitor" className="btn-ghost text-xs px-4 h-9">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {UPCOMING_EVENTS.map((event) => (
                <div
                  key={event.title}
                  className={`rounded-xl border px-4 py-3 ${
                    event.highlight ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-100 font-semibold">{event.title}</p>
                      <p className="text-xs text-slate-400">{event.type}</p>
                    </div>
                    <span className="text-sm font-medium text-white">{event.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Métricas principais */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MUNICIPAL_METRICS.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="text-xs text-blue-300">{metric.trend}</p>
            </div>
          ))}
        </section>

        {/* Ações Rápidas */}
        <section className="grid gap-4 md:grid-cols-3">
          {NAV_QUICK_ACTIONS.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 px-5 py-4 flex flex-col gap-2 hover:border-blue-400/40 transition"
              onMouseEnter={() => prefetchRoute(() => import('../UserLandingPage'), 'dashboard')}
            >
              <div className="flex items-center justify-between">
                <div className="text-3xl">{action.icon}</div>
                <ArrowRightIcon className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{action.label}</p>
                <p className="text-sm text-slate-400">{action.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Módulos do sistema */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Módulos integrados</p>
            <h2 className="text-xl font-semibold text-white">Tudo o que a rede municipal precisa</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 space-y-2"
              >
                <div className="text-2xl">{module.icon}</div>
                <p className="text-lg font-semibold text-white">{module.title}</p>
                <p className="text-sm text-slate-400">{module.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Painéis estratégicos */}
        <section className="grid gap-6 lg:grid-cols-2">
          {STRATEGIC_DASHBOARDS.map((panel) => (
            <div key={panel.title} className="glass-card p-5 space-y-3">
              <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">Painel estratégico</p>
              <h3 className="text-xl font-semibold text-white">{panel.title}</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {panel.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to={panel.cta.path} className="btn-primary h-10 px-4 inline-flex items-center justify-center text-sm">
                {panel.cta.label}
              </Link>
            </div>
          ))}
        </section>

        </div>
      </div>
    </BasePage>
  );
}
