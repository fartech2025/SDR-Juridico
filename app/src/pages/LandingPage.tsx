import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  UsersIcon,
  ShieldCheckIcon,
  PlayIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header/Navigation */}
      <header className="relative z-10 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ENEM Academy</h1>
                <p className="text-sm text-slate-400">Plataforma Inteligente de Preparação</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/home"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Acesso Administrativo</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 mb-6 border border-slate-700">
              <SparklesIcon className="w-4 h-4 mr-2 text-yellow-400" />
              Plataforma de Preparação ENEM 2024
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transforme seus
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}estudos{" "}
              </span>
              em resultados
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Uma plataforma inteligente e interativa que revoluciona sua preparação para o ENEM. 
              Simulados personalizados, análises detalhadas e acompanhamento em tempo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/home"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3 text-lg font-semibold shadow-lg"
              >
                <PlayIcon className="w-6 h-6" />
                <span>Começar Agora</span>
              </Link>
              
              <Link
                to="/provas"
                className="px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 flex items-center space-x-3 text-lg border border-slate-600"
              >
                <BookOpenIcon className="w-6 h-6" />
                <span>Ver Simulados</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Recursos avançados projetados para maximizar seu desempenho no ENEM
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Análise Inteligente</h3>
              <p className="text-slate-300 leading-relaxed">
                Algoritmos avançados analisam seu desempenho e identificam pontos fortes e áreas de melhoria em tempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Simulados Personalizados</h3>
              <p className="text-slate-300 leading-relaxed">
                Simulados adaptativos que se ajustam ao seu nível de conhecimento e focam nas suas necessidades específicas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Ranking Competitivo</h3>
              <p className="text-slate-300 leading-relaxed">
                Compare seu desempenho com outros estudantes e acompanhe sua evolução no ranking nacional.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Gestão de Tempo</h3>
              <p className="text-slate-300 leading-relaxed">
                Treine a gestão de tempo com cronômetros inteligentes e análises de velocidade de resposta.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Comunidade Ativa</h3>
              <p className="text-slate-300 leading-relaxed">
                Conecte-se com milhares de estudantes, tire dúvidas e compartilhe experiências de estudo.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 hover:border-red-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Conteúdo Oficial</h3>
              <p className="text-slate-300 leading-relaxed">
                Questões oficiais do ENEM dos últimos anos com explicações detalhadas e resolução passo a passo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                50K+
              </div>
              <div className="text-slate-300">Estudantes Ativos</div>
            </div>
            
            <div className="group">
              <div className="text-4xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                1M+
              </div>
              <div className="text-slate-300">Questões Resolvidas</div>
            </div>
            
            <div className="group">
              <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">
                89%
              </div>
              <div className="text-slate-300">Taxa de Aprovação</div>
            </div>
            
            <div className="group">
              <div className="text-4xl font-bold text-yellow-400 mb-2 group-hover:scale-110 transition-transform">
                24/7
              </div>
              <div className="text-slate-300">Suporte Disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para acelerar seus estudos?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de estudantes que já estão transformando seus resultados com nossa plataforma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/home"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-3 text-lg"
            >
              <span>Fazer Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">ENEM Academy</h3>
              </div>
              <p className="text-slate-400 text-sm">
                A plataforma mais completa para sua preparação no ENEM.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/home" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/provas" className="hover:text-white transition-colors">Simulados</Link></li>
                <li><Link to="/ranking" className="hover:text-white transition-colors">Ranking</Link></li>
                <li><Link to="/estatisticas" className="hover:text-white transition-colors">Estatísticas</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Acesso</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Cadastro</Link></li>
                <li><Link to="/home" className="hover:text-white transition-colors">Área Administrativa</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2024 ENEM Academy. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}