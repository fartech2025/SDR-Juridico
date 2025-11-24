import React from 'react';
import { Link } from 'react-router-dom';
import { prefetchRoute } from '../../lib/prefetch';

export default function LandingSidebar() {
  return (
    <aside className="hidden lg:flex fixed top-0 right-0 h-screen w-80 z-30 flex-col border-l border-slate-800 bg-slate-950/70 backdrop-blur-xl p-5 gap-5">
      <header>
        <h3 className="ds-heading text-xl">Painel</h3>
        <p className="ds-muted text-sm">Acesso rápido e visão geral</p>
      </header>

      {/* Ações rápidas */}
      <section className="glass-card p-4">
        <h4 className="text-sm font-semibold mb-3">Ações</h4>
        <div className="flex flex-col gap-2">
          <Link
            to="/inicio"
            className="btn btn-primary w-full"
            onMouseEnter={() => prefetchRoute(() => import('../../pages/SelecionarProva'), 'SelecionarProva')}
            onFocus={() => prefetchRoute(() => import('../../pages/SelecionarProva'), 'SelecionarProva')}
          >
            Fazer Simulado
          </Link>
          <Link
            to="/ranking"
            className="btn btn-ghost w-full"
            onMouseEnter={() => prefetchRoute(() => import('../../pages/dashboard/Ranking'), 'Ranking')}
            onFocus={() => prefetchRoute(() => import('../../pages/dashboard/Ranking'), 'Ranking')}
          >
            Ver Ranking
          </Link>
          <Link
            to="/estatisticas"
            className="btn btn-ghost w-full"
            onMouseEnter={() => prefetchRoute(() => import('../../pages/dashboard/Estatisticas'), 'Estatisticas')}
            onFocus={() => prefetchRoute(() => import('../../pages/dashboard/Estatisticas'), 'Estatisticas')}
          >
            Estatísticas
          </Link>
        </div>
      </section>

      {/* Usuários online (placeholder) */}
      <section className="glass-card p-4">
        <h4 className="text-sm font-semibold mb-2">Usuários online</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400">--</span>
          <span className="ds-muted">agora</span>
        </div>
        <p className="ds-muted text-xs mt-1">Em breve: atualização em tempo real</p>
      </section>

      {/* Pontuação por matéria (placeholder) */}
      <section className="glass-card p-4">
        <h4 className="text-sm font-semibold mb-3">Pontuação por matéria</h4>
        <ul className="space-y-2">
          {[
            { nome: 'Linguagens', pct: 75 },
            { nome: 'Matemática', pct: 62 },
            { nome: 'Ciências Humanas', pct: 58 },
            { nome: 'Ciências da Natureza', pct: 66 },
          ].map((m) => (
            <li key={m.nome}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">{m.nome}</span>
                <span className="text-slate-400">{m.pct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{ width: `${m.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto text-xs text-center ds-muted">© {new Date().getFullYear()} ENEM Ultra</footer>
    </aside>
  );
}
