
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
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import BasePage from '../components/BasePage';
import MapaMinas from '../components/MapaMinas';

const FEATURE_CARDS = [
  {
    icon: ChartBarIcon,
    title: 'Análise Inteligente',
    description: 'Algoritmos avançados analisam seu desempenho e identificam pontos fortes e áreas de melhoria em tempo real.',
    color: 'text-blue-400',
  },
  {
    icon: BookOpenIcon,
    title: 'Simulados Personalizados',
    description: 'Simulados adaptativos que se ajustam ao seu nível de conhecimento e focam nas suas necessidades específicas.',
    color: 'text-purple-400',
  },
  {
    icon: TrophyIcon,
    title: 'Ranking Competitivo',
    description: 'Compare seu desempenho com outros estudantes e acompanhe sua evolução no ranking nacional.',
    color: 'text-emerald-400',
  },
  {
    icon: ClockIcon,
    title: 'Gestão de Tempo',
    description: 'Treine a gestão de tempo com cronômetros inteligentes e análises de velocidade de resposta.',
    color: 'text-yellow-400',
  },
  {
    icon: UsersIcon,
    title: 'Comunidade Ativa',
    description: 'Conecte-se com milhares de estudantes, tire dúvidas e compartilhe experiências de estudo.',
    color: 'text-indigo-400',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Conteúdo Oficial',
    description: 'Questões oficiais do ENEM dos últimos anos com explicações detalhadas e resolução passo a passo.',
    color: 'text-rose-400',
  },
]

export default function LandingPage() {

  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full flex flex-col gap-12 px-4 md:px-8 2xl:px-16 items-center">
        <section className="relative w-full min-h-[760px] overflow-hidden rounded-[48px] bg-white/[0.01] px-4 lg:px-16">
          <div className="absolute inset-0 opacity-25 pointer-events-none select-none">
            <MapaMinas
              className="w-full h-full"
              minHeight={760}
              projectionScale={3400}
              center={[-45, -19.2]}
              showLabels={false}
            />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center gap-10 px-6 sm:px-10 py-16">
            <div className="inline-flex items-center px-4 py-2 glass-card rounded-full text-sm">
              <SparklesIcon className="w-4 h-4 mr-2 text-yellow-400" />
              Plataforma de Preparação ENEM
            </div>
            <div className="space-y-6 max-w-4xl">
              <h1 className="ds-heading text-4xl md:text-6xl">
                Transforme seus <span className="text-gradient">estudos</span> em resultados
              </h1>
              <p className="ds-muted text-xl">
                Simulados inteligentes, análises em tempo real e monitoramento municipal integrado em um único painel.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" />

            <div className="grid gap-4 w-full max-w-5xl md:grid-cols-3">
              {[
                { label: 'Municípios monitorados', value: '853', detail: 'Rede estadual completa' },
                { label: 'Tempo médio de estudo', value: '2h47/dia', detail: 'Meta: 3h15' },
                { label: 'Simulados concluídos', value: '18.420', detail: '+312 hoje' },
              ].map((card) => (
                <div key={card.label} className="border border-transparent p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                  <p className="text-3xl font-semibold text-white">{card.value}</p>
                  <p className="text-sm text-slate-300">{card.detail}</p>
                </div>
              ))}
            </div>

            {/* Side feature columns */}
            <div className="hidden xl:block">
              <div className="absolute inset-y-12 left-0 flex flex-col gap-4 max-w-xs">
                {FEATURE_CARDS.slice(0, 3).map((feature) => (
                  <div key={feature.title} className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left backdrop-blur-2xl shadow-xl shadow-slate-900/30 space-y-1">
                    <feature.icon className={`w-6 h-6 ${feature.color} mb-1`} />
                    <p className="text-lg font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-y-12 right-0 flex flex-col gap-4 max-w-xs text-left">
                {FEATURE_CARDS.slice(3, 6).map((feature) => (
                  <div key={feature.title} className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left backdrop-blur-2xl shadow-xl shadow-slate-900/30 space-y-1">
                    <feature.icon className={`w-6 h-6 ${feature.color} mb-1`} />
                    <p className="text-lg font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* Features Section (mobile/tablet) */}
      <section className="py-20 w-full xl:hidden">
        <div className="text-center mb-16">
          <h2 className="ds-heading text-3xl mb-4">Por que escolher nossa plataforma?</h2>
          <p className="ds-muted text-xl max-w-2xl mx-auto">Recursos avançados projetados para maximizar seu desempenho no ENEM</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_CARDS.map((feature) => (
            <div key={feature.title} className="glass-card p-8 flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-6">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="ds-heading text-xl mb-4">{feature.title}</h3>
              <p className="ds-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50K+', label: 'Estudantes Ativos', color: 'text-sky-300' },
              { value: '1M+', label: 'Questões Resolvidas', color: 'text-fuchsia-300' },
              { value: '89%', label: 'Taxa de Aprovação', color: 'text-emerald-300' },
              { value: '24/7', label: 'Suporte Disponível', color: 'text-amber-300' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_80px_rgba(15,23,42,0.6)]"
              >
                <div className={`text-4xl font-bold mb-2 transition-transform group-hover:scale-110 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-slate-300 tracking-wide uppercase text-xs">{stat.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-950/85 border-t border-white/10 py-16 px-6 sm:px-10 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
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
            <p className="text-xs text-slate-500 mt-6">
              © {new Date().getFullYear()} ENEM Ultra. Todos os direitos reservados.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/inicio" className="hover:text-white transition-colors">Dashboard</Link></li>
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
              <li><Link to="/inicio" className="hover:text-white transition-colors">Área Administrativa</Link></li>
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
      </footer>
    </div>
  </BasePage>
);
}
