import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="text-xl font-bold text-blue-400">ENEM Ultra</div>
        <nav className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">Entrar</Link>
          <Link to="/cadastro" className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600">Criar conta</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-10 grid gap-10">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white mb-4">Seu caminho aprovado no ENEM</h1>
          <p className="text-slate-300 mb-8">Simulados realistas, estatísticas inteligentes e acompanhamento por perfil. Comece agora mesmo.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/selecionar-prova" className="px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-600">Fazer Simulado</Link>
            <Link to="/ranking" className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700">Ver Ranking</Link>
            <Link to="/estatisticas" className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700">Estatísticas</Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Para Alunos" desc="Resolva provas anteriores, acompanhe seu progresso e foque no que mais importa.">
            <Link to="/painel-aluno" className="btn inline-block">Ir para painel do aluno</Link>
          </Card>
          <Card title="Para Gestores" desc="Acompanhe turmas, veja ranking e indicadores para tomada de decisão.">
            <Link to="/painel-gestor" className="btn inline-block">Ir para painel do gestor</Link>
          </Card>
          <Card title="Simulados ENEM" desc="Provas por ano/tema com correção automática e análise de acertos.">
            <Link to="/selecionar-prova" className="btn inline-block">Selecionar prova</Link>
          </Card>
        </section>

        {user && (
          <section className="text-center">
            <p className="text-slate-300 mb-3">Você já está autenticado.</p>
            <div className="flex justify-center gap-3">
              <Link to="/home" className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600">Ir para Home</Link>
              <Link to="/painel-aluno" className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">Painel Aluno</Link>
              <Link to="/painel-gestor" className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">Painel Gestor</Link>
            </div>
          </section>
        )}
      </main>

      <footer className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} ENEM Ultra — Todos os direitos reservados.
      </footer>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-slate-300 text-sm mt-1">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
