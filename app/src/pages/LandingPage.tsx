
import React, { useState } from 'react';
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
import BasePage from '../components/BasePage';
import MapaMinas from '../components/MapaMinas';

export default function LandingPage() {
  // Logo é gerenciado por BasePage agora - sem necessidade de carregar aqui
  // Apenas renderizamos o conteúdo da landing page
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const layer = hoveredFeature?.properties?.layer;
  const hoverTitle =
    layer === 'municipio'
      ? hoveredFeature?.properties?.nome || 'Município'
      : layer === 'macroregiao'
      ? `Macroregião ${hoveredFeature?.properties?.nome ?? ''}`.trim()
      : 'Minas Gerais';
  const hoverSubtitle =
    layer === 'municipio'
      ? [
          hoveredFeature?.properties?.microrregiao,
          hoveredFeature?.properties?.mesorregiao,
          hoveredFeature?.properties?.regiao_intermediaria,
        ]
          .filter(Boolean)
          .join(' • ') || 'Rede municipal monitorada'
      : layer === 'macroregiao'
      ? 'Abrange dezenas de municípios atendidos'
      : 'Cobertura completa do estado';

  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full max-w-[1680px] mx-auto flex flex-col gap-12 px-4 md:px-8 2xl:px-16 items-center">
        <header className="w-full flex justify-between items-center py-6 px-6 border-b border-slate-700">
          <div className="flex-1" />
          <nav className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <Link to="/login" className="btn btn-ghost">
              🔐 Login
            </Link>
            <div className="hidden md:block w-px h-6 bg-slate-600" />
            <Link to="/home" className="btn btn-primary flex items-center gap-2 px-4 py-2">
              <span>👨‍💼 Administrativo</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link to="/sec-educacao" className="btn btn-primary flex items-center gap-2 px-4 py-2">
              <span>🏫 Sec. Educação</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </nav>
        </header>
        <section className="w-full text-center py-16">
          <div className="inline-flex items-center px-4 py-2 glass-card rounded-full text-sm mb-6">
            <SparklesIcon className="w-4 h-4 mr-2 text-yellow-400" />
            Plataforma de Preparação ENEM
          </div>
          <h1 className="ds-heading text-4xl md:text-6xl mb-6">Transforme seus <span className="text-gradient">estudos</span> em resultados</h1>
          <p className="ds-muted text-xl mb-8 max-w-3xl mx-auto">Uma plataforma inteligente e interativa que revoluciona sua preparação para o ENEM. Simulados personalizados, análises detalhadas e acompanhamento em tempo real.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/home" className="btn btn-primary flex items-center gap-3 text-lg font-semibold">
              <PlayIcon className="w-6 h-6" />
              <span>Começar Agora</span>
            </Link>
            <Link to="/inicio" className="btn btn-ghost flex items-center gap-3 text-lg">
              <BookOpenIcon className="w-6 h-6" />
              <span>Ver Simulados</span>
            </Link>
          </div>
        </section>

        {/* Mapa Minas Gerais (SVG + d3-geo) */}
        <section className="w-full">
          <div className="glass-card p-4 md:p-6">
            <h2 className="ds-heading text-xl mb-3">Presença em Minas Gerais</h2>
            <p className="ds-muted mb-4">Municípios atendidos e áreas de atuação. Passe o mouse para destacar.</p>
            <MapaMinas className="w-full" onFeatureHover={setHoveredFeature} />
            <div className="glass-card mt-4 p-3 flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Área selecionada</p>
                <p className="text-lg font-semibold text-white">{hoverTitle}</p>
                <p className="text-xs text-slate-400">{hoverSubtitle}</p>
              </div>
              <div className="text-xs text-slate-400 self-end sm:text-right">
                Fonte: IBGE &mdash; Malhas territoriais (municípios + mesorregiões) <br className="hidden sm:block" />
                Arquivo: <code>/public/geo/minas-municipios-macro.geojson</code>
              </div>
            </div>
          </div>
        </section>

      {/* Features Section */}
      <section className="py-20 w-full">
        <div className="text-center mb-16">
          <h2 className="ds-heading text-3xl mb-4">Por que escolher nossa plataforma?</h2>
          <p className="ds-muted text-xl max-w-2xl mx-auto">Recursos avançados projetados para maximizar seu desempenho no ENEM</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Análise Inteligente</h3>
            <p className="ds-muted">Algoritmos avançados analisam seu desempenho e identificam pontos fortes e áreas de melhoria em tempo real.</p>
          </div>
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <BookOpenIcon className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Simulados Personalizados</h3>
            <p className="ds-muted">Simulados adaptativos que se ajustam ao seu nível de conhecimento e focam nas suas necessidades específicas.</p>
          </div>
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <TrophyIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Ranking Competitivo</h3>
            <p className="ds-muted">Compare seu desempenho com outros estudantes e acompanhe sua evolução no ranking nacional.</p>
          </div>
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <ClockIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Gestão de Tempo</h3>
            <p className="ds-muted">Treine a gestão de tempo com cronômetros inteligentes e análises de velocidade de resposta.</p>
          </div>
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <UsersIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Comunidade Ativa</h3>
            <p className="ds-muted">Conecte-se com milhares de estudantes, tire dúvidas e compartilhe experiências de estudo.</p>
          </div>
          <div className="glass-card p-8 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center mb-6">
              <ShieldCheckIcon className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="ds-heading text-xl mb-4">Conteúdo Oficial</h3>
            <p className="ds-muted">Questões oficiais do ENEM dos últimos anos com explicações detalhadas e resolução passo a passo.</p>
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
                <li><Link to="/inicio" className="hover:text-white transition-colors">Simulados</Link></li>
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
              © {new Date().getFullYear()} ENEM Ultra. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </BasePage>
  );
}
