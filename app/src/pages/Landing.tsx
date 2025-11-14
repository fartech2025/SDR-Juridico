
import { Link } from 'react-router-dom';
import { prefetchRoute } from '../lib/prefetch';
import { useAuth } from '../hooks/useAuth';
import BasePage from '../components/BasePage';

export default function Landing() {
  const { user } = useAuth();
  return (
    <BasePage>
      <div className="w-full flex flex-col gap-8 items-center">
        <header className="w-full flex items-center justify-between mb-4">
          <div className="ds-heading text-blue-400">ENEM Ultra</div>
          {/* Top bar (desktop): ações principais no lado direito */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              to="/inicio"
              className="btn btn-primary"
              onMouseEnter={() => prefetchRoute(() => import('./SelecionarProva'), 'SelecionarProva')}
              onFocus={() => prefetchRoute(() => import('./SelecionarProva'), 'SelecionarProva')}
            >
              Fazer Simulado
            </Link>
            <Link
              to="/ranking"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./dashboard/Ranking'), 'Ranking')}
              onFocus={() => prefetchRoute(() => import('./dashboard/Ranking'), 'Ranking')}
            >
              Ver Ranking
            </Link>
            <Link
              to="/estatisticas"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./dashboard/Estatisticas'), 'Estatisticas')}
              onFocus={() => prefetchRoute(() => import('./dashboard/Estatisticas'), 'Estatisticas')}
            >
              Estatísticas
            </Link>
            <span className="mx-2 h-6 w-px bg-slate-700" aria-hidden="true" />
            <Link to="/login" className="btn btn-ghost">Entrar</Link>
            <Link to="/cadastro" className="btn btn-primary">Criar conta</Link>
          </nav>
          {/* Mobile: mantém apenas login/cadastro no topo */}
          <nav className="flex lg:hidden gap-2">
            <Link to="/login" className="btn btn-ghost">Entrar</Link>
            <Link to="/cadastro" className="btn btn-primary">Criar conta</Link>
          </nav>
        </header>
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="ds-heading text-3xl mb-4">Seu caminho aprovado no ENEM</h1>
          <p className="ds-muted mb-8">Simulados realistas, estatísticas inteligentes e acompanhamento por perfil. Comece agora mesmo.</p>
          {/* No desktop os botões ficam na top bar; aqui ficam visíveis apenas em telas menores */}
          <div className="flex flex-wrap justify-center gap-3 lg:hidden">
            <Link
              to="/selecionar-prova"
              className="btn btn-primary"
              onMouseEnter={() => prefetchRoute(() => import('./SelecionarProva'), 'SelecionarProva')}
              onFocus={() => prefetchRoute(() => import('./SelecionarProva'), 'SelecionarProva')}
            >
              Fazer Simulado
            </Link>
            <Link
              to="/ranking"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./dashboard/Ranking'), 'Ranking')}
              onFocus={() => prefetchRoute(() => import('./dashboard/Ranking'), 'Ranking')}
            >
              Ver Ranking
            </Link>
            <Link
              to="/estatisticas"
              className="btn btn-ghost"
              onMouseEnter={() => prefetchRoute(() => import('./dashboard/Estatisticas'), 'Estatisticas')}
              onFocus={() => prefetchRoute(() => import('./dashboard/Estatisticas'), 'Estatisticas')}
            >
              Estatísticas
            </Link>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <Card title="Para Alunos" desc="Resolva provas anteriores, acompanhe seu progresso e foque no que mais importa.">
            <Link
              to="/painel-aluno"
              className="btn"
              onMouseEnter={() => prefetchRoute(() => import('../components/DashboardAluno_dark_supabase'), 'DashboardAluno')}
              onFocus={() => prefetchRoute(() => import('../components/DashboardAluno_dark_supabase'), 'DashboardAluno')}
            >
              Ir para painel do aluno
            </Link>
          </Card>
          <Card title="Para Gestores" desc="Acompanhe turmas, veja ranking e indicadores para tomada de decisão.">
            <Link
              to="/painel-gestor"
              className="btn"
              onMouseEnter={() => prefetchRoute(() => import('../components/DashboardGestor_dark_supabase'), 'DashboardGestor')}
              onFocus={() => prefetchRoute(() => import('../components/DashboardGestor_dark_supabase'), 'DashboardGestor')}
            >
              Ir para painel do gestor
            </Link>
          </Card>
          <Card title="Simulados ENEM" desc="Provas por ano/tema com correção automática e análise de acertos.">
            <Link to="/inicio" className="btn">Ver simulados</Link>
          </Card>
        </section>
              <Link
                to="/painel-aluno"
                className="btn btn-ghost"
                onMouseEnter={() => prefetchRoute(() => import('../components/DashboardAluno_dark_supabase'), 'DashboardAluno')}
                onFocus={() => prefetchRoute(() => import('../components/DashboardAluno_dark_supabase'), 'DashboardAluno')}
              >
                Painel Aluno
              </Link>
              <Link
                to="/painel-gestor"
                className="btn btn-ghost"
                onMouseEnter={() => prefetchRoute(() => import('../components/DashboardGestor_dark_supabase'), 'DashboardGestor')}
                onFocus={() => prefetchRoute(() => import('../components/DashboardGestor_dark_supabase'), 'DashboardGestor')}
              >
                Painel Gestor
              </Link>
            </div>
          </section>
        )}
        <footer className="w-full text-center text-slate-500 text-sm mt-8">
          © {new Date().getFullYear()} ENEM Ultra — Todos os direitos reservados.
        </footer>
      </div>
      {/* Removido: sidebar da landing. Mantemos top bar para CTAs em desktop. */}
    </BasePage>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div>
        <h3 className="ds-heading text-lg">{title}</h3>
        <p className="ds-muted text-sm mt-1">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
