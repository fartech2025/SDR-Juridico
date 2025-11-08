import BasePage from '../../components/BasePage';
import { Link } from 'react-router-dom';
import { prefetchRoute } from '../../lib/prefetch';

export default function Home() {
  // Página demo, sem autenticação, sem supabase, só design system central
  return (
    <BasePage>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="glass-card p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl mb-6 shadow-2xl">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="ds-heading mb-2">Simulados ENEM</h1>
            <p className="ds-subtitle">Escolha a prova e como deseja resolver.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Link
              to="/simulados"
              className="btn btn-primary w-full mb-3 text-lg py-3"
            >
              🎯 Resolver Simulados
            </Link>
            <Link
              to="/ranking"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./Ranking'), 'Ranking')}
              onFocus={() => prefetchRoute(() => import('./Ranking'), 'Ranking')}
            >
              🏆 Ranking
            </Link>
            <Link
              to="/estatisticas"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./Estatisticas'), 'Estatisticas')}
              onFocus={() => prefetchRoute(() => import('./Estatisticas'), 'Estatisticas')}
            >
              📊 Estatísticas
            </Link>
            <Link to="/painel-gestor" className="btn btn-ghost">👔 Painel do Gestor</Link>
            <Link to="/painel-aluno" className="btn btn-ghost">🎒 Painel do Aluno</Link>
            <Link to="/selecionar-prova" className="btn btn-ghost">📝 Selecionar Prova</Link>
            <Link to="/simulados" className="btn btn-ghost">🧪 Simulado (Exemplo)</Link>
            <Link to="/monitor" className="btn btn-ghost">🖥️ Monitor</Link>
            <Link to="/sec-educacao" className="btn btn-ghost">🏛️ Sec. Educação</Link>
            <Link to="/database-inspetor" className="btn btn-ghost">🗄️ Database Inspetor</Link>
            <Link to="/database-relations" className="btn btn-ghost">🔗 Relações entre Tabelas</Link>
          </div>
          <div className="mb-4">
            <label className="ds-label block mb-2">Selecione uma prova</label>
            <select className="input-field w-full">
              <option>Escolha...</option>
              <option>ENEM 2024 - Linguagens</option>
              <option>ENEM 2023 - Linguagens</option>
            </select>
          </div>
        </div>
      </div>
    </BasePage>
  );
}
