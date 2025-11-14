import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';
import { SimuladosService, type SimuladoDoEnem } from '../services/simuladosService';
import { ensureUsuarioRegistro } from '../services/supabaseService';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type ResultadoAgrupado = {
  id_prova: number;
  total_respondidas: number;
  total_acertos: number;
  percentual: number;
  ultima_resposta?: string | null;
};

type NavItem = {
  label: string;
  description: string;
  path: string;
  icon: string;
};

const PRIMARY_NAV: NavItem[] = [
  { label: 'Painel do Aluno', description: 'Desempenho detalhado', path: '/painel-aluno', icon: '🎒' },
  { label: 'Ranking', description: 'Compare seu desempenho', path: '/ranking', icon: '🏆' },
  { label: 'Estatísticas', description: 'Métricas avançadas', path: '/estatisticas', icon: '📊' },
  { label: 'Simulados ENEM', description: 'Escolha novos desafios', path: '/inicio', icon: '📝' },
  { label: 'Monitor', description: 'Status em tempo real', path: '/monitor', icon: '🖥️' },
];


export default function UserLandingPage() {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<SimuladoDoEnem[]>([]);
  const [resultados, setResultados] = useState<Map<number, ResultadoAgrupado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'nao-respondidos' | 'respondidos'>('todos');

  useEffect(() => {
    void carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setErro('Usuário não autenticado');
        return;
      }

      const perfil = await ensureUsuarioRegistro(user);
      setUsuarioId(perfil.id_usuario);

      const simuladosDisponiveis = await SimuladosService.listarSimulados();
      setSimulados(simuladosDisponiveis);

      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_usuarios')
        .select('id_questao, correta, data_resposta, questoes:questoes(id_prova)')
        .eq('id_usuario', perfil.id_usuario);

      if (respostasError) {
        console.error('Erro ao buscar respostas do usuário:', respostasError);
        return;
      }

      const agregados = new Map<number, ResultadoAgrupado>();

      (respostasData ?? []).forEach((linha: any) => {
        const idProva = linha.questoes?.id_prova;
        if (!idProva) return;

        const bucket =
          agregados.get(idProva) ?? {
            id_prova: idProva,
            total_respondidas: 0,
            total_acertos: 0,
            percentual: 0,
            ultima_resposta: null as string | null,
          };

        bucket.total_respondidas += 1;
        if (linha.correta) bucket.total_acertos += 1;

        const dataResposta = linha.data_resposta as string | null;
        if (!bucket.ultima_resposta || (dataResposta && dataResposta > bucket.ultima_resposta)) {
          bucket.ultima_resposta = dataResposta;
        }

        agregados.set(idProva, bucket);
      });

      agregados.forEach((bucket, idProva) => {
        const totalQuestoes =
          simuladosDisponiveis.find((s) => s.id_prova === idProva)?.total_questoes ?? 0;
        const percentual =
          bucket.total_respondidas > 0
            ? Number(((bucket.total_acertos / bucket.total_respondidas) * 100).toFixed(2))
            : 0;

        bucket.percentual = percentual;
        if (!bucket.total_respondidas && totalQuestoes) {
          bucket.percentual = 0;
        }
      });

      setResultados(new Map(agregados.entries()));
    } catch (error) {
      console.error('Erro ao carregar simulados:', error);
      setErro('Erro ao carregar simulados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const simuladosFiltrados = useMemo(() => {
    return simulados.filter((simulado) => {
      const temResultado = resultados.has(simulado.id_prova);
      if (filtro === 'nao-respondidos') return !temResultado;
      if (filtro === 'respondidos') return temResultado;
      return true;
    });
  }, [simulados, resultados, filtro]);

  const iniciarSimulado = (idSimulado: number) => {
    navigate(`/resolver-simulado/${idSimulado}`);
  };

  if (loading) {
    return (
      <BasePage fullWidth contentClassName="py-10">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-slate-300">Carregando simulados...</p>
          </div>
        </div>
      </BasePage>
    );
  }

  const renderNavList = (title: string, subtitle: string, items: NavItem[]) => (
    <aside className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-4 shadow-[0px_15px_45px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-blue-400/50 hover:bg-blue-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/60 text-lg">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">{item.label}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );

  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex flex-1 flex-col gap-4 max-w-full xl:max-w-sm shrink-0">
          {renderNavList('Navegação Principal', 'Acesse rapidamente', PRIMARY_NAV)}
        </div>

        <main className="flex-[4] min-w-0 space-y-8">
          <header className="space-y-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/70 to-slate-800/40 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Central do Estudante</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Simulados com experiência Stripe-level em qualquer tela.
                </h1>
                <p className="text-base text-slate-400 md:max-w-2xl">
                  Continue exatamente de onde parou, acompanhe o progresso e explore novos desafios com uma interface
                  inspirada na Stripe e no storytelling mobile da Apple.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => iniciarSimulado(simuladosFiltrados[0]?.id_simulado ?? simulados[0]?.id_simulado ?? 0)}
                  className="h-12 rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-blue-100 disabled:opacity-50"
                  disabled={!simulados.length}
                >
                  Continuar simulado
                </button>
                <Link
                  to="/dashboard"
                  className="flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-blue-400 hover:text-blue-200"
                >
                  Ver estatísticas
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { label: 'Todos', value: 'todos' },
                  { label: 'Não respondidos', value: 'nao-respondidos' },
                  { label: 'Respondidos', value: 'respondidos' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFiltro(option.value)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    filtro === option.value
                      ? 'bg-blue-500 text-white shadow-[0_15px_30px_rgba(59,130,246,0.35)]'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </header>

          {erro && (
            <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {erro}
            </div>
          )}

          {!erro && simuladosFiltrados.length === 0 && (
            <div className="glass-card p-8 text-center space-y-4">
              <div className="text-5xl">📚</div>
              <p className="text-slate-300">
                {filtro === 'respondidos'
                  ? 'Você ainda não respondeu nenhum simulado. Comece agora!'
                  : 'Nenhum simulado disponível no momento.'}
              </p>
              {filtro === 'respondidos' && (
                <button
                  onClick={() => setFiltro('nao-respondidos')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Ver simulados disponíveis
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {simuladosFiltrados.map((simulado) => {
              const resultado = resultados.get(simulado.id_prova);
              const progresso = resultado
                ? Math.min(
                    100,
                    (resultado.total_respondidas / simulado.total_questoes) * 100 || 0
                  )
                : 0;

              const badgeClasse =
                resultado && resultado.percentual >= 70
                  ? 'from-green-500/20 to-emerald-500/10 border-green-400/40 text-green-200'
                  : resultado && resultado.percentual >= 50
                  ? 'from-yellow-500/20 to-amber-500/10 border-yellow-400/40 text-yellow-200'
                  : 'from-blue-500/20 to-indigo-500/10 border-blue-400/40 text-blue-200';

              return (
                <div key={simulado.id_simulado} className="glass-card p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/0 via-slate-900/10 to-blue-900/5 pointer-events-none" />

                  <div className="flex items-start gap-3 relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <BookOpenIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h2 className="text-xl font-semibold text-slate-100">{simulado.nome}</h2>
                      {simulado.descricao && (
                        <p className="text-sm text-slate-400">{simulado.descricao}</p>
                      )}
                      <div className="text-xs text-slate-500 flex gap-3">
                        <span>Ano: {simulado.ano}</span>
                        <span>Questões: {simulado.total_questoes}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span>{simulado.total_questoes} questões</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <ClockIcon className="w-5 h-5 text-yellow-400" />
                      <span>
                        {simulado.tempo_por_questao
                          ? `${simulado.tempo_por_questao} seg/questão`
                          : 'Tempo livre'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 relative">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Seu progresso</span>
                      <span>{progresso.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                    {resultado && (
                      <div className={`px-3 py-2 rounded-lg border text-sm bg-gradient-to-r ${badgeClasse}`}>
                        Aproveitamento: {resultado.percentual.toFixed(1)}% • Respondidas{' '}
                        {resultado.total_respondidas}/{simulado.total_questoes}
                      </div>
                    )}
                  </div>

                    <div className="flex gap-3 relative">
                      <button
                        onClick={() => iniciarSimulado(simulado.id_simulado)}
                        className="flex-1 inline-flex items-center justify-center gap-2 btn btn-primary"
                      >
                        Iniciar
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                      <Link to={`/provas/${simulado.id_simulado}`} className="btn btn-secondary flex-1 text-center">
                        Ver detalhes
                      </Link>
                    </div>
                </div>
              );
            })}
          </div>

          <footer className="glass-card p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-blue-300" />
              <span className="text-slate-300">
                Progresso sincronizado quando você estiver logado.
              </span>
            </div>
            <Link to="/dashboard" className="btn btn-secondary inline-flex items-center gap-2">
              <ChartIcon />
              Ver estatísticas
            </Link>
          </footer>
        </main>

        <div className="flex flex-1 flex-col gap-4 xl:max-w-sm 2xl:max-w-md shrink-0">
          <aside className="glass-card p-4 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">Precisa de ajuda?</h2>
            <p className="text-sm text-slate-400">
              Consulte a documentação ou fale com o time para desbloquear recursos extras.
            </p>
            <Link to="/monitor" className="btn btn-primary w-full text-center">
              Abrir suporte
            </Link>
          </aside>
        </div>
      </div>
    </BasePage>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l6 6 8.25-13.5" />
    </svg>
  );
}
