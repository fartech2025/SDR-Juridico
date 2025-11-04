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

export default function SimuladosPage() {
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
        setErro('UsuÃ¡rio nÃ£o autenticado');
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
        console.error('Erro ao buscar respostas do usuÃ¡rio:', respostasError);
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
      <BasePage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">â³</div>
            <p className="text-slate-300">Carregando simulados...</p>
          </div>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="ds-heading text-3xl flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-blue-400" />
              Simulados ENEM
            </h1>
            <p className="ds-muted">
              Monte sua rotina resolvendo provas anteriores e acompanhe o seu progresso.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltro('todos')}
              className={`btn ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('nao-respondidos')}
              className={`btn ${filtro === 'nao-respondidos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              NÃ£o respondidos
            </button>
            <button
              onClick={() => setFiltro('respondidos')}
              className={`btn ${filtro === 'respondidos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Respondidos
            </button>
          </div>
        </header>

        {erro && (
          <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </div>
        )}

        {!erro && simuladosFiltrados.length === 0 && (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="text-5xl">ðŸ“š</div>
            <p className="text-slate-300">
              {filtro === 'respondidos'
                ? 'VocÃª ainda nÃ£o respondeu nenhum simulado. Comece agora!'
                : 'Nenhum simulado disponÃ­vel no momento.'}
            </p>
            {filtro === 'respondidos' && (
              <button
                onClick={() => setFiltro('nao-respondidos')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Ver simulados disponÃ­veis
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <span>QuestÃµes: {simulado.total_questoes}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm relative">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span>{simulado.total_questoes} questÃµes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <ClockIcon className="w-5 h-5 text-yellow-400" />
                    <span>
                      {simulado.tempo_por_questao
                        ? `${simulado.tempo_por_questao} seg/questÃ£o`
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
                      Aproveitamento: {resultado.percentual.toFixed(1)}% â€¢ Respondidas{' '}
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
              {usuarioId
                ? `Progresso sincronizado com o usuÃ¡rio #${usuarioId}.`
                : 'Acesse sua conta para salvar o progresso.'}
            </span>
          </div>
          <Link to="/dashboard" className="btn btn-secondary inline-flex items-center gap-2">
            <ChartIcon />
            Ver estatÃ­sticas
          </Link>
        </footer>
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

